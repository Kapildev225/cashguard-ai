import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../Layout/Sidebar";
import { useInvoices } from "../../hooks/useInvoices";
import api from "../../../lib/api";
import type { Invoice } from "../../types/invoice";

const dateLabel = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
};

const formatMoney = (amount: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(amount)) ? Number(amount) : 0);

const extractInvoice = (response: any): Invoice | null => {
  const value = response?.data?.data ?? response?.data ?? response;
  if (value?.invoice) return value.invoice as Invoice;
  if (value?.id && value?.items) return value as Invoice;
  return null;
};

export const InvoicePreviewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { invoices, loading: listLoading, error: listError } = useInvoices(1, "");
  const [remoteInvoice, setRemoteInvoice] = useState<Invoice | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setRemoteInvoice(null);
      setRemoteError("");
      return;
    }
    setRemoteLoading(true);
    setRemoteError("");
    api.get(`/invoices/${id}`)
      .then((response: any) => {
        if (cancelled) return;
        const invoice = extractInvoice(response);
        if (!invoice) setRemoteError("The invoice API did not return an invoice for this ID.");
        setRemoteInvoice(invoice);
      })
      .catch((error: any) => {
        if (!cancelled) setRemoteError(error?.response?.data?.message || error?.message || "Could not load this invoice.");
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const invoice = useMemo(() => {
    if (id) return remoteInvoice;
    return invoices[0] ?? null;
  }, [id, remoteInvoice, invoices]);

  const loading = id ? remoteLoading : listLoading;
  const error = id ? remoteError : listError;

  const subtotal = (invoice?.items ?? []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0,
  );
  const tax = Number(invoice?.tax || 0);
  const total = Number(invoice?.total ?? subtotal + tax);
  const currency = invoice?.currency || "INR";
  const client = invoice?.client;

  const downloadPdf = () => {
    if (!invoice) return;
    // Browser print dialog lets the user save this invoice as a PDF without a fake download.
    window.print();
  };

  const sendInvoice = async () => {
    if (!invoice) return;
    setSending(true);
    setSendMessage("");
    setSendError("");
    try {
      await api.post(`/invoices/${invoice.id}/send`, {});
      setSendMessage("Invoice send request completed.");
    } catch (error: any) {
      setSendError(error?.response?.data?.message || error?.message || "Unable to send invoice. Check the backend connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <div className="print:hidden"><Sidebar /></div>
      <main className="ml-0 min-h-screen min-w-0 md:ml-[270px]">
        <header className="print:hidden sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-4 bg-white/95 px-5 py-3 backdrop-blur lg:px-8">
          <div className="text-sm text-slate-400">
            CashGuard AI <span className="mx-2">→</span>
            <span className="font-semibold text-slate-800">Invoice Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative hidden sm:block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input placeholder="Search anything..." aria-label="Search anything"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.currentTarget.value.trim()) {
                    navigate(`/invoices?search=${encodeURIComponent(event.currentTarget.value.trim())}`);
                  }
                }}
                className="h-10 w-52 rounded-xl bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/25 lg:w-72" />
            </label>
            <button type="button" onClick={() => navigate("/notifications")} aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm transition hover:bg-violet-50">♧</button>
            <button type="button" onClick={() => navigate("/settings")} aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">AD</button>
          </div>
        </header>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => navigate("/invoices")}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <span aria-hidden="true">←</span> Back
            </button>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={downloadPdf} disabled={!invoice || loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                <span aria-hidden="true">⇩</span> Download PDF
              </button>
              <button type="button" onClick={sendInvoice} disabled={!invoice || loading || sending}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
                <span aria-hidden="true">➤</span> {sending ? "Sending…" : "Send Invoice"}
              </button>
            </div>
          </div>

          {sendMessage && <p role="status" className="print:hidden mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{sendMessage}</p>}
          {sendError && <p role="alert" className="print:hidden mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{sendError}</p>}
          {loading && <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500 shadow-sm">Loading invoice preview…</div>}
          {!loading && error && <div role="alert" className="rounded-2xl bg-white p-8 text-sm text-rose-700 shadow-sm">{error}</div>}
          {!loading && !error && !invoice && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <h1 className="text-xl font-bold">No invoice to preview</h1>
              <p className="mt-2 text-sm text-slate-500">Create an invoice first, then open its preview.</p>
              <button type="button" onClick={() => navigate("/invoices")}
                className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Go to Invoice Builder</button>
            </div>
          )}

          {!loading && !error && invoice && (
            <article className="invoice-paper mx-auto max-w-[746px] rounded-[22px] bg-white px-7 py-8 shadow-sm sm:px-10 sm:py-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg text-white">◇</div>
                  <div>
                    <h1 className="text-base font-bold tracking-tight text-slate-900">CashGuard AI</h1>
                    <p className="mt-1 text-xs text-slate-400">Smart Invoice</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-slate-900">Invoice #{invoice.invoiceNumber || invoice.id}</p>
                  <p className="mt-1 text-sm text-slate-500">Date: {dateLabel((invoice as any).invoiceDate || (invoice as any).createdAt)}</p>
                  <p className="mt-1 text-sm text-slate-500">Due: {dateLabel(invoice.dueDate)}</p>
                  <span className="mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">{invoice.status}</span>
                </div>
              </div>

              <div className="mt-10 grid gap-7 text-sm sm:grid-cols-2">
                <section>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">From</p>
                  <p className="font-semibold text-slate-900">Your Company</p>
                  <p className="mt-1 text-slate-600">Business address</p>
                  <p className="mt-1 text-slate-600">India</p>
                </section>
                <section>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Bill To</p>
                  <p className="font-semibold text-slate-900">{client?.name || (invoice as any).clientName || "Client"}</p>
                  {client?.email && <p className="mt-1 text-slate-600">{client.email}</p>}
                  {client?.phone && <p className="mt-1 text-slate-600">{client.phone}</p>}
                  {client?.company && <p className="mt-1 text-slate-600">{client.company}</p>}
                </section>
              </div>

              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[470px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 pr-3">Item</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Rate</th>
                      <th className="py-3 pl-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.items || []).map((item, index) => (
                      <tr key={`${item.description}-${index}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-3 pr-3 text-slate-700">{item.description}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{formatMoney(Number(item.unitPrice || 0), currency)}</td>
                        <td className="py-3 pl-3 text-right font-medium text-slate-800">{formatMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0), currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto mt-6 max-w-[260px] space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 text-slate-500"><span>Sub Total</span><span className="font-semibold text-slate-800">{formatMoney(subtotal, currency)}</span></div>
                <div className="flex items-center justify-between gap-4 text-slate-500"><span>Tax</span><span className="font-semibold text-slate-800">{formatMoney(tax, currency)}</span></div>
                <div className="my-1 h-px bg-slate-100" />
                <div className="flex items-center justify-between gap-4 text-base font-bold text-slate-900"><span>Total</span><span className="text-xl text-emerald-500">{formatMoney(total, currency)}</span></div>
              </div>

              {invoice.notes && <div className="mt-7 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><p className="mb-1 font-semibold text-slate-800">Notes</p>{invoice.notes}</div>}
              <p className="mt-9 text-center text-sm text-slate-400">Thank you for your business 🙏</p>
            </article>
          )}
        </section>
      </main>
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .invoice-paper { max-width: none !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoicePreviewPage;
