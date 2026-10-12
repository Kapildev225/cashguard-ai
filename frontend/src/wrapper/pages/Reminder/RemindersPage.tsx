import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import Sidebar from "../../Layout/Sidebar";

type InvoiceOption = {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  status?: string;
  dueDate?: string;
  client?: { name?: string };
  Client?: { name?: string };
  clientName?: string;
};

type Reminder = {
  id: string;
  scheduledAt?: string;
  status?: string;
  createdAt?: string;
  invoice?: InvoiceOption;
  Invoice?: InvoiceOption;
};

const unwrap = (response: any, key: string): any[] => {
  const body = response?.data;
  const value = body?.data?.[key] ?? body?.[key] ?? (Array.isArray(body?.data) ? body.data : []);
  return Array.isArray(value) ? value : [];
};

const dateLabel = (value?: string) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
};

const normalizedStatus = (value?: string) => String(value || "PENDING").toUpperCase();

export const RemindersPage = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [remindersResponse, invoicesResponse] = await Promise.all([
        api.get("/reminders"),
        api.get("/invoices", { params: { page: 1, limit: 100 } }),
      ]);
      setReminders(unwrap(remindersResponse, "reminders"));
      setInvoices(unwrap(invoicesResponse, "invoices"));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load reminder data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const queueCount = reminders.filter((r) => ["PENDING", "QUEUED", "IN_QUEUE"].includes(normalizedStatus(r.status))).length;
  const sentCount = reminders.filter((r) => normalizedStatus(r.status) === "SENT").length;
  const scheduledCount = reminders.filter((r) => normalizedStatus(r.status) === "SCHEDULED").length;
  const failedCount = reminders.filter((r) => ["FAILED", "ERROR"].includes(normalizedStatus(r.status))).length;

  const filteredReminders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reminders.filter((reminder) => {
      const invoice = reminder.invoice || reminder.Invoice;
      const status = normalizedStatus(reminder.status);
      const client = invoice?.client?.name || invoice?.Client?.name || invoice?.clientName || "";
      const number = invoice?.invoiceNumber || invoice?.invoiceNo || "";
      const matchStatus = statusFilter === "ALL" || status === statusFilter;
      const matchSearch = !query || `${client} ${number} ${status}`.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [reminders, search, statusFilter]);

  const scheduleReminder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedInvoice || !scheduledAt) {
      setError("Please select an invoice and reminder time.");
      return;
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setError("Choose a reminder time in the future.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reminders", { invoiceId: selectedInvoice, scheduledAt: new Date(scheduledAt).toISOString() });
      setSelectedInvoice("");
      setScheduledAt("");
      setShowForm(false);
      setSuccess("Reminder scheduled successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to schedule reminder.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!window.confirm("Delete this reminder?")) return;
    setDeletingId(id);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/reminders/${id}`);
      setSuccess("Reminder deleted.");
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete reminder.");
    } finally {
      setDeletingId("");
    }
  };

  const statusStyle = (status: string) => {
    if (status === "SENT") return "bg-emerald-100 text-emerald-700";
    if (["FAILED", "ERROR"].includes(status)) return "bg-rose-100 text-rose-700";
    if (status === "SCHEDULED") return "bg-violet-100 text-violet-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />
      <main className="ml-0 min-h-screen min-w-0 md:ml-[270px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-4 bg-white/95 px-5 py-3 backdrop-blur lg:px-8">
          <p className="text-sm text-slate-400">CashGuard AI <span className="mx-2">→</span><span className="font-semibold text-slate-800">Reminders</span></p>
          <div className="flex items-center gap-3">
            <label className="relative hidden sm:block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything..." aria-label="Search reminders"
                className="h-10 w-52 rounded-xl bg-slate-50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/25 lg:w-72" />
            </label>
            <button type="button" onClick={() => navigate("/notifications")} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm hover:bg-violet-50">♧</button>
            <button type="button" onClick={() => navigate("/settings")} aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">AD</button>
          </div>
        </header>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reminders</h1>
              <p className="mt-1 text-[15px] text-slate-500">Automated follow-up queue for outstanding invoices.</p>
            </div>
            <button type="button" onClick={() => { setShowForm((open) => !open); setError(""); setSuccess(""); }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-105">
              <span className="text-lg">{showForm ? "×" : "+"}</span> {showForm ? "Close Form" : "New Reminder"}
            </button>
          </div>

          {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => void loadData()} className="font-semibold underline">Retry</button></div>}
          {success && <div role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

          {showForm && <form onSubmit={scheduleReminder} className="mb-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold">Schedule a reminder</h2>
            <p className="mt-1 text-sm text-slate-500">Choose an invoice and a future date and time.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_1fr_auto] md:items-end">
              <label className="block text-sm font-semibold text-slate-600">Invoice
                <select required value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)} className="mt-2 h-11 w-full rounded-xl bg-slate-50 px-3 font-normal text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/25">
                  <option value="">Select an invoice…</option>
                  {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber || invoice.invoiceNo || invoice.id} — {invoice.client?.name || invoice.Client?.name || invoice.clientName || "Client"}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-600">Reminder date & time
                <input required type="datetime-local" min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-2 h-11 w-full rounded-xl bg-slate-50 px-3 font-normal text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/25" />
              </label>
              <button disabled={submitting} type="submit" className="h-11 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">{submitting ? "Scheduling…" : "Schedule reminder"}</button>
            </div>
          </form>}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "In Queue", value: queueCount, icon: "◷", tone: "bg-blue-100 text-blue-700" },
              { label: "Sent", value: sentCount, icon: "✓", tone: "bg-emerald-100 text-emerald-700" },
              { label: "Scheduled", value: scheduledCount, icon: "♧", tone: "bg-violet-100 text-violet-700" },
              { label: "Failed", value: failedCount, icon: "!", tone: "bg-rose-100 text-rose-700" },
            ].map((card) => <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${card.tone}`}>{card.icon}</span>
                <span className="text-xs font-medium text-slate-400">Live data</span></div>
              <p className="mt-4 text-2xl font-bold tracking-tight">{loading ? "—" : card.value}</p><p className="mt-1 text-sm font-medium text-slate-500">{card.label}</p>
            </div>)}
          </div>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
              <div><h2 className="text-lg font-bold">Reminder Queue</h2><p className="mt-1 text-sm text-slate-500">Manage scheduled and completed invoice follow-ups.</p></div>
              <select aria-label="Filter reminders by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/25">
                <option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="QUEUED">Queued</option><option value="SCHEDULED">Scheduled</option><option value="SENT">Sent</option><option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-sm">
                <thead><tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-4 sm:px-6">Client</th><th className="px-5 py-4">Invoice #</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Next Run</th><th className="px-5 py-4 sm:px-6">Actions</th>
                </tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading reminders…</td></tr>}
                  {!loading && !error && filteredReminders.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No reminders match this filter.</td></tr>}
                  {!loading && filteredReminders.map((reminder) => {
                    const invoice = reminder.invoice || reminder.Invoice;
                    const status = normalizedStatus(reminder.status);
                    return <tr key={reminder.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-medium text-slate-700 sm:px-6">{invoice?.client?.name || invoice?.Client?.name || invoice?.clientName || "Client"}</td>
                      <td className="px-5 py-4 font-mono text-[13px] text-slate-600">{invoice?.invoiceNumber || invoice?.invoiceNo || "—"}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(status)}`}>{status.replaceAll("_", " ")}</span></td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{dateLabel(reminder.scheduledAt)}</td>
                      <td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3">
                        {invoice?.id && <button type="button" onClick={() => navigate(`/invoices/preview/${invoice.id}`)} className="font-semibold text-violet-600 hover:text-violet-800 hover:underline">View invoice</button>}
                        <button type="button" disabled={deletingId === reminder.id} onClick={() => void deleteReminder(reminder.id)} className="font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50">{deletingId === reminder.id ? "Deleting…" : "Delete"}</button>
                      </div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <span className="text-xs text-slate-400">Showing {loading ? 0 : filteredReminders.length} of {reminders.length} reminders</span>
              <button type="button" onClick={() => navigate("/invoices")} className="text-sm font-semibold text-violet-600 hover:text-violet-800">View invoices →</button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default RemindersPage;
