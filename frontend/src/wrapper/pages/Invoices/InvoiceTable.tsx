// src/pages/Invoices/InvoiceTable.tsx
import type { Invoice } from "../../types/invoice";
import { useAuth } from "../../context/AuthContext";

type SortColumn = 'invoiceNumber' | 'clientName' | 'total' | 'status' | 'dueDate';
type SortDirection = 'asc' | 'desc';

interface Props {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onSort: (column: SortColumn) => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSend?: (id: string) => Promise<void> | void;
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-200 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-purple-100 text-purple-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

const SortIndicator = ({ column, currentSortColumn, currentSortDirection }: {
  column: SortColumn;
  currentSortColumn: SortColumn;
  currentSortDirection: SortDirection;
}) => {
  if (column === currentSortColumn) {
    return currentSortDirection === 'asc' ? ' ▲' : ' ▼';
  }
  return null;
};

export const InvoiceTable = ({ invoices, onEdit, onDelete, onSort, sortColumn, sortDirection, onSend }: Props) => {
  const { user } = useAuth();
  const canDelete = user?.role === "ADMIN" || user?.role === "OWNER";

  const getSortableHeader = (column: SortColumn, label: string) => (
    <th
      className="p-2 cursor-pointer hover:bg-gray-100"
      onClick={() => onSort(column)}
    >
      {label}
      <SortIndicator column={column} currentSortColumn={sortColumn} currentSortDirection={sortDirection} />
    </th>
  );

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b text-left">
          {getSortableHeader('invoiceNumber', 'Invoice #')}
          {getSortableHeader('clientName', 'Client')}
          {getSortableHeader('total', 'Total')}
          {getSortableHeader('status', 'Status')}
          {getSortableHeader('dueDate', 'Due Date')}
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.length === 0 ? (
          <tr>
            <td colSpan={6} className="p-4 text-center text-gray-500">No invoices found.</td>
          </tr>
        ) : (
          invoices.map((inv) => (
            <tr key={inv.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{inv.invoiceNumber}</td>
              <td className="p-2">{inv.client?.name || "—"}</td>
              <td className="p-2">${inv.total.toFixed(2)}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs ${statusColor[inv.status]}`}>
                  {inv.status}
                </span>
              </td>
              <td className="p-2">{new Date(inv.dueDate).toLocaleDateString()}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => onEdit(inv)} className="text-blue-600 hover:underline">
                  Edit
                </button>
                {onSend && (
                  <button onClick={() => onSend(inv.id)} className="text-green-600 hover:underline">
                    Send
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => onDelete(inv.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>   
    </table>
  );
};
// Add a Send button next to Edit/Delete inside the row — implement as part of the table actions
// The extra markup below was accidentally left outside the component; ensure the Send button
// is rendered using the onSend prop if provided. We will add an optional onSend prop to Props