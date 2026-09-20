import { Routes, Route, Link } from "react-router-dom";
import { ClientsPage } from "./wrapper/pages/Clients/ClientsPage";
// InvoicesPage is exported as the default export from its module — import default to avoid TS2305
import { InvoicesPage } from "./wrapper/pages/Invoices/Invoicespage"; // Corrected casing
import { AuthProvider } from "./wrapper/context/AuthContext"; // Import AuthProvider


function App() {
  return (
    <AuthProvider> {/* Wrap with AuthProvider */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
              <h1 className="text-5xl font-bold text-cyan-400">CashGuard AI</h1>
              <Link to="/clients" className="mt-4 text-xl text-blue-400 hover:underline">
                Go to Clients
              </Link>
              <Link to="/invoices" className="mt-2 text-xl text-blue-400 hover:underline">
                Go to Invoices
              </Link>
            </div>
          }
        />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        {/* <Route path ="/login" element={<Login />} />   */}
        {/* Added InvoicesPage route */}
      </Routes>
    </AuthProvider>
  );
}

export default App;
