import {useState,useEffect} from "react";
import type { Invoice,InvoiceItem,CreateInvoiceInput } from "../../types/invoice";
import { InvoiceItemRow } from "./InvoiceItemRow";
import { useClients } from "../../hooks/useClients";

interface Props {
    initial?: Invoice | null;
  onSubmit: (input: CreateInvoiceInput) => Promise<void>;
  onCancel: () => void;
}
const emptyItem : InvoiceItem ={
  description: "",
  quantity: 0,
  unitPrice: 0,
  total: 0,
}

export const InvoiceForm = ({ initial, onSubmit, onCancel }: Props) => {
    const {clients} = useClients(1,""); // full client list for dropdown
    const[clientId, setClientId] = useState("");
    const [items, setItems] =useState<InvoiceItem[]>([{...emptyItem}]);
    const [tax,setTax] =useState(0);
    const[dueDate,setDueDate] =useState("");
    const[notes,setNotes] =useState("");
    const[error,setError] = useState("");


    useEffect(()=>{
       if (initial) {
      setClientId(initial.clientId);
      setItems(initial.items.length ? initial.items : [{ ...emptyItem }]);
      setTax(initial.tax);
      setDueDate(initial.dueDate.slice(0, 10));
      setNotes(initial.notes || "");
    }
  }, [initial]);

  const subtotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0), 0);
  const total = subtotal + (tax || 0);

  const updateItem = (index: number, updated: InvoiceItem) => {
    const next = [...items];
    next[index] = updated;
    setItems(next);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!clientId) {
      setError("Please select a client");
      return;
    }
    try {
      await onSubmit({
        clientId,
        items,
        currency: "USD",
        dueDate: new Date(dueDate).toISOString(),
        notes,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save invoice");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Client</label>
        <select
          className="border p-2 w-full"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)} // Corrected setter name: 'setclientId' to 'setClientId'
          required
        >
          <option value="">Select a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Line Items</label>
        {items.map((item, i) => (
          <InvoiceItemRow
            key={i}
            item={item}
            onChange={(updated: InvoiceItem) => updateItem(i, updated)} // Added type annotation for 'updated'
            onRemove={() => removeItem(i)}
            canRemove={items.length > 1}
          />
        ))}
        <button type="button" onClick={addItem} className="text-blue-600 text-sm">
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            className="border p-2 w-full"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tax ($)</label>
          <input
            type="number"
            min={0}
            step="any"
            className="border p-2 w-full"
            value={tax}
            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          className="border p-2 w-full"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="text-right space-y-1 border-t pt-3">
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Tax: ${tax.toFixed(2)}</p>
        <p className="font-bold text-lg">Total: ${total.toFixed(2)}</p>
      </div>

      <div className="space-x-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {initial ? "Update Invoice" : "Create Invoice"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">
          Cancel
        </button>
      </div>
    </form>
  );
};  
    