import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useClients } from "../../hooks/useClients";
import { ClientTable } from "./ClientTable";
import { ClientForm } from "./ClientForm.tsx";
import { useAuth } from "../../context/AuthContext";
import type { Client } from "../../types/client";
import Sidebar from "../../Layout/Sidebar";

export const ClientsPage = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const { user } = useAuth();

  const {
    clients,
    totalPages,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
  } = useClients(page, search);

  const handleSubmit = async (input: any) => {
    try {
      if (editing) {
        await updateClient(editing.id, input);
      } else {
        await createClient(input);
      }

      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error("Failed to save client:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      await deleteClient(id);
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  const openCreateForm = () => {
    setEditing(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const firstLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main application area */}
      <main className="ml-[270px] min-h-screen min-w-0">
        {/* ================= TOPBAR ================= */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-xl lg:px-8">
          {/* Breadcrumb */}
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="whitespace-nowrap text-slate-400 transition hover:text-violet-600"
            >
              CashGuard AI
            </button>

            <span className="text-slate-300">→</span>

            <span className="font-semibold text-slate-800">Clients</span>
          </div>

          {/* Search and profile */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>

              <input
                type="search"
                placeholder="Search anything..."
                aria-label="Search anything"
                className="h-10 w-52 rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 lg:w-[290px]"
              />
            </div>

            {/* Notifications */}
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              aria-label="Notifications"
              title="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </button>

            {/* User avatar */}
            <div
              title={user?.name || "User"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold text-white shadow-md shadow-violet-500/20"
            >
              {firstLetter}
            </div>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <div className="mx-auto w-full max-w-[1600px] p-5 sm:p-7 lg:p-8">
          {/* Page heading */}
          <section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-1 rounded-full bg-violet-500" />

<h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[32px]">
  Clients
</h1>
              </div>

              <p className="max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                Manage your customer relationships, contact details, and
                invoicing contacts in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/25 focus:outline-none focus:ring-4 focus:ring-violet-500/20"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>

              Add Client
            </button>
          </section>

          {/* ================= CLIENT FORM ================= */}
          {showForm && (
            <section className="mb-6 overflow-hidden rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editing ? "Edit Client" : "Add New Client"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {editing
                      ? "Update this client's information."
                      : "Enter the details for your new client."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close client form"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <ClientForm
                initial={editing}
                onSubmit={handleSubmit}
                onCancel={closeForm}
              />
            </section>
          )}

          {/* ================= CLIENT TABLE CARD ================= */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Search toolbar */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6 sm:py-5">
              <div className="relative w-full sm:max-w-[330px]">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>

                <input
                  type="search"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Search clients"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <div className="flex items-center gap-2 self-start rounded-full bg-blue-50 px-3.5 py-2 sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-blue-500" />

                <span className="text-xs font-semibold text-blue-700">
                  {loading
                    ? "Loading clients..."
                    : `${clients.length} clients on this page`}
                </span>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center px-5 py-20">
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-violet-100 border-t-violet-600" />

                <p className="mt-4 text-sm font-medium text-slate-600">
                  Loading your clients...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Fetching the latest client records
                </p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="m-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 sm:m-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  !
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-red-800">
                    Unable to load clients
                  </h3>

                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && clients.length === 0 && (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                    <path d="M20 8v6M23 11h-6" />
                  </svg>
                </div>

                <h3 className="mt-5 text-base font-bold text-slate-900">
                  {search ? "No matching clients" : "No clients yet"}
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {search
                    ? "Try a different search term to find the client you need."
                    : "Add your first client to start managing customer information and invoices."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    + Add your first client
                  </button>
                )}
              </div>
            )}

            {/* Actual client data */}
            {!loading && !error && clients.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <ClientTable
                    clients={clients}
                    onEdit={(client) => {
                      setEditing(client);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                  />
                </div>

                {/* Pagination */}
                <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-800">
                      {clients.length}
                    </span>{" "}
                    clients on page{" "}
                    <span className="font-semibold text-slate-800">
                      {page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {Math.max(totalPages, 1)}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>

                      Previous
                    </button>

                    <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 px-3 text-sm font-bold text-white shadow-md shadow-violet-500/20">
                      {page}
                    </span>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => current + 1)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600"
                    >
                      Next

                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Footer */}
          <footer className="mt-6 flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>CashGuard AI · Client Management</p>

            <p>
              Signed in as{" "}
              <span className="font-semibold text-slate-500">
                {user?.name || "User"}
              </span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ClientsPage;