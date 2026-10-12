import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import Sidebar from "../../Layout/Sidebar";
import api from "../../../lib/api";

interface Client {
  id: string;
  name: string;
  email?: string;
}

interface Invoice {
  id: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  clientId?: string;
  client?: Client;
  Client?: Client;
  total?: number | string;
  amount?: number | string;
  currency?: string;
  status?: string;
  dueDate?: string;
  createdAt?: string;
}

interface Payment {
  id: string;
  invoiceId?: string;
  amount?: number | string;
}

interface RiskClient {
  id: string;
  name: string;
  risk: number;
  overdueInvoices: number;
  overdueAmount: number;
}

interface FraudAlert {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  clientName: string;
  amount: number;
  currency: string;
  reason: string;
}

const currencyFormat = (amount: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const unwrap = <T,>(response: any): T => {
  const body = response?.data;
  return (body?.data ?? body) as T;
};

function getClient(invoice: Invoice): Client | undefined {
  return invoice.Client ?? invoice.client;
}

function getInvoiceAmount(invoice: Invoice): number {
  return Number(invoice.total ?? invoice.amount ?? 0);
}

function isOverdue(invoice: Invoice): boolean {
  if (!invoice.dueDate) return invoice.status === "OVERDUE";

  const status = invoice.status?.toUpperCase();

  if (["PAID", "CANCELLED", "VOID"].includes(status ?? "")) {
    return false;
  }

  return (
    status === "OVERDUE" ||
    new Date(invoice.dueDate).getTime() < Date.now()
  );
}

export default function AIInsightsPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [invoiceResult, clientResult, paymentResult] =
        await Promise.allSettled([
          api.get("/invoices", { params: { page: 1, limit: 500 } }),
          api.get("/clients", { params: { page: 1, limit: 500 } }),
          api.get("/payments", { params: { page: 1, limit: 500 } }),
        ]);

      if (invoiceResult.status !== "fulfilled") {
        throw invoiceResult.reason;
      }

      const invoiceData = unwrap<any>(invoiceResult.value);
      const clientData =
        clientResult.status === "fulfilled"
          ? unwrap<any>(clientResult.value)
          : [];
      const paymentData =
        paymentResult.status === "fulfilled"
          ? unwrap<any>(paymentResult.value)
          : [];

      const normalizeList = <T,>(value: any): T[] => {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.items)) return value.items;
        if (Array.isArray(value?.invoices)) return value.invoices;
        if (Array.isArray(value?.clients)) return value.clients;
        if (Array.isArray(value?.payments)) return value.payments;
        return [];
      };

      setInvoices(normalizeList<Invoice>(invoiceData));
      setClients(normalizeList<Client>(clientData));
      setPayments(normalizeList<Payment>(paymentData));

      if (
        clientResult.status === "rejected" ||
        paymentResult.status === "rejected"
      ) {
        console.warn(
          "AI Insights: client or payment data could not be loaded. Some analysis may be incomplete."
        );
      }
    } catch (err: any) {
      console.error("Failed to load AI Insights:", err);
      setError(
        err?.response?.data?.message ??
          "Unable to load invoice data. Check the backend and authentication."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const paymentRisk = useMemo(() => {
    const outstanding = invoices.filter((invoice) => {
      const status = invoice.status?.toUpperCase();
      return !["PAID", "CANCELLED", "VOID", "DRAFT"].includes(status ?? "");
    });

    const high = outstanding.filter(
      (invoice) =>
        isOverdue(invoice) &&
        invoice.dueDate &&
        Date.now() - new Date(invoice.dueDate).getTime() >
          30 * 24 * 60 * 60 * 1000
    ).length;

    const medium = outstanding.filter(
      (invoice) =>
        isOverdue(invoice) &&
        !(invoice.dueDate &&
          Date.now() - new Date(invoice.dueDate).getTime() >
            30 * 24 * 60 * 60 * 1000)
    ).length;

    const low = Math.max(0, outstanding.length - high - medium);
    const total = outstanding.length || 1;

    return [
      {
        name: "High",
        value: Math.round((high / total) * 100),
        count: high,
        color: "#f04438",
      },
      {
        name: "Medium",
        value: Math.round((medium / total) * 100),
        count: medium,
        color: "#f59e0b",
      },
      {
        name: "Low",
        value: Math.round((low / total) * 100),
        count: low,
        color: "#12b76a",
      },
    ];
  }, [invoices]);

  const riskyClients = useMemo<RiskClient[]>(() => {
    const map = new Map<string, RiskClient>();
    const clientLookup = new Map(
      clients.map((client) => [client.id, client] as const)
    );

    invoices.forEach((invoice) => {
      if (!isOverdue(invoice)) return;

      const client = getClient(invoice) ?? clientLookup.get(invoice.clientId ?? "");
      const clientId = client?.id ?? invoice.clientId;

      if (!clientId) return;

      const existing = map.get(clientId) ?? {
        id: clientId,
        name: client?.name ?? "Unknown client",
        risk: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
      };

      existing.overdueInvoices += 1;
      existing.overdueAmount += getInvoiceAmount(invoice);

      if (!existing.name || existing.name === "Unknown client") {
        existing.name = client?.name ?? existing.name ?? "Unknown client";
      }

      map.set(clientId, existing);
    });

    return [...map.values()]
      .map((client) => ({
        ...client,
        risk: Math.min(
          95,
          Math.round(
            35 +
              client.overdueInvoices * 15 +
              Math.min(client.overdueAmount / 10000, 20)
          )
        ),
      }))
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);
  }, [clients, invoices]);

  const alerts = useMemo<FraudAlert[]>(() => {
    return invoices
      .filter((invoice) => {
        const status = invoice.status?.toUpperCase();
        const amount = getInvoiceAmount(invoice);

        // These are review indicators, not a definitive fraud determination.
        return (
          status === "OVERDUE" &&
          amount > 0 &&
          isOverdue(invoice)
        );
      })
      .slice(0, 5)
      .map((invoice) => ({
        id: invoice.id,
        invoiceId: invoice.id,
        invoiceNo:
          invoice.invoiceNo ?? invoice.invoiceNumber ?? invoice.id,
        clientName: getClient(invoice)?.name ?? "Unknown client",
        amount: getInvoiceAmount(invoice),
        currency: invoice.currency ?? "INR",
        reason: "Overdue payment — review required",
      }));
  }, [invoices]);

  const recommendation = useMemo(() => {
    if (!invoices.length) {
      return "Add invoice data to enable payment-risk analysis.";
    }

    if (!riskyClients.length) {
      return "No overdue client invoices were identified in the available records.";
    }

    const client = riskyClients[0];

    return `${client.name} has ${client.overdueInvoices} overdue invoice(s), totalling ${currencyFormat(client.overdueAmount)}. Review the outstanding balance and consider a payment reminder.`;
  }, [invoices, riskyClients]);

  const outstandingPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen px-5 py-6 md:ml-[270px] md:px-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-slate-400">
              CashGuard AI <span className="mx-2">→</span> AI Insights
            </p>
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
            <p className="mt-2 text-sm text-slate-500">
              Payment risk analysis and invoice review indicators.
            </p>
          </div>

          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh data
          </button>
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => void loadData()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold">Payment Risk Prediction</h2>
            </div>

            <div className="relative h-56">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                  No invoice data available.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentRisk}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={63}
                        outerRadius={91}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {paymentRisk.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">
                      {paymentRisk[0].value}%
                    </span>
                    <span className="text-xs text-slate-500">High risk</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {paymentRisk.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name} {item.value}%
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold">Top High-Risk Clients</h2>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
              </div>
            ) : riskyClients.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No overdue client invoices found.
              </div>
            ) : (
              <div className="space-y-5">
                {riskyClients.slice(0, 3).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => navigate("/clients")}
                    className="block w-full text-left"
                    title="Open clients"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold">
                        {client.name}
                      </span>
                      <span className="text-sm font-bold text-red-500">
                        {client.risk}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${client.risk}%` }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {client.overdueInvoices} overdue invoice(s)
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setReportOpen(true)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View full report <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <article className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="font-semibold">Fraud Detection Alerts</h2>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-500" />
                No overdue invoice review indicators found.
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-red-200 bg-red-50/80 p-4"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-red-700">
                          Invoice review — {alert.invoiceNo}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-red-600">
                          Client: {alert.clientName}
                          <br />
                          Amount: {currencyFormat(alert.amount, alert.currency)}
                          <br />
                          Reason: {alert.reason}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View alert →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <Bot className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <h2 className="font-semibold text-blue-700">
                AI Recommendation
              </h2>
              <p className="mt-1 text-sm leading-6 text-blue-700">
                {loading ? "Analyzing available invoice data..." : recommendation}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Invoices analyzed</p>
            <p className="mt-2 text-2xl font-bold">{loading ? "—" : invoices.length}</p>
          </article>

          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Recorded payment amount</p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "—" : currencyFormat(outstandingPayments)}
            </p>
          </article>
        </section>
      </main>

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => setReportOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="risk-report-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="risk-report-title" className="text-xl font-bold">
                Payment Risk Report
              </h2>
              <button
                onClick={() => setReportOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Derived from the currently available invoice records. These are
              heuristic indicators, not a trained predictive model.
            </p>

            <div className="mt-6 space-y-3">
              {riskyClients.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  No overdue client records are available for this report.
                </p>
              ) : (
                riskyClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                  >
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {client.overdueInvoices} overdue invoice(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{client.risk}%</p>
                      <p className="text-xs text-slate-500">
                        {currencyFormat(client.overdueAmount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => setSelectedAlert(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-details-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <CircleAlert className="h-6 w-6 text-red-500" />
              <h2 id="alert-details-title" className="text-xl font-bold">
                Invoice Review Details
              </h2>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <span className="text-slate-500">Invoice:</span>{" "}
                <strong>{selectedAlert.invoiceNo}</strong>
              </p>
              <p>
                <span className="text-slate-500">Client:</span>{" "}
                <strong>{selectedAlert.clientName}</strong>
              </p>
              <p>
                <span className="text-slate-500">Amount:</span>{" "}
                <strong>
                  {currencyFormat(selectedAlert.amount, selectedAlert.currency)}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">Review reason:</span>{" "}
                {selectedAlert.reason}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setSelectedAlert(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const invoiceId = selectedAlert.invoiceId;
                  setSelectedAlert(null);
                  navigate(`/invoices/preview/${invoiceId}`);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Open invoice
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}