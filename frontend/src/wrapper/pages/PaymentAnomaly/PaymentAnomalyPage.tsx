import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
 Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  LoaderCircle,
  RefreshCw,
  
  ShieldCheck,
 
  Wallet,
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
  paidAt?: string;
  currency?: string;
  Client?: { name?: string };
  client?: { name?: string };
}

interface MonthStat {
  label: string;
  delayed: number;
}

interface Anomaly {
  title: string;
  description: string;
  count: number;
  invoiceId?: string;
}

function extractInvoices(value: any): Invoice[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.invoices)) return value.invoices;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function getStatus(invoice: Invoice) {
  return (invoice.status ?? "").toUpperCase();
}

function getAmount(invoice: Invoice) {
  return Number(invoice.total ?? invoice.amount ?? 0);
}

function isOutstanding(invoice: Invoice) {
  return !["PAID", "CANCELLED", "VOID", "DRAFT"].includes(
    getStatus(invoice)
  );
}

function isOverdue(invoice: Invoice) {
  if (!isOutstanding(invoice) || !invoice.dueDate) return false;

  const due = new Date(invoice.dueDate);

  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthlyTrend(invoices: Invoice[]): MonthStat[] {
  const now = new Date();
  const months: MonthStat[] = [];

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1
    );

    const key = monthKey(date);

    const delayed = invoices.filter((invoice) => {
      if (!invoice.dueDate) return false;

      const dueDate = new Date(invoice.dueDate);

      if (Number.isNaN(dueDate.getTime())) return false;

      return (
        monthKey(dueDate) === key &&
        (isOverdue(invoice) || getStatus(invoice) === "PAID")
      );
    }).length;

    months.push({
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      delayed,
    });
  }

  return months;
}

function TrendChart({ data }: { data: MonthStat[] }) {
  const maxValue = Math.max(...data.map((item) => item.delayed), 1);
  const chartWidth = 620;
  const chartHeight = 155;
  const left = 24;
  const right = 16;
  const top = 16;
  const bottom = 28;

  const usableWidth = chartWidth - left - right;
  const usableHeight = chartHeight - top - bottom;

  const points = data.map((item, index) => {
    const x =
      left +
      (data.length <= 1 ? 0 : (index / (data.length - 1)) * usableWidth);

    const y = top + usableHeight - (item.delayed / maxValue) * usableHeight;

    return { ...item, x, y };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Monthly invoice delay trend"
        className="mx-auto w-full max-w-3xl"
      >
        {[0, 1, 2, 3].map((lineIndex) => {
          const y = top + (usableHeight / 3) * lineIndex;

          return (
            <line
              key={lineIndex}
              x1={left}
              y1={y}
              x2={chartWidth - right}
              y2={y}
              stroke="#e9edf5"
              strokeWidth="1"
            />
          );
        })}

        {points.map((point) => {
          const barHeight = Math.max(0, top + usableHeight - point.y);

          return (
            <rect
              key={point.label + point.x}
              x={point.x - 18}
              y={point.y}
              width="36"
              height={barHeight}
              rx="5"
              fill="#f59e0b"
            />
          );
        })}

        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}

        {points.map((point) => (
          <text
            key={point.label}
            x={point.x}
            y={chartHeight - 7}
            textAnchor="middle"
            fontSize="11"
            fill="#8993a8"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function PaymentAnomalyPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/invoices", {
        params: { page: 1, limit: 500 },
      });

      setInvoices(
        extractInvoices(response.data?.data ?? response.data)
      );
    } catch (err: any) {
      console.error("Payment Anomaly API error:", err);

      setError(
        err?.response?.data?.message ??
          "Unable to load invoice data. Check the backend and your login session."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const overdueInvoices = invoices.filter(isOverdue);
  const outstandingInvoices = invoices.filter(isOutstanding);

  const overdueTotal = overdueInvoices.reduce(
    (sum, invoice) => sum + getAmount(invoice),
    0
  );

  const outstandingTotal = outstandingInvoices.reduce(
    (sum, invoice) => sum + getAmount(invoice),
    0
  );

  const delayedRatio =
    outstandingTotal > 0 ? overdueTotal / outstandingTotal : 0;

  const anomalyScore = Math.round(
    Math.min(
      100,
      outstandingInvoices.length === 0
        ? 0
        : delayedRatio * 60 +
            (overdueInvoices.length /
              Math.max(outstandingInvoices.length, 1)) *
              40
    )
  );

  const trend = getMonthlyTrend(invoices);

  const anomalies: Anomaly[] = [];

  if (overdueInvoices.length > 0) {
    anomalies.push({
      title: "Overdue payment activity",
      description: `${overdueInvoices.length} overdue invoice(s), totaling ${formatCurrency(overdueTotal)}.`,
      count: overdueInvoices.length,
      invoiceId: overdueInvoices[0]?.id,
    });
  }

  if (outstandingInvoices.length > 0 && delayedRatio >= 0.5) {
    anomalies.push({
      title: "High overdue balance ratio",
      description:
        "At least half of the outstanding invoice amount is overdue.",
      count: overdueInvoices.length,
      invoiceId: overdueInvoices[0]?.id,
    });
  }

  const highAmountInvoices = invoices.filter(
    (invoice) => getAmount(invoice) >= 100000 && isOutstanding(invoice)
  );

  if (highAmountInvoices.length > 0) {
    anomalies.push({
      title: "High-value outstanding invoices",
      description: `${highAmountInvoices.length} outstanding invoice(s) are valued at ₹1,00,000 or more.`,
      count: highAmountInvoices.length,
      invoiceId: highAmountInvoices[0]?.id,
    });
  }

  if (invoices.length === 0) {
    // Do not manufacture anomaly records when there is no source data.
  }

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen px-5 py-6 md:ml-[270px] md:px-8">
        <header className="mb-7">
          <div className="mb-5 text-sm text-slate-400">
            CashGuard AI <span className="mx-2">→</span>
            <span className="font-semibold text-slate-700">
              Payment Anomaly
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Payment Anomaly Detection
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review unusual payment patterns identified in invoice records.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadData()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl bg-white text-slate-500 shadow-sm">
            <LoaderCircle className="h-6 w-6 animate-spin" />
            Analyzing invoice records...
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <Wallet className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-bold">No invoice data available</h2>
            <p className="mt-2 text-sm text-slate-500">
              Create invoices before analyzing payment patterns.
            </p>
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              View Invoices
            </button>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.6fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">Anomaly Score</h2>

                <div className="relative mx-auto mt-5 h-48 w-48">
                  <svg
                    viewBox="0 0 180 180"
                    className="-rotate-90"
                    aria-label={`Anomaly score ${anomalyScore} out of 100`}
                  >
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="#edf0f7"
                      strokeWidth="15"
                    />

                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="15"
                      strokeLinecap="round"
                      strokeDasharray={`${(anomalyScore / 100) * 439.8} 439.8`}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">
                      {anomalyScore}
                    </span>
                    <span className="text-xs text-slate-400">out of 100</span>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <span
                    className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                      anomalyScore >= 60
                        ? "bg-red-100 text-red-700"
                        : anomalyScore >= 30
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {anomalyScore >= 60
                      ? "High"
                      : anomalyScore >= 30
                        ? "Moderate"
                        : "Low"}
                  </span>
                </div>

                <p className="mt-5 text-center text-xs text-slate-400">
                  Rule-based indicator calculated from current invoice data.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold">
                  Detected Anomalies
                </h2>

                {anomalies.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                    <ShieldCheck className="mb-2 h-5 w-5" />
                    No configured anomaly rules were triggered by the current
                    invoice records.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalies.map((anomaly) => (
                      <button
                        type="button"
                        key={anomaly.title}
                        onClick={() => {
                          if (anomaly.invoiceId) {
                            navigate(
                              `/invoices/preview/${anomaly.invoiceId}`
                            );
                          } else {
                            navigate("/payments");
                          }
                        }}
                        className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100"
                      >
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                        <span className="flex-1">
                          <span className="block text-sm font-semibold text-amber-900">
                            {anomaly.title}
                          </span>
                          <span className="mt-1 block text-sm text-amber-800">
                            {anomaly.description}
                          </span>
                        </span>

                        <ArrowUpRight className="h-4 w-4 shrink-0 text-amber-700" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold">
                  Delayed Payments Trend
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Invoice counts by due-date month for the latest six months.
                </p>
              </div>

              <TrendChart data={trend} />

              <p className="mt-3 text-xs text-slate-400">
                This chart counts invoices with a due date in each month that
                are currently overdue or marked paid. It is not a historical
                record of the month in which a payment was actually delayed.
              </p>
            </section>

            <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/payments")}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-violet-200"
              >
                <span>
                  <span className="block font-semibold">Payment Tracking</span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Review outstanding and paid invoices.
                  </span>
                </span>
                <Activity className="h-5 w-5 text-violet-600" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/reminders")}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-violet-200"
              >
                <span>
                  <span className="block font-semibold">Payment Reminders</span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Open the reminder queue.
                  </span>
                </span>
                <CalendarClock className="h-5 w-5 text-violet-600" />
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}