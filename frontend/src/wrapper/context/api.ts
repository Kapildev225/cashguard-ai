// c:/Users/kapil/Downloads/cashguard-ai/cashguard-ai/frontend/src/wrapper/lib/api.ts
// This is a mock API client to resolve module not found errors.
// In a real application, this would be a configured axios instance or similar.
const mockApi = {
  get: async (url: string) => {
    console.log(`[MOCK API] GET ${url}`);
    // Simulate a delay
    await new Promise(res => setTimeout(res, 300));
    return { data: {} };
  },
  post: async (url: string, data: any) => {
    console.log(`[MOCK API] POST ${url}`, data);
    await new Promise(res => setTimeout(res, 300));
    return { data: { id: `new-${Math.random()}`, ...data } };
  },
  put: async (url: string, data: any) => {
    console.log(`[MOCK API] PUT ${url}`, data);
    await new Promise(res => setTimeout(res, 300));
    return { data };
  },
  delete: async (url: string) => {
    console.log(`[MOCK API] DELETE ${url}`);
    await new Promise(res => setTimeout(res, 300));
    return { data: {} };
  },
};

export const api = mockApi;
export default mockApi;