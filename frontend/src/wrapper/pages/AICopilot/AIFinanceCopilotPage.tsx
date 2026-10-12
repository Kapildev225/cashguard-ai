import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Send,
  LoaderCircle,
  RefreshCw,
  FileText,
  Wallet,
  AlertTriangle,
  Handshake,
  CircleHelp,
  ArrowRight,
  User,
  Sparkles,
} from "lucide-react";

import Sidebar from "../../Layout/Sidebar";
import api from "../../../lib/api";

interface Invoice {
  id: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  status?: string;
  total?: number | string;
  amount?: number | string;
  currency?: string;
  dueDate?: string;
  Client?: {
    id: string;
    name: string;
    email?: string;
  };
  client?: {
    id: string;
    name: string;
    email?: string;
  };
  clientId?: string;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const formatCurrency = (amount: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

const getInvoiceAmount = (invoice: Invoice) =>
  Number(invoice.total ?? invoice.amount ?? 0);

const getClientName = (invoice: Invoice) =>
  invoice.Client?.name ?? invoice.client?.name ?? "Unknown client";

const getInvoiceNumber = (invoice: Invoice) =>
  invoice.invoiceNo ?? invoice.invoiceNumber ?? invoice.id;

function getList<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.invoices)) return value.invoices;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function isOutstanding(invoice: Invoice) {
  return !["PAID", "CANCELLED", "VOID", "DRAFT"].includes(
    invoice.status?.toUpperCase() ?? ""
  );
}

function isOverdue(invoice: Invoice) {
  if (invoice.status?.toUpperCase() === "OVERDUE") return true;

  if (!invoice.dueDate || !isOutstanding(invoice)) return false;

  return new Date(invoice.dueDate).getTime() < Date.now();
}

