// c:/Users/kapil/Downloads/cashguard-ai/cashguard-ai/frontend/src/wrapper/hooks/useInvoices.ts
import { useState, useEffect } from 'react';
import type { Invoice, CreateInvoiceInput } from '../types/invoice';
import type { Client } from '../types/client'; // Import Client type

// Define mock clients
const mockClients: Client[] = [
  { id: 'client1', name: 'Acme Corp', email: 'acme@example.com' },
  { id: 'client2', name: 'Beta Solutions', email: 'beta@example.com' },
  { id: 'client3', name: 'Gamma Inc', email: 'gamma@example.com' },
];

// Define mock invoices
const generateMockInvoices = (count: number): Invoice[] => {
  const invoices: Invoice[] = [];
  for (let i = 1; i <= count; i++) {
    const client = mockClients[Math.floor(Math.random() * mockClients.length)];
    invoices.push({
      id: `inv${i}`,
      invoiceNumber: `INV-${1000 + i}`,
      clientId: client.id,
      client: client, // Attach client object
      items: [
        { description: 'Service A', quantity: 1, unitPrice: 100, total: 100 },
        { description: 'Service B', quantity: 2, unitPrice: 50, total: 100 },
      ],
      total: Math.floor(Math.random() * 1000) + 100,
      status: ['DRAFT', 'SENT', 'PAID', 'OVERDUE'][Math.floor(Math.random() * 4)] as any,
      dueDate: new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Dates around today
      notes: `Notes for invoice ${i}`,
      tax: Math.floor(Math.random() * 20),
      currency: 'USD',
    });
  }
  return invoices;
};

const allMockInvoices = generateMockInvoices(25); // Generate 25 mock invoices

type SortColumn = 'invoiceNumber' | 'clientName' | 'total' | 'status' | 'dueDate';
type SortDirection = 'asc' | 'desc';

export const useInvoices = (
  page: number,
  status: string,
  sortColumn: SortColumn = 'invoiceNumber',
  sortDirection: SortDirection = 'asc'
) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use sortColumn/sortDirection from parameters instead of internal setters

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching invoices page=${page} status=${status}`);
      
      // Filter mock invoices by status
      let filteredInvoices = status
        ? allMockInvoices.filter(inv => inv.status === status)
        : [...allMockInvoices];

      // Apply sorting
      filteredInvoices.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortColumn) {
          case 'invoiceNumber':
            valA = a.invoiceNumber;
            valB = b.invoiceNumber;
            break;
          case 'clientName':
            valA = a.client?.name || '';
            valB = b.client?.name || '';
            break;
          case 'total':
            valA = a.total;
            valB = b.total;
            break;
          case 'status':
            valA = a.status;
            valB = b.status;
            break;
          case 'dueDate':
            valA = new Date(a.dueDate).getTime();
            valB = new Date(b.dueDate).getTime();
            break;
          default:
            valA = a.invoiceNumber;
            valB = b.invoiceNumber;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      // Simulate pagination
      const itemsPerPage = 5;
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedInvoices = filteredInvoices.slice(start, end);

      setInvoices(paginatedInvoices);
      setTotalPages(Math.ceil(filteredInvoices.length / itemsPerPage));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [page, status, sortColumn, sortDirection]);

  const createInvoice = async (input: CreateInvoiceInput) => {
    // Simulate API call and update mock data
    const newInvoice: Invoice = {
      id: `inv${allMockInvoices.length + 1}`,
      invoiceNumber: `INV-${1000 + allMockInvoices.length + 1}`,
      client: mockClients.find(c => c.id === input.clientId),
      total: input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      status: 'DRAFT',
      tax: 0, // The form has a tax field, but it's not part of CreateInvoiceInput
      ...input,
    };
    allMockInvoices.push(newInvoice);
    await refetch();
  };

  const updateInvoice = async (id: string, input: Partial<CreateInvoiceInput>) => {
    const index = allMockInvoices.findIndex(inv => inv.id === id);
    if (index !== -1) {
      // Merge the existing invoice with the new input
      const updatedInvoice = { ...allMockInvoices[index], ...input };
      // If items are part of the input, recalculate the total
      if (input.items) {
        updatedInvoice.total = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      }
      // If clientId is part of the input, update the client object
      if (input.clientId) {
        updatedInvoice.client = mockClients.find(c => c.id === input.clientId);
      }
      allMockInvoices[index] = updatedInvoice;
    }
    await refetch();
  };

  const deleteInvoice = async (id: string) => {
    const index = allMockInvoices.findIndex(inv => inv.id === id);
    if (index > -1) {
      allMockInvoices.splice(index, 1);
    }
    await refetch();
  };

  return { invoices, totalPages, loading, error, createInvoice, updateInvoice, deleteInvoice };
};