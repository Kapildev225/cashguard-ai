import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../lib/api";
import Sidebar from "../../../Layout/Sidebar";

type InvoiceRow = {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  total?: number;
  amount?: number;
  status?: string;
  dueDate?: string;
  client?: { name?: string };
  Client?: { name?: string };
  clientName?: string;
};

type PaymentFilter = "ALL" | "PAID" | "PENDING" | "OVERDUE";

const statusFor = (invoice: InvoiceRow): "PAID" | "PENDING" | "OVERDUE" => {
  const status = String(invoice.status || "").toUpperCase();
  if (status === "PAID") return "PAID";
  if (status === "OVERDUE" || (invoice.dueDate && new Date(invoice.dueDate) < new Date() && status !== "DRAFT" && status !== "CANCELLED")) return "OVERDUE";
  return "PENDING";
};

const money = (value: unknown, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 })
    .format(Number.isFinite(Number(value)) ? Number(value) : 0);

const dateLabel = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const unwrapList = (response: any): InvoiceRow[] => {
  const body = response?.data;
  const value = body?.data?.invoices ?? body?.invoices ?? body?.data;
  return Array.isArray(value) ? value : [];
};

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/invoices", { params: { page: 1, limit: 100 } });
      setInvoices(unwrapList(response));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Unable to load payment tracking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadInvoices(); }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const status = statusFor(invoice);
      const client = invoice.client?.name || invoice.Client?.name || invoice.clientName || "";
      const number = invoice.invoiceNumber || invoice.invoiceNo || invoice.id;
      const matchesFilter = filter === "ALL" || status === filter;
      const matchesSearch = !query || `${number} ${client} ${status}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [invoices, filter, search]);

  const counts = useMemo(() => ({
    paid: invoices.filter((invoice) => statusFor(invoice) === "PAID").length,
    pending: invoices.filter((invoice) => statusFor(invoice) === "PENDING").length,
    overdue: invoices.filter((invoice) => statusFor(invoice) === "OVERDUE").length,
  }), [invoices]);

  const badgeClass = (status: string) => status === "PAID"
    ? "bg-emerald-100 text-emerald-700"
    : status === "OVERDUE" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />
      <main className="ml-0 min-h-screen min-w-0 md:ml-[270px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-4 bg-white/95 px-5 py-3 backdrop-blur lg:px-8">
          <p className="text-sm text-slate-400">CashGuard AI <span className="mx-2">→</span><span className="font-semibold text-slate-800">Payment Tracking</span></p>
          <div className="flex items-center gap-3">
            <label className="relative hidden sm:block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything..." aria-label="Search payments"
                className="h-10 w-52 rounded-xl bg-slate-50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/25 lg:w-72" />
            </label>
            <button type="button" onClick={() => navigate("/notifications")} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm hover:bg-violet-50">♧</button>
            <button type="button" onClick={() => navigate("/settings")} aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">AD</button>
          </div>
        </header>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Tracking</h1>
              <p className="mt-1 text-[15px] text-slate-500">Monitor invoice status across your entire pipeline.</p>
            </div>
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments..." aria-label="Search payments"
                className="h-10 w-64 rounded-xl bg-white pl-9 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-violet-500/25" />
            </label>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Paid", value: counts.paid, tone: "bg-emerald-50 text-emerald-700", icon: "✓" },
              { label: "Pending", value: counts.pending, tone: "bg-amber-50 text-amber-700", icon: "◷" },
              { label: "Overdue", value: counts.overdue, tone: "bg-rose-50 text-rose-700", icon: "!" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{card.label} invoices</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold ${card.tone}`}>{card.icon}</span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">{loading ? "—" : card.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">
            {(["ALL", "PAID", "PENDING", "OVERDUE"] as PaymentFilter[]).map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${filter === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {item === "ALL" ? "All" : item.charAt(0) + item.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-sm">
                <thead><tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-4 sm:px-6">Invoice #</th><th className="px-5 py-4">Client</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Due Date</th><th className="px-5 py-4 sm:px-6">Action</th>
                </tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading payment records…</td></tr>}
                  {!loading && error && <tr><td colSpan={6} className="px-6 py-10 text-center text-rose-700">{error}<button type="button" onClick={() => void loadInvoices()} className="ml-3 font-semibold text-violet-700 underline">Retry</button></td></tr>}
                  {!loading && !error && rows.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No matching invoices found.</td></tr>}
                  {!loading && !error && rows.map((invoice) => {
                    const status = statusFor(invoice);
                    return <tr key={invoice.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-[13px] text-slate-700 sm:px-6">{invoice.invoiceNumber || invoice.invoiceNo || invoice.id}</td>
                      <td className="px-5 py-4 font-medium text-slate-700">{invoice.client?.name || invoice.Client?.name || invoice.clientName || "Client"}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800">{money(invoice.total ?? invoice.amount)}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(status)}`}>{status === "PENDING" ? "Pending" : status.charAt(0) + status.slice(1).toLowerCase()}</span></td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{dateLabel(invoice.dueDate)}</td>
                      <td className="px-5 py-4 sm:px-6"><button type="button" onClick={() => navigate(`/invoices/preview/${invoice.id}`)} className="font-semibold text-violet-600 transition hover:text-violet-800 hover:underline">View</button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <span className="text-xs text-slate-400">Showing {loading ? 0 : rows.length} invoice{rows.length === 1 ? "" : "s"}</span>
              <button type="button" onClick={() => navigate("/invoices")} className="text-sm font-semibold text-violet-600 hover:text-violet-800">View all invoices →</button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default PaymentsPage;