export default function AIFinanceCopilotPage() {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I'm your AI Finance Copilot ✨ How can I help today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmReminders, setConfirmReminders] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/invoices", {
        params: { page: 1, limit: 500 },
      });

      const body = response.data?.data ?? response.data;
      setInvoices(getList<Invoice>(body));
    } catch (err: any) {
      console.error("Finance Copilot invoice request failed:", err);

      setError(
        err?.response?.data?.message ??
          "Could not load invoice data. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const overdueInvoices = invoices.filter(isOverdue);

  const overdueTotal = overdueInvoices.reduce(
    (sum, invoice) => sum + getInvoiceAmount(invoice),
    0
  );

  const outstandingInvoices = invoices.filter(isOutstanding);

  const outstandingTotal = outstandingInvoices.reduce(
    (sum, invoice) => sum + getInvoiceAmount(invoice),
    0
  );

  const getRiskyInvoices = () =>
    [...overdueInvoices].sort(
      (a, b) => getInvoiceAmount(b) - getInvoiceAmount(a)
    );

  const getAnswer = (question: string): string => {
    const query = question.toLowerCase();

    if (
      query.includes("overdue") ||
      query.includes("late payment") ||
      query.includes("past due")
    ) {
      if (!overdueInvoices.length) {
        return "There are no overdue invoices in the available invoice records.";
      }

      const details = getRiskyInvoices()
        .slice(0, 5)
        .map(
          (invoice) =>
            `• ${getInvoiceNumber(invoice)} — ${getClientName(invoice)} — ${formatCurrency(getInvoiceAmount(invoice), invoice.currency ?? "INR")}`
        )
        .join("\n");

      return `You have ${overdueInvoices.length} overdue invoices totalling ${formatCurrency(overdueTotal)}.\n\n${details}\n\nWould you like to open the Reminders page to schedule follow-ups?`;
    }

    if (
      query.includes("cash flow") ||
      query.includes("cashflow") ||
      query.includes("outstanding") ||
      query.includes("receivable")
    ) {
      return `Based on the currently available invoice records:\n\n• Outstanding invoices: ${outstandingInvoices.length}\n• Total outstanding invoice value: ${formatCurrency(outstandingTotal)}\n• Overdue invoices: ${overdueInvoices.length}\n• Overdue invoice value: ${formatCurrency(overdueTotal)}\n\nThese figures use invoice totals and statuses. They are not a complete cash-flow forecast because future expenses and other cash movements are not included.`;
    }

    if (
      query.includes("risky client") ||
      query.includes("high risk") ||
      query.includes("risk")
    ) {
      if (!overdueInvoices.length) {
        return "No overdue invoices were identified. That alone does not establish that every client is low risk.";
      }

      const grouped = new Map<
        string,
        { name: string; amount: number; count: number }
      >();

      overdueInvoices.forEach((invoice) => {
        const key = invoice.clientId ?? invoice.Client?.id ?? invoice.client?.id ?? getClientName(invoice);
        const existing = grouped.get(key) ?? {
          name: getClientName(invoice),
          amount: 0,
          count: 0,
        };

        existing.amount += getInvoiceAmount(invoice);
        existing.count += 1;

        grouped.set(key, existing);
      });

      const details = [...grouped.values()]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(
          (client, index) =>
            `${index + 1}. ${client.name} — ${client.count} overdue invoice(s), ${formatCurrency(client.amount)}`
        )
        .join("\n");

      return `Clients with the largest overdue balances:\n\n${details}\n\nThis is a ranking by overdue balance, not a validated AI credit-risk prediction.`;
    }

    if (
      query.includes("reminder") ||
      query.includes("follow-up") ||
      query.includes("follow up")
    ) {
      if (!overdueInvoices.length) {
        return "There are no overdue invoices to follow up on in the current records.";
      }

      setConfirmReminders(true);

      return `There are ${overdueInvoices.length} overdue invoices totalling ${formatCurrency(overdueTotal)}. Review the invoice list and confirm below if you want to create reminder records for these invoices.`;
    }

    if (
      query.includes("report") ||
      query.includes("summary") ||
      query.includes("overview")
    ) {
      return `Finance overview based on your available invoice records:\n\n• Total invoices: ${invoices.length}\n• Outstanding invoices: ${outstandingInvoices.length}\n• Outstanding invoice value: ${formatCurrency(outstandingTotal)}\n• Overdue invoices: ${overdueInvoices.length}\n• Overdue invoice value: ${formatCurrency(overdueTotal)}\n\nUse the quick actions to explore specific details.`;
    }

    if (
      query.includes("help") ||
      query.includes("what can you do")
    ) {
      return "I can answer questions using the invoice data available to me. Try asking:\n\n• Show me overdue invoices\n• Give me a cash flow summary\n• Which clients have the largest overdue balances?\n• Generate a finance overview\n• Help me review payment reminders";
    }

    return "I can analyse the invoice records currently available to this application. Try asking about overdue invoices, outstanding balances, cash flow, clients with overdue payments, or a finance summary.";
  };

  const sendMessage = async (text = input) => {
    const question = text.trim();

    if (!question || sending) return;

    setInput("");
    setConfirmReminders(false);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
    };

    setMessages((previous) => [...previous, userMessage]);
    setSending(true);

    try {
      if (loading) {
        await loadInvoices();
      }

      const answer = getAnswer(question);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: answer,
        },
      ]);
    } catch (err) {
      console.error("Finance Copilot failed:", err);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "I couldn't complete that request. Please check your connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const createReminders = async () => {
    if (!overdueInvoices.length) return;

    setSending(true);
    setError("");

    let created = 0;
    const failures: string[] = [];

    try {
      for (const invoice of overdueInvoices) {
        try {
          await api.post("/reminders", {
            invoiceId: invoice.id,
            scheduledAt: new Date().toISOString(),
          });

          created += 1;
        } catch (err: any) {
          failures.push(
            `${getInvoiceNumber(invoice)}: ${
              err?.response?.data?.message ?? "Request failed"
            }`
          );
        }
      }

      setConfirmReminders(false);

      const result =
        `Created ${created} reminder record(s).` +
        (failures.length
          ? `\n\n${failures.length} reminder(s) could not be created:\n${failures.slice(0, 3).join("\n")}`
          : "");

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const quickActions = [
    {
      label: "Show me overdue invoices",
      icon: FileText,
      question: "Show me overdue invoices",
    },
    {
      label: "Cash flow summary",
      icon: Wallet,
      question: "Give me a cash flow summary",
    },
    {
      label: "Top risky clients",
      icon: AlertTriangle,
      question: "Show me the clients with the largest overdue balances",
    },
    {
      label: "Generate report",
      icon: FileText,
      question: "Generate a finance overview report",
    },
    {
      label: "Negotiation Assistant",
      icon: Handshake,
      action: () => navigate("/negotiation-assistant"),
    },
    {
      label: "Help",
      icon: CircleHelp,
      question: "Help",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen px-5 py-6 md:ml-[270px] md:px-8">
        <header className="mb-6">
          <p className="text-sm text-slate-400">
            CashGuard AI <span className="mx-2">→</span> AI Finance Copilot
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AI Finance Copilot
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Ask questions about your cash flow, clients, and invoices.
              </p>
            </div>

            <button
              onClick={() => void loadInvoices()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh data
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => void loadInvoices()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_435px]">
          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:h-[calc(100vh-260px)]">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Bot className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-semibold">Finance Assistant</h2>
                <p className="text-xs text-slate-500">
                  {loading ? "Loading your financial data..." : "Using available invoice data"}
                </p>
              </div>

              <Sparkles className="ml-auto h-5 w-5 text-indigo-500" />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "rounded-bl-sm bg-[#f1f0fa] text-slate-700"
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Analysing your request...
                </div>
              )}

              {confirmReminders && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Create reminder records for all {overdueInvoices.length} overdue invoices?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    This creates database records. It does not guarantee that an email will be sent immediately.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => void createReminders()}
                      disabled={sending}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Confirm and create
                    </button>

                    <button
                      onClick={() => setConfirmReminders(false)}
                      className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
              className="border-t border-slate-100 p-4"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold">Quick Actions</h2>
              <p className="mt-1 text-xs text-slate-500">
                Explore your financial data
              </p>
            </div>

            <div className="space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    onClick={() => {
                      if ("action" in action && action.action) {
                        action.action();
                      } else if ("question" in action) {
                        void sendMessage(action.question);
                      }
                    }}
                    disabled={sending}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{action.label}</span>
                    <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl bg-indigo-50 p-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-semibold">Financial snapshot</p>
              </div>

              {loading ? (
                <p className="mt-3 text-sm text-slate-500">
                  Loading invoice data...
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600">
                      Outstanding invoices
                    </span>
                    <span className="text-sm font-bold">
                      {outstandingInvoices.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600">
                      Outstanding value
                    </span>
                    <span className="text-sm font-bold">
                      {formatCurrency(outstandingTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600">
                      Overdue invoices
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {overdueInvoices.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600">
                      Overdue value
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {formatCurrency(overdueTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/invoices")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View invoices <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}