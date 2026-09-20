// c:/Users/kapil/Downloads/cashguard-ai/cashguard-ai/frontend/src/wrapper/hooks/useClients.ts
import { useState, useEffect } from 'react';
import type { Client, CreateClientInput } from '../types/client';
import { useAuth } from '../context/AuthContext';

// Mock client data
const mockClients: Client[] = [
  { id: 'cl1', name: 'Client A', email: 'clienta@example.com', company: 'Alpha Corp' },
  { id: 'cl2', name: 'Client B', email: 'clientb@example.com', company: 'Beta Inc' },
  { id: 'cl3', name: 'Client C', email: 'clientc@example.com', company: 'Gamma LLC' },
  { id: 'cl4', name: 'Client D', email: 'clientd@example.com', company: 'Delta Solutions' },
  { id: 'cl5', name: 'Client E', email: 'cliente@example.com', company: 'Epsilon Enterprises' },
  { id: 'cl6', name: 'Client F', email: 'clientf@example.com', company: 'Zeta Group' },
];

export const useClients = (page: number, search: string) => {
  const { user } = useAuth(); // Get user from AuthContext
  const [clients, setClients] = useState<Client[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);

    if (!user) {
      setError("Unauthorized: Please log in to view clients.");
      setLoading(false);
      setClients([]);
      setTotalPages(1);
      return;
    }

    try {
      console.log(`[useClients] Fetching clients: page=${page}, search=${search}`);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let filteredClients = mockClients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.email.toLowerCase().includes(search.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(search.toLowerCase()))
      );

      const itemsPerPage = 3; // Simulate pagination
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedClients = filteredClients.slice(start, end);

      setClients(paginatedClients);
      setTotalPages(Math.ceil(filteredClients.length / itemsPerPage));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, search, user]); // Re-fetch when page, search, or user changes

  const createClient = async (input: CreateClientInput) => {
    if (!user) {
      setError("Unauthorized: Cannot create client.");
      return;
    }
    console.log("[useClients] Creating client:", input);
    await new Promise(resolve => setTimeout(resolve, 300));
    const newClient: Client = { id: `cl${mockClients.length + 1}`, ...input };
    mockClients.push(newClient);
    await fetchClients();
  };

  const updateClient = async (id: string, input: Partial<CreateClientInput>) => {
    if (!user) {
      setError("Unauthorized: Cannot update client.");
      return;
    }
    console.log("[useClients] Updating client:", id, input);
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockClients.findIndex(c => c.id === id);
    if (index !== -1) {
      mockClients[index] = { ...mockClients[index], ...input };
    }
    await fetchClients();
  };

  const deleteClient = async (id: string) => {
    if (!user) {
      setError("Unauthorized: Cannot delete client.");
      return;
    }
    console.log("[useClients] Deleting client:", id);
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockClients.findIndex(c => c.id === id);
    if (index !== -1) {
      mockClients.splice(index, 1);
    }
    await fetchClients();
  };

  return { clients, totalPages, loading, error, createClient, updateClient, deleteClient };
};