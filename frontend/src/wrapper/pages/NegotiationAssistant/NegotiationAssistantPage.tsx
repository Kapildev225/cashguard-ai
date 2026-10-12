import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  RefreshCw,
  Send,
  Check,
  Mail,
  LoaderCircle,
  AlertCircle,
  Handshake,
  FileText,
  ChevronDown,
} from "lucide-react";

import Sidebar from "../../Layout/Sidebar";
import api from "../../../lib/api";

type Tone = "friendly" | "neutral" | "strict";

interface Client {
  id?: string;
  name?: string;
  email?: string;
}

interface Invoice {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  status?: string;
  total?: number | string;
  amount?: number | string;
  currency?: string;
  dueDate?: string;
  Client?: Client;
  client?: Client;
}

const getClient = (invoice: Invoice): Client =>
  invoice.Client ?? invoice.client ?? {};

const getInvoiceNumber = (invoice: Invoice) =>
  invoice.invoiceNumber ?? invoice.invoiceNo ?? invoice.id;

const getAmount = (invoice: Invoice) =>
  Number(invoice.total ?? invoice.amount ?? 0);

function extractList(value: any): Invoice[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.invoices)) return value.invoices;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getOverdueDays(dueDate?: string) {
  if (!dueDate) return 0;

  const due = new Date(dueDate);

  if (Number.isNaN(due.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / 86_400_000)
  );
}

function generateMessage(invoice: Invoice, tone: Tone) {
  const clientName = getClient(invoice).name ?? "Customer";
  const invoiceNumber = getInvoiceNumber(invoice);
  const amount = formatCurrency(
    getAmount(invoice),
    invoice.currency ?? "INR"
  );
  const overdueDays = getOverdueDays(invoice.dueDate);

  const paymentTiming =
    overdueDays > 0
      ? `is overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`
      : "is awaiting payment";

  if (tone === "friendly") {
    return `Dear ${clientName},

I hope you are doing well!

This is a friendly follow-up regarding invoice ${invoiceNumber}, amounting to ${amount}, which ${paymentTiming}.

When convenient, could you please let us know when we can expect the payment? If you have already completed the payment, please disregard this message.

Thank you for your continued support!

Best regards,
CashGuard AI`;
  }

  if (tone === "neutral") {
    return `Dear ${clientName},

We are following up on invoice ${invoiceNumber} for ${amount}, which ${paymentTiming}.

Please arrange the payment at your earliest convenience or let us know the expected payment date.

If payment has already been made, kindly share the payment confirmation.

Regards,
CashGuard AI`;
  }

  return `Dear ${clientName},

Our records indicate that invoice ${invoiceNumber}, amounting to ${amount}, ${paymentTiming}.

Please prioritise settlement of this outstanding amount and confirm your expected payment date.

If payment has already been completed, please provide the transaction details so we can update our records.

Regards,
Accounts Team
CashGuard AI`;
}

const tones: {
  value: Tone;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "friendly",
    label: "Friendly",
    emoji: "😊",
    description: "Warm and professional",
  },
  {
    value: "neutral",
    label: "Neutral",
    emoji: "😐",
    description: "Clear and professional",
  },
  {
    value: "strict",
    label: "Strict",
    emoji: "🧊",
    description: "Firm and direct",
  },
];

export default function NegotiationAssistantPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");

  const [suggestion, setSuggestion] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === selectedInvoiceId
  );

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/invoices", {
        params: { page: 1, limit: 500 },
      });

      const body = response.data?.data ?? response.data;
      const records = extractList(body);

      const eligibleInvoices = records.filter((invoice) => {
        const status = invoice.status?.toUpperCase() ?? "";

        return !["PAID", "CANCELLED", "VOID", "DRAFT"].includes(status);
      });

      setInvoices(eligibleInvoices);

      setSelectedInvoiceId((current) => {
        if (eligibleInvoices.some((invoice) => invoice.id === current)) {
          return current;
        }

        return eligibleInvoices[0]?.id ?? "";
      });
    } catch (err: any) {
      console.error("Could not load negotiation invoices:", err);

      setError(
        err?.response?.data?.message ??
          "Could not load invoices. Check that the backend is running and you are logged in."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const regenerate = () => {
    if (!selectedInvoice) {
      setError("Select an invoice before generating a message.");
      return;
    }

    setRegenerating(true);
    setError("");
    setNotice("");

    // The message is generated from the selected invoice's actual data.
    const message = generateMessage(selectedInvoice, tone);

    setSuggestion(message);
    setDraft("");
    setEditing(false);

    setRegenerating(false);
  };

  useEffect(() => {
    if (selectedInvoice) {
      setSuggestion(generateMessage(selectedInvoice, tone));
      setDraft("");
      setEditing(false);
    } else {
      setSuggestion("");
      setDraft("");
    }
  }, [selectedInvoiceId, tone, invoices]);

  const useMessage = () => {
    if (!suggestion) return;

    setDraft(suggestion);
    setEditing(true);
    setNotice("Message loaded into the editor. Review it before sending.");
    setError("");
  };

  const sendMessage = () => {
    if (!selectedInvoice) {
      setError("Select an invoice first.");
      return;
    }

    const recipient = getClient(selectedInvoice).email;

    if (!recipient) {
      setError(
        "This client's email address is missing. Add the client's email in the Clients page before sending."
      );
      return;
    }

    const messageToSend = (editing ? draft : suggestion).trim();

    if (!messageToSend) {
      setError("The message cannot be empty.");
      return;
    }

    const subject = `Payment follow-up — Invoice ${getInvoiceNumber(selectedInvoice)}`;

    const mailto =
      `mailto:${encodeURIComponent(recipient)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(messageToSend)}`;

    setNotice(
      "Opening your default email application. Review the email and send it there."
    );
    setError("");

    window.location.href = mailto;
  };

  const selectedTone = tones.find((item) => item.value === tone);

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen overflow-hidden px-5 py-6 md:ml-[270px] md:px-8">
        <header className="mb-7">
          <div className="text-sm text-slate-400">
            CashGuard AI <span className="mx-2">→</span>
            <span className="font-semibold text-slate-700">
              Negotiation Assistant
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Handshake className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  AI Negotiation Assistant
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Let AI help you draft the right tone for payment conversations.
                </p>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">{error}</div>

            <button
              onClick={() => void loadInvoices()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <Check className="h-5 w-5 shrink-0" />
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              className="ml-auto font-semibold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.6fr)]">
          {/* Tone and invoice selection */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Bot className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold">Select Tone</h2>
                <p className="text-xs text-slate-500">
                  Choose how the message should sound.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {tones.map((item) => {
                const active = tone === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setTone(item.value);
                      setNotice("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200"
                        : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        active
                          ? "border-violet-600"
                          : "border-slate-300"
                      }`}
                    >
                      {active && (
                        <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                      )}
                    </span>

                    <span className="text-xl">{item.emoji}</span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 border-t border-slate-100 pt-6">
              <label
                htmlFor="invoice-select"
                className="mb-2 block text-sm font-semibold"
              >
                Select Invoice
              </label>

              <div className="relative">
                <select
                  id="invoice-select"
                  value={selectedInvoiceId}
                  onChange={(event) => {
                    setSelectedInvoiceId(event.target.value);
                    setNotice("");
                  }}
                  disabled={loading || invoices.length === 0}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
                >
                  {loading && <option value="">Loading invoices...</option>}

                  {!loading && invoices.length === 0 && (
                    <option value="">No eligible invoices available</option>
                  )}

                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {getInvoiceNumber(invoice)} —{" "}
                      {getClient(invoice).name ?? "Unknown client"}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>

              {selectedInvoice && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Selected invoice
                  </p>

                  <p className="mt-2 font-semibold">
                    {getClient(selectedInvoice).name ?? "Unknown client"}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {getClient(selectedInvoice).email ??
                      "No client email available"}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">Invoice amount</span>
                    <span className="font-bold">
                      {formatCurrency(
                        getAmount(selectedInvoice),
                        selectedInvoice.currency ?? "INR"
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">Payment status</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {selectedInvoice.status ?? "Outstanding"}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={regenerate}
                disabled={!selectedInvoice || loading || regenerating}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {regenerating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Generate Message
              </button>
            </div>
          </section>

          {/* Suggested message */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Suggested Message</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Review the draft before contacting your client.
                </p>
              </div>

              {selectedInvoice && (
                <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
                  To: {getClient(selectedInvoice).name ?? "Client"}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading invoice information...
              </div>
            ) : !selectedInvoice ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <FileText className="mb-3 h-10 w-10 text-slate-300" />

                <p className="font-semibold">No invoice selected</p>

                <p className="mt-1 text-sm text-slate-500">
                  Create an eligible invoice or refresh your invoice data.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/invoices")}
                  className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  View invoices
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                    {selectedTone?.emoji} {selectedTone?.label}
                  </span>

                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                    Invoice {getInvoiceNumber(selectedInvoice)}
                  </span>

                  {getOverdueDays(selectedInvoice.dueDate) > 0 && (
                    <span className="rounded-lg bg-red-50 px-2.5 py-1.5 font-medium text-red-600">
                      {getOverdueDays(selectedInvoice.dueDate)} days overdue
                    </span>
                  )}
                </div>

                <div className="min-h-[320px] rounded-xl border border-slate-200 bg-[#fafaff] p-5">
                  {editing ? (
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      aria-label="Edit payment follow-up message"
                      className="min-h-[310px] w-full resize-y bg-transparent text-sm leading-7 text-slate-700 outline-none"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {suggestion}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={regenerating}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>

                  <button
                    type="button"
                    onClick={useMessage}
                    disabled={!suggestion}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Use This Message
                  </button>

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!suggestion}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Send Now
                  </button>
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-800">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>
                    Send Now opens your default email application with the
                    recipient, subject, and message filled in. You must review
                    and send the email from that application.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="mt-5 flex items-center gap-2 text-xs text-slate-400">
          <Bot className="h-4 w-4" />
          Messages are drafted using the selected invoice details. Review
          the recipient and content before sending.
        </footer>
      </main>
    </div>
  );
}