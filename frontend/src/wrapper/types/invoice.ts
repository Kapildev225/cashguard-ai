// c:/Users/kapil/Downloads/cashguard-ai/cashguard-ai/frontend/src/wrapper/types/invoice.ts
import type { Client } from "./client";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  items: InvoiceItem[];
  total: number;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  notes?: string;
  tax: number;
  currency: string;
}

export interface CreateInvoiceInput {
  clientId: string;
  items: InvoiceItem[];
  currency: string;
  dueDate: string;
  notes?: string;
}