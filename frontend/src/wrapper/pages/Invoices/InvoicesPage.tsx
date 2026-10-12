import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "../../hooks/useInvoices";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceForm } from "./InvoiceForm";
import type { Invoice } from "../../types/invoice";
import Sidebar from "../../Layout/Sidebar";

type SortColumn = "invoiceNumber" | "clientName" | "total" | "status" | "dueDate";
type SortDirection = "asc" | "desc";

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("invoiceNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [search, setSearch] = useState("");
  const { invoices, totalPages, loading, error, createInvoice, updateInvoice, deleteInvoice } =
    useInvoices(page, status, sortColumn, sortDirection);

  const handleSort = (column: SortColumn) => {
    setSortDirection(sortColumn === column ? (sortDirection === "asc" ? "desc" : "asc") : "asc");
    setSortColumn(column);
    setPage(1);
  };
  const handleSubmit = async (input: any) => {
    if (editing) await updateInvoice(editing.id, input);
    else await createInvoice(input);
    setShowForm(false);
    setEditing(null);
  };
  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this invoice? This action cannot be undone.")) await deleteInvoice(id);
  };
  const visibleInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? invoices.filter((inv: any) => [inv.invoiceNumber, inv.clientName, inv.status].some((v) => String(v ?? "").toLowerCase().includes(q))) : invoices;
  }, [invoices, search]);
  const totalValue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
  const paid = invoices.filter((inv: any) => inv.status === "PAID").length;
  const overdue = invoices.filter((inv: any) => inv.status === "OVERDUE").length;

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />
      <main className="ml-[270px] min-h-screen min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-4 bg-white/95 px-6 py-3 backdrop-blur lg:px-8">
          <p className="text-sm text-slate-400">CashGuard AI <span className="mx-2">→</span><span className="font-semibold text-slate-800">Invoice Builder</span></p>
          <div className="flex items-center gap-3">
            <label className="relative hidden sm:block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." aria-label="Search invoices" className="h-11 w-56 rounded-xl bg-slate-50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/25 lg:w-72" />
            </label>
            <button type="button" onClick={() => navigate("/notifications")} aria-label="Notifications" className="relative h-11 w-11 rounded-xl bg-white text-lg shadow-sm transition hover:bg-violet-50">♧</button>
            <button type="button" onClick={() => navigate("/settings")} aria-label="Settings" className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white shadow-md">AD</button>
          </div>
        </header>

        <section className="px-5 py-7 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1><p className="mt-1 text-[15px] text-slate-500">Build a professional invoice in seconds.</p></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate("/invoices/preview")} className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">◎ Preview</button>
              <button type="button" onClick={() => { setEditing(null); setShowForm(true); }} className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5">＋ New Invoice</button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Invoices on this page</p><p className="mt-3 text-2xl font-bold">{invoices.length}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Invoice value on this page</p><p className="mt-3 text-2xl font-bold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(totalValue)}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Paid / overdue</p><p className="mt-3 text-2xl font-bold">{paid}<span className="mx-2 text-slate-300">/</span>{overdue}</p></div>
          </div>

          {showForm && <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold">{editing ? "Edit Invoice" : "Invoice Details"}</h2><p className="mt-1 text-sm text-slate-500">Complete the form and save your invoice.</p></div><button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Close ✕</button></div><InvoiceForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} /></section>}

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-bold">Invoices</h2><p className="mt-1 text-sm text-slate-500">Manage invoice status, due dates, and actions.</p></div>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="h-11 rounded-xl bg-slate-50 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/25"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="VIEWED">Viewed</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option><option value="CANCELLED">Cancelled</option></select>
            </div>
            {loading && <p className="px-6 py-12 text-center text-sm text-slate-500">Loading invoices…</p>}
            {error && <p role="alert" className="mx-5 mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {!loading && !error && visibleInvoices.length === 0 && <div className="px-6 py-12 text-center"><p className="font-semibold">No invoices found</p><p className="mt-1 text-sm text-slate-500">Try a different search or create an invoice.</p><button type="button" onClick={() => { setEditing(null); setShowForm(true); }} className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Create invoice</button></div>}
            {!loading && !error && visibleInvoices.length > 0 && <div className="overflow-x-auto"><InvoiceTable invoices={visibleInvoices} onEdit={(inv) => { setEditing(inv); setShowForm(true); }} onDelete={handleDelete} onSort={handleSort} sortColumn={sortColumn} sortDirection={sortDirection} /></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="flex gap-2"><button type="button" onClick={() => setPage(1)} disabled={page <= 1} className="rounded-lg bg-slate-50 px-3 py-2 text-sm disabled:opacity-40">First</button><button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg bg-slate-50 px-3 py-2 text-sm disabled:opacity-40">Previous</button></div><span className="text-sm text-slate-500">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{Math.max(1, totalPages)}</strong></span><div className="flex gap-2"><button type="button" onClick={() => setPage((p) => Math.min(Math.max(1, totalPages), p + 1))} disabled={page >= totalPages} className="rounded-lg bg-slate-50 px-3 py-2 text-sm disabled:opacity-40">Next</button><button type="button" onClick={() => setPage(Math.max(1, totalPages))} disabled={page >= totalPages} className="rounded-lg bg-slate-50 px-3 py-2 text-sm disabled:opacity-40">Last</button></div></div>
          </section>
          <p className="mt-6 text-center text-xs text-slate-400">CashGuard AI · Invoice management workspace</p>
        </section>
      </main>
    </div>
  );
};
