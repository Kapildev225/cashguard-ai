import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
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
  currency?: string;
  Client?: { name?: string };
  client?: { name?: string };
}

interface Metric {
  label: string;
  score: number;
  color: string;
  icon: typeof TrendingUp;
}

function extractInvoices(value: any): Invoice[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.invoices)) return value.invoices;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function amount(invoice: Invoice) {
  return Number(invoice.total ?? invoice.amount ?? 0);
}

function status(invoice: Invoice) {
  return (invoice.status ?? "").toUpperCase();
}

function isPaid(invoice: Invoice) {
  return status(invoice) === "PAID";
}

function isOutstanding(invoice: Invoice) {
  return !["PAID", "CANCELLED", "VOID", "DRAFT"].includes(status(invoice));
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

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function healthLabel(score: number) {
  if (score >= 8) return "Good";
  if (score >= 6) return "Fair";
  if (score >= 4) return "Needs Attention";
  return "Critical";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 63;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(10, score)) / 10;

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#edf0f7"
          strokeWidth="14"
        />

        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={score >= 7 ? "#10b981" : score >= 4 ? "#f59e0b" : "#ef4444"}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-slate-900">
          {score.toFixed(1)}
        </span>
        <span className="mt-1 text-xs text-slate-400">out of 10</span>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;

  return (
    <div className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-400">
          {metric.label}
        </span>
        <Icon className={`h-4 w-4 ${metric.color}`} />
      </div>

      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{metric.score.toFixed(1)}</span>
        <span className="text-sm text-slate-400">/ 10</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            metric.score >= 7
              ? "bg-emerald-500"
              : metric.score >= 4
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${metric.score * 10}%` }}
        />
      </div>
    </div>
  );
}

export default function BusinessHealthPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/invoices", {
        params: { page: 1, limit: 500 },
      });

      setInvoices(extractInvoices(response.data?.data ?? response.data));
    } catch (err: any) {
      console.error("Business Health loading error:", err);

      setError(
        err?.response?.data?.message ??
          "Unable to load business data. Check the backend and your login session."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const reportInvoices = invoices.filter((invoice) => {
    const date = invoice.createdAt
      ? new Date(invoice.createdAt)
      : invoice.dueDate
        ? new Date(invoice.dueDate)
        : null;

    return date && !Number.isNaN(date.getTime())
      ? date.toISOString().slice(0, 7) === reportDate
      : false;
  });

  const paidInvoices = invoices.filter(isPaid);
  const outstandingInvoices = invoices.filter(isOutstanding);
  const overdueInvoices = invoices.filter(isOverdue);

  const paidTotal = paidInvoices.reduce(
    (sum, invoice) => sum + amount(invoice),
    0
  );

  const outstandingTotal = outstandingInvoices.reduce(
    (sum, invoice) => sum + amount(invoice),
    0
  );

  const overdueTotal = overdueInvoices.reduce(
    (sum, invoice) => sum + amount(invoice),
    0
  );

  const paidCount = paidInvoices.length;
  const totalCount = paidCount + outstandingInvoices.length;

  // These are invoice-based indicators, not audited financial ratios.
  const collectionScore =
    totalCount > 0 ? (paidCount / totalCount) * 10 : 0;

  const overdueRatio =
    outstandingTotal > 0 ? overdueTotal / outstandingTotal : 0;

  const riskScore =
    totalCount > 0
      ? Math.max(
          0,
          Math.min(
            10,
            10 -
              overdueRatio * 7 -
              (overdueInvoices.length / Math.max(totalCount, 1)) * 3
          )
        )
      : 0;

  const healthScore =
    totalCount > 0
      ? Math.max(0, Math.min(10, collectionScore * 0.65 + riskScore * 0.35))
      : 0;

  const metrics: Metric[] = [
    {
      label: "Collection Health",
      score: collectionScore,
      color: "text-emerald-500",
      icon: TrendingUp,
    },
    {
      label: "Outstanding Payments",
      score: Math.max(0, 10 - overdueRatio * 10),
      color: "text-blue-500",
      icon: Wallet,
    },
    {
      label: "Payment Risk",
      score: riskScore,
      color: "text-amber-500",
      icon: Activity,
    },
    {
      label: "Payment Completion",
      score: collectionScore,
      color: "text-violet-500",
      icon: ArrowUpRight,
    },
  ];

  const downloadReport = () => {
    const rows = [
      ["Business Health Report"],
      ["Report month", reportDate],
      ["Health score", healthScore.toFixed(1)],
      ["Paid invoice amount", paidTotal.toFixed(2)],
      ["Outstanding invoice amount", outstandingTotal.toFixed(2)],
      ["Overdue invoice amount", overdueTotal.toFixed(2)],
      ["Paid invoices", String(paidInvoices.length)],
      ["Outstanding invoices", String(outstandingInvoices.length)],
      [],
      ["Invoice", "Status", "Amount", "Due date"],
      ...reportInvoices.map((invoice) => [
        invoice.invoiceNumber ?? invoice.invoiceNo ?? invoice.id,
        invoice.status ?? "Unknown",
        String(amount(invoice)),
        invoice.dueDate ?? "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `business-health-${reportDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen px-5 py-6 md:ml-[270px] md:px-8">
        <header className="mb-7">
          <div className="mb-5 text-sm text-slate-400">
            CashGuard AI <span className="mx-2">→</span>
            <span className="font-semibold text-slate-700">
              Business Health
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Business Health Reports
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Understand your invoice collection performance and payment risk.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="report-month" className="sr-only">
                Report month
              </label>

              <input
                id="report-month"
                type="month"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
              />

              <button
                type="button"
                onClick={downloadReport}
                disabled={loading || invoices.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>

              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                title="Refresh report"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
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
            Loading business health...
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-bold">No invoice data available</h2>
            <p className="mt-2 text-sm text-slate-500">
              Create invoices to calculate collection and payment-risk indicators.
            </p>
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              View invoices
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.6fr]">
              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">Business Health Score</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Based on recorded invoice collection performance
                </p>

                <div className="mt-6">
                  <ScoreRing score={healthScore} />
                </div>

                <div className="mt-4 flex justify-center">
                  <span
                    className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                      healthScore >= 8
                        ? "bg-emerald-100 text-emerald-700"
                        : healthScore >= 6
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {healthLabel(healthScore)}
                  </span>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Paid invoices</span>
                    <span className="font-semibold">
                      {paidInvoices.length}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Overdue invoices</span>
                    <span className="font-semibold text-red-600">
                      {overdueInvoices.length}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Health Breakdown</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Indicators calculated from invoice records
                    </p>
                  </div>

                  <ShieldCheck className="h-6 w-6 text-violet-500" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {metrics.map((metric) => (
                    <MetricCard key={metric.label} metric={metric} />
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">
                      Paid Invoice Amount
                    </p>
                    <p className="mt-2 text-xl font-bold text-emerald-700">
                      {currency(paidTotal)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-700">
                      Outstanding Amount
                    </p>
                    <p className="mt-2 text-xl font-bold text-blue-700">
                      {currency(outstandingTotal)}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold">Top Recommendations</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Actions based on the current invoice records
                </p>
              </div>

              <div className="space-y-3">
                {overdueInvoices.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate("/reminders")}
                    className="flex w-full items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="flex-1 text-sm text-emerald-800">
                      <strong>Follow up on overdue payments.</strong>
                      <span className="mt-1 block">
                        {currency(overdueTotal)} across {overdueInvoices.length}{" "}
                        overdue invoice(s).
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                  </button>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-800">
                      No overdue invoices were found in the available records.
                    </p>
                  </div>
                )}

                {outstandingInvoices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate("/payments")}
                    className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <span className="flex-1 text-sm text-amber-900">
                      <strong>Review outstanding invoices.</strong>
                      <span className="mt-1 block">
                        {currency(outstandingTotal)} remains outstanding.
                      </span>
                    </span>
                    <ArrowDownRight className="h-4 w-4 text-amber-700" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/cash-flow")}
                  className="flex w-full items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left transition hover:bg-blue-100"
                >
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span className="flex-1 text-sm text-blue-800">
                    <strong>Review expected collections.</strong>
                    <span className="mt-1 block">
                      Open Cash Flow Forecasting to review invoice due dates.
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-blue-700" />
                </button>
              </div>
            </section>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              Report month: {reportDate}. The downloadable CSV contains the
              invoices recorded for that month. Scores are illustrative
              invoice-based indicators, not audited financial ratings. Revenue
              growth, operating expenses, profit margins, and cash balances
              require additional financial data and are not inferred here.
            </p>
          </>
        )}
      </main>
    </div>
  );
}