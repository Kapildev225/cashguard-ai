import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Activity,
  ArrowUpRight,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  LoaderCircle,
  FileWarning,
  Eye,
} from "lucide-react";

import Sidebar from "../../Layout/Sidebar";
import api from "../../../lib/api";

interface Invoice {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  status?: string;
  total?: number | string;
  amount?: number | string;
  dueDate?: string;
  createdAt?: string;
  currency?: string;
  Client?: {
    name?: string;
  };
  client?: {
    name?: string;
  };
}

interface RiskInvoice {
  invoice: Invoice;
  riskScore: number;
  reason: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

function extractInvoices(value: any): Invoice[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.invoices)) return value.invoices;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function getAmount(invoice: Invoice): number {
  return Number(invoice.total ?? invoice.amount ?? 0);
}

function getStatus(invoice: Invoice): string {
  return (invoice.status ?? "").toUpperCase();
}

function isOverdue(invoice: Invoice): boolean {
  const status = getStatus(invoice);

  if (
    ["PAID", "CANCELLED", "VOID", "DRAFT"].includes(status) ||
    !invoice.dueDate
  ) {
    return false;
  }

  const dueDate = new Date(invoice.dueDate);

  if (Number.isNaN(dueDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function formatCurrency(value: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value);
  }
}

/**
 * These are transparent, rule-based warning indicators.
 * They are not AI predictions or proof of fraud.
 */
function assessRisk(invoice: Invoice): RiskInvoice {
  let riskScore = 0;
  const reasons: string[] = [];

  const amount = getAmount(invoice);

  if (amount >= 100000) {
    riskScore += 35;
    reasons.push("High invoice amount");
  } else if (amount >= 50000) {
    riskScore += 20;
    reasons.push("Elevated invoice amount");
  }

  if (isOverdue(invoice)) {
    riskScore += 35;
    reasons.push("Overdue payment");
  }

  const status = getStatus(invoice);

  if (["CANCELLED", "VOID"].includes(status)) {
    riskScore += 20;
    reasons.push("Cancelled or void invoice");
  }

  if (!invoice.dueDate && !["PAID", "DRAFT"].includes(status)) {
    riskScore += 10;
    reasons.push("Missing due date");
  }

  riskScore = Math.min(riskScore, 100);

  const severity =
    riskScore >= 60 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW";

  return {
    invoice,
    riskScore,
    reason: reasons.length ? reasons.join(" · ") : "No configured risk rules triggered",
    severity,
  };
}

export default function FraudDetectionPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/invoices", {
        params: {
          page: 1,
          limit: 500,
        },
      });

      setInvoices(
        extractInvoices(response.data?.data ?? response.data)
      );
    } catch (err: any) {
      console.error("Fraud Detection API error:", err);

      setError(
        err?.response?.data?.message ??
          "Unable to load invoices. Check the backend and your login session."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const riskInvoices: RiskInvoice[] = invoices
    .map(assessRisk)
    .sort((a, b) => b.riskScore - a.riskScore);

  const highRiskInvoices = riskInvoices.filter(
    (item) => item.severity === "HIGH"
  );

  const flaggedInvoices = riskInvoices.filter(
    (item) => item.riskScore >= 30
  );

  const criticalAlerts = riskInvoices.filter(
    (item) => item.riskScore >= 80
  );

  const visibleInvoices = flaggedInvoices.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen px-5 py-6 md:ml-[270px] md:px-8">
        {/* Header */}
        <header className="mb-7">
          <div className="mb-5 text-sm text-slate-400">
            CashGuard AI
            <span className="mx-2">→</span>
            <span className="font-semibold text-slate-700">
              Fraud Detection
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Fraud Detection
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor invoice records for configurable payment-risk indicators.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadInvoices()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => void loadInvoices()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl bg-white text-slate-500 shadow-sm">
            <LoaderCircle className="h-6 w-6 animate-spin" />
            Loading invoice risk indicators...
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <section className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <SummaryCard
                title="High Risk Invoices"
                value={highRiskInvoices.length}
                description="Risk score 60 or above"
                icon={ShieldAlert}
                color="red"
              />

              <SummaryCard
                title="Total Flags"
                value={flaggedInvoices.length}
                description="Invoices triggering risk rules"
                icon={AlertTriangle}
                color="amber"
              />

              <SummaryCard
                title="Critical Alerts"
                value={criticalAlerts.length}
                description="Risk score 80 or above"
                icon={Activity}
                color="rose"
              />
            </section>

            {/* Invoice table */}
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold">
                    Suspicious Invoices
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Invoice records ranked by configured risk rules.
                  </p>
                </div>

                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                  {flaggedInvoices.length} flagged
                </span>
              </div>

              {invoices.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <FileWarning className="mx-auto mb-4 h-12 w-12 text-slate-300" />

                  <h3 className="text-lg font-semibold">
                    No invoice records found
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Create or load invoices to calculate risk indicators.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/invoices")}
                    className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    View Invoices
                  </button>
                </div>
              ) : flaggedInvoices.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-emerald-500" />

                  <h3 className="text-lg font-semibold">
                    No invoices triggered the current risk rules
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    This does not guarantee that every invoice is free from fraud.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Invoice #</th>
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Risk Score</th>
                          <th className="px-6 py-4">Reason</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {visibleInvoices.map((item) => {
                          const invoice = item.invoice;

                          return (
                            <tr
                              key={invoice.id}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="whitespace-nowrap px-6 py-5 font-mono text-sm">
                                {invoice.invoiceNumber ??
                                  invoice.invoiceNo ??
                                  invoice.id}
                              </td>

                              <td className="px-6 py-5 text-sm">
                                {invoice.Client?.name ??
                                  invoice.client?.name ??
                                  "Client not provided"}
                              </td>

                              <td className="whitespace-nowrap px-6 py-5 text-sm font-medium">
                                {formatCurrency(
                                  getAmount(invoice),
                                  invoice.currency || "INR"
                                )}
                              </td>

                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                    item.severity === "HIGH"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {item.riskScore}%
                                </span>
                              </td>

                              <td className="max-w-xs px-6 py-5 text-sm text-slate-500">
                                {item.reason}
                              </td>

                              <td className="px-6 py-5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/invoices/preview/${invoice.id}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 font-semibold text-violet-600 hover:text-violet-800"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-5">
                    <span className="text-sm text-slate-400">
                      Showing {visibleInvoices.length} of{" "}
                      {flaggedInvoices.length} flagged invoices
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate("/payment-anomaly")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-800"
                    >
                      View All Alerts
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </section>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              Risk scores are heuristic indicators based on invoice amounts,
              due dates, and statuses. They are not generated by a trained
              fraud-detection model and should not be treated as proof of fraud.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof ShieldAlert;
  color: "red" | "amber" | "rose";
}) {
  const styles = {
    red: {
      icon: "bg-red-100 text-red-600",
      accent: "border-red-100",
    },
    amber: {
      icon: "bg-amber-100 text-amber-600",
      accent: "border-amber-100",
    },
    rose: {
      icon: "bg-rose-100 text-rose-600",
      accent: "border-rose-100",
    },
  };

  return (
    <article
      className={`rounded-2xl border ${styles[color].accent} bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color].icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span className="text-xs font-medium text-slate-400">
          Live invoice data
        </span>
      </div>

      <p className="text-3xl font-bold text-slate-900">{value}</p>

      <h3 className="mt-1 font-semibold text-slate-700">{title}</h3>

      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </article>
  );
}