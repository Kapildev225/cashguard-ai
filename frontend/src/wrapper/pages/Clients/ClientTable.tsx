import type { Client } from "../../types/client";
import { useAuth } from "../../context/AuthContext";

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export const ClientTable = ({ clients, onEdit, onDelete }: Props) => {
     const { user } = useAuth();
  const canDelete = user?.role === "ADMIN" || user?.role === "OWNER";

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b text-left">
          <th className="p-2">Name</th>
          <th className="p-2">Email</th>
          <th className="p-2">Company</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id} className="border-b hover:bg-gray-50">
            <td className="p-2">{client.name}</td>
            <td className="p-2">{client.email}</td>
            <td className="p-2">{client.company || "—"}</td>
            <td className="p-2 space-x-2">
              <button onClick={() => onEdit(client)} className="text-blue-600 hover:underline">
                Edit
              </button>
              {canDelete && (
                <button onClick={() => onDelete(client.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
