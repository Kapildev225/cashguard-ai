// c:/Users/kapil/Downloads/cashguard-ai/cashguard-ai/frontend/src/wrapper/types/client.ts
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

// Added for useClients mock implementation
export interface ClientListResponse {
  data: Client[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    totalPages: number;
  };
}