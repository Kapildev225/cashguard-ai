// src/pages/Clients/ClientForm.tsx
import { useState, useEffect } from "react";
import type { Client, CreateClientInput } from "../../types/client";


interface Props {
  initial?: Client | null;
  onSubmit: (input: CreateClientInput) => Promise<void>;
  onCancel: () => void;
}

export const ClientForm = ({ initial, onSubmit, onCancel }: Props) => {
  const [form, setForm] = useState<CreateClientInput>({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        email: initial.email,
        phone: initial.phone || "",
        company: initial.company || "",
      });
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(form);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input
        className="border p-2 w-full"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        className="border p-2 w-full"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        className="border p-2 w-full"
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <input
        className="border p-2 w-full"
        placeholder="Company"
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
      />
      <div className="space-x-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {initial ? "Update" : "Create"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">
          Cancel
        </button>
      </div>
    </form>
  );
};
