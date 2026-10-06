// Minimal hook for a single invoice used by the wrapper pages.
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { Invoice, CreateInvoiceInput } from '../types/invoice';

export const useInvoice = (invoiceId?: string) => {
  const [data, setData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!invoiceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      setData(res.data?.data ?? res.data ?? null);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (input: Partial<CreateInvoiceInput>) => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      await api.put(`/invoices/${invoiceId}`, input);
      await refetch();
    } finally {
      setLoading(false);
    }
  };

  const sendInvoice = async (id: string) => {
    const res = await api.post(`/invoices/${id}/send`);
    return res.data?.data ?? res.data;
  };

  useEffect(() => {
    if (invoiceId) refetch();
  }, [invoiceId]);

  return {
    data,
    loading,
    error,
    refetch,
    updateInvoice,
    sendInvoice,
  };
};