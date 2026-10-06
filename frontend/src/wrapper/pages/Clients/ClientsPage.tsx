// src/pages/Clients/ClientsPage.tsx
import { useState } from "react";
import { useClients } from "../../hooks/useClients";
import { ClientTable } from "./ClientTable";
import { ClientForm } from "./ClientForm.tsx";
import { useAuth } from "../../context/AuthContext";
import type { Client } from "../../types/client";

export const ClientsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loginEmail, setLoginEmail] = useState("test@example.com"); // For mock login
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const { user, login, logout } = useAuth();

  const { clients, totalPages, loading, error, createClient, updateClient, deleteClient } =
    useClients(page, search);

  const handleLogin = async () => {
    // For demonstration, use a fixed password
    await login(loginEmail, "password");
  };

  const handleSubmit = async (input: any) => {
    if (editing) {
      await updateClient(editing.id, input);
    } else {
      await createClient(input);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this client?")) {
      await deleteClient(id);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clients ({user ? user.name : 'Guest'})</h1>
        {user ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              + New Client
            </button>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="email"
              placeholder="Email (e.g., test@example.com)"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={handleLogin}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Login (Mock)
            </button>
          </div>
        )}
      </div>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showForm && (
        <div className="mb-4">
          <ClientForm
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {loading && <p className="text-center text-gray-500">Loading clients...</p>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!loading && !error && clients.length === 0 && user && (
        <p className="text-center text-gray-500">No clients found. Try creating one!</p>
      )}

      {!loading && !error && clients.length > 0 && (
        <>
          <ClientTable
            clients={clients}
            onEdit={(client) => {
              setEditing(client);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
          <div className="flex justify-between items-center mt-4">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">
              &larr; Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>            
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">
              Next &rarr;
            </button>
          </div>
        </>
      )}
    </div>
  );
};