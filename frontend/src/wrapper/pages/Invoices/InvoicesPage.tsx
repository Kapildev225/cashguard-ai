import { useState } from "react";
import { useInvoices } from "../../hooks/useInvoices";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceForm } from "./InvoiceForm";
import type { Invoice } from "../../types/invoice";

type SortColumn = 'invoiceNumber' | 'clientName' | 'total' | 'status' | 'dueDate';
type SortDirection = 'asc' | 'desc';

export const InvoicesPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('invoiceNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { invoices, totalPages, loading, error, createInvoice, updateInvoice, deleteInvoice } =
    useInvoices(page, status, sortColumn, sortDirection);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page on sort change
  };

  const handleSubmit = async (input: any) => {
    if (editing) {
      await updateInvoice(editing.id, input);
    } else {
      await createInvoice(input);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this invoice?")) {
      await deleteInvoice(id);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Invoice
        </button>
      </div>

      <select
        className="border p-2 mb-4"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
      >
        <option value="">All Statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="SENT">Sent</option>
        <option value="PAID">Paid</option>
        <option value="OVERDUE">Overdue</option>
      </select>

      {showForm && (
        <div className="mb-4">
          <InvoiceForm
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <InvoiceTable
            invoices={invoices}
            onEdit={(inv) => {
              setEditing(inv);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
                <button
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    First
                </button>
                <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Previous
                </button>
            </div>
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Next
                </button>
                <button
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Last
                </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
