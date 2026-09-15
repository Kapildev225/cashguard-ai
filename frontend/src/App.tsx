import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Client = {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

async function apiRequest<T>(url: string, token?: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? 'Request failed');
  }

  return data as T;
}

function App() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [message, setMessage] = useState('Create or sign in to an account.');
  const [authForm, setAuthForm] = useState({
    name: 'Kapil',
    email: 'kapil@example.com',
    password: 'password123',
  });
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });

  useEffect(() => {
    if (!user || !accessToken) {
      return;
    }

    apiRequest<{ clients: Client[] }>('/api/clients', accessToken)
      .then((data) => setClients(data.clients))
      .catch((error) => setMessage(error.message));
  }, [user, accessToken]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const path = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body =
        mode === 'signup'
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const data = await apiRequest<AuthResponse>(path, undefined, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setUser(data.user);
      setAccessToken(data.accessToken);
      setMessage(`${data.user.name} is connected to the backend database.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Auth failed');
    }
  };

  const submitClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !accessToken) {
      return;
    }

    try {
      const data = await apiRequest<{ client: Client }>('/api/clients', accessToken, {
        method: 'POST',
        body: JSON.stringify(clientForm),
      });

      setClients((current) => [data.client, ...current]);
      setClientForm({ name: '', email: '', company: '', phone: '' });
      setMessage(`${data.client.name} was saved in PostgreSQL.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Client creation failed');
    }
  };

  return (
    <div className="app-shell">
      <main className="workspace">
        <section className="topbar">
          <div>
            <span className="eyebrow">CashGuard AI</span>
            <h1>Receivables workspace</h1>
          </div>
          <div className="connection">
            <span className={user ? 'status-dot connected' : 'status-dot'} />
            {user ? user.email : 'Not signed in'}
          </div>
        </section>

        <section className="grid">
          <form className="panel" onSubmit={submitAuth}>
            <div className="panel-heading">
              <h2>{mode === 'signup' ? 'Create user' : 'Sign in'}</h2>
              <button
                type="button"
                className="link-button"
                onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              >
                {mode === 'signup' ? 'Use existing' : 'Create new'}
              </button>
            </div>

            {mode === 'signup' && (
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              />
            </label>
            <button type="submit">{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
          </form>

          <form className="panel" onSubmit={submitClient}>
            <div className="panel-heading">
              <h2>Add client</h2>
            </div>
            <label>
              Client name
              <input
                value={clientForm.name}
                onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })}
                disabled={!user}
              />
            </label>
            <label>
              Client email
              <input
                type="email"
                value={clientForm.email}
                onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })}
                disabled={!user}
              />
            </label>
            <label>
              Company
              <input
                value={clientForm.company}
                onChange={(event) => setClientForm({ ...clientForm, company: event.target.value })}
                disabled={!user}
              />
            </label>
            <label>
              Phone
              <input
                value={clientForm.phone}
                onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })}
                disabled={!user}
              />
            </label>
            <button type="submit" disabled={!user}>
              Save client
            </button>
          </form>
        </section>

        <section className="panel clients-panel">
          <div className="panel-heading">
            <h2>Clients</h2>
            <span>{clients.length} saved</span>
          </div>
          <p className="message">{message}</p>
          <div className="client-list">
            {clients.map((client) => (
              <article className="client-row" key={client.id}>
                <div>
                  <strong>{client.name}</strong>
                  <span>{client.email}</span>
                </div>
                <span>{client.company || client.phone || 'No company yet'}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
