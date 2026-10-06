import type { InvoiceItem } from "../../types/invoice";

interface Props {
  item: InvoiceItem;
  onChange: (item: InvoiceItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function InvoiceItemRow({ item, onChange, onRemove, canRemove }: Props) {
    const lineTotal =(item.quantity|| 0)*(item.unitPrice|| 0);

    return (
      <div className="grid grid-cols-12 gap-2 items-center mb-2">
      <input 
        className="col-span-5 border p-2"
        placeholder="Description"
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        required
      />
      <input
        className="col-span-2 border p-2"
        type="number"
        min={0}
        step="any"
        placeholder="Qty"
        value={item.quantity}
        onChange={(e) => onChange({ ...item, quantity: parseFloat(e.target.value) || 0 })}
        required
      />
      <input
        className="col-span-2 border p-2"
        type="number"
        min={0}
        step="any"
        placeholder="Unit Price"
        value={item.unitPrice}
        onChange={(e) => onChange({ ...item, unitPrice: parseFloat(e.target.value) || 0 })}
        required
      />
      <div className="col-span-2 text-right">${lineTotal.toFixed(2)}</div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="col-span-1 text-red-600 disabled:text-gray-300 justify-self-center"
      >
        ✕
      </button>
      </div>
    );
};