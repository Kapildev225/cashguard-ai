import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  AlertTriangle,
  RefreshCw,
  LoaderCircle,
  ArrowRight,
  FileText,
} from "lucide-react";

import Sidebar from "../../Layout/Sidebar";
import api from "../../../lib/api";

type Period = 3 | 6 | 12;

interface Invoice {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  status?: string;
  total?: number | string;
  amount?: number | string;
  currency?: string;
  dueDate?: string;
  createdAt?: string;
  paidAt?: string;
  Client?: { name?: string };
  client?: { name?: string };
}

interface MonthForecast {
  label: string;
  inflow: number;
  outflow: number | null;
  net: number | null;
}

function extractInvoices(value: any): Invoice[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.invoices)) return value.invoices;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function invoiceAmount(invoice: Invoice) {
  return Number(invoice.total ?? invoice.amount ?? 0);
}

function isPaid(invoice: Invoice) {
  return invoice.status?.toUpperCase() === "PAID";
}

function isOutstanding(invoice: Invoice) {
  return !["PAID", "CANCELLED", "VOID", "DRAFT"].includes(
    invoice.status?.toUpperCase() ?? ""
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function buildForecast(invoices: Invoice[], period: Period): MonthForecast[] {
  const now = new Date();

  return Array.from({ length: period }, (_, index) => {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() + index,
      1
    );

    const monthKey = getMonthKey(monthDate);

    const inflow = invoices.reduce((total, invoice) => {
      if (!isOutstanding(invoice) || !invoice.dueDate) return total;

      const dueDate = new Date(invoice.dueDate);

      if (Number.isNaN(dueDate.getTime())) return total;

      return getMonthKey(dueDate) === monthKey
        ? total + invoiceAmount(invoice)
        : total;
    }, 0);

    return {
      label: getMonthLabel(monthDate),
      inflow,
      // Expenses are not inferred from invoices.
      // Connect an actual expense data source before calculating outflows.
      outflow: null,
      net: null,
    };
  });
}

function ForecastChart({
  data,
}: {
  data: MonthForecast[];
}) {
  const width = 760;
  const height = 245;
  const left = 24;
  const right = 18;
  const top = 20;
  const bottom = 40;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maximum = Math.max(
    1,
    ...data.map((item) => item.inflow)
  );

  const points = data.map((item, index) => {
    const x =
      left +
      (data.length <= 1
        ? plotWidth / 2
        : (index / (data.length - 1)) * plotWidth);

    const y =
      top + plotHeight - (item.inflow / maximum) * plotHeight;

    return { x, y, item };
  });

  const line = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const area = [
    `M ${points[0]?.x ?? left} ${top + plotHeight}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1]?.x ?? left} ${top + plotHeight}`,
    "Z",
  ].join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto min-w-[420px] w-full"
        role="img"
        aria-label="Forecast of outstanding invoice inflows by month"
      >
        {[0, 1, 2, 3].map((index) => {
          const y = top + (plotHeight / 3) * index;

          return (
            <line
              key={index}
              x1={left}
              y1={y}
              x2={width - right}
              y2={y}
              stroke="#e9edf5"
              strokeWidth="1"
            />
          );
        })}

        <path d={area} fill="#3b82f6" opacity="0.09" />

        <path
          d={line}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={`${point.item.label}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth="3"
            >
              <title>
                {point.item.label}: {formatCurrency(point.item.inflow)}
              </title>
            </circle>

            <text
              x={point.x}
              y={height - 12}
              textAnchor="middle"
              fontSize="12"
              fill="#8994aa"
            >
              {point.item.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function CashFlowPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [period, setPeriod] = useState<Period>(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/invoices", {
        params: { page: 1, limit: 500 },
      });

      setInvoices(extractInvoices(response.data?.data ?? response.data));
    } catch (err: any) {
      console.error("Cash flow invoice loading failed:", err);

      setError(
        err?.response?.data?.message ??
          "Unable to load invoice data. Check your backend connection and login session."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const forecast = useMemo(
    () => buildForecast(invoices, period),
    [invoices, period]
  );

  const outstandingInvoices = useMemo(
    () => invoices.filter(isOutstanding),
    [invoices]
  );

  const paidInvoices = useMemo(
    () => invoices.filter(isPaid),
    [invoices]
  );

  const totalOutstanding = outstandingInvoices.reduce(
    (sum, invoice) => sum + invoiceAmount(invoice),
    0
  );

  const paidTotal = paidInvoices.reduce(
    (sum, invoice) => sum + invoiceAmount(invoice),
    0
  );

  const forecastInflows = forecast.reduce(
    (sum, month) => sum + month.inflow,
    0
  );

  const nextMonth = forecast[0];

  const overdueInvoices = outstandingInvoices.filter((invoice) => {
    if (!invoice.dueDate) return false;

    const dueDate = new Date(invoice.dueDate);
    if (Number.isNaN(dueDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  });

  const overdueTotal = overdueInvoices.reduce(
    (sum, invoice) => sum + invoiceAmount(invoice),
    0
  );

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen px-5 py-6 md:ml-[270px] md:px-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-5 text-sm text-slate-400">
              CashGuard AI <span className="mx-2">→</span>
              <span className="font-semibold text-slate-700">
                Cash Flow Forecasting
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <TrendingUp className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Cash Flow Forecasting
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Forecast expected invoice collections using your real records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="forecast-period" className="sr-only">
              Forecast period
            </label>

            <select
              id="forecast-period"
              value={period}
              onChange={(event) =>
                setPeriod(Number(event.target.value) as Period)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
            >
              <option value={3}>Next 3 Months</option>
              <option value={6}>Next 6 Months</option>
              <option value={12}>Next 12 Months</option>
            </select>

            <button
              type="button"
              onClick={() => void loadInvoices()}
              disabled={loading}
              title="Refresh invoice data"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

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
            Loading financial data...
          </div>
        ) : (
          <>
            <section className="mb-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Cash Flow Forecast</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Outstanding invoice amounts by scheduled due month
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                    Expected Inflows
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
                    Outflows unavailable
                  </span>
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                  <FileText className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold">No invoice records found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Create invoices to start viewing expected collections.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/invoices")}
                    className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    View invoices
                  </button>
                </div>
              ) : (
                <ForecastChart data={forecast} />
              )}
            </section>

            <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Outstanding Invoices
                  </span>
                  <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <Wallet className="h-5 w-5" />
                  </span>
                </div>

                <p className="text-2xl font-bold">
                  {formatCurrency(totalOutstanding)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {outstandingInvoices.length} unpaid or outstanding invoices
                </p>
              </article>

              <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Paid Invoices
                  </span>
                  <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                </div>

                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(paidTotal)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {paidInvoices.length} invoices marked paid
                </p>
              </article>

              <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Forecast Inflows
                  </span>
                  <span className="rounded-xl bg-violet-50 p-2 text-violet-600">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                </div>

                <p className="text-2xl font-bold">
                  {formatCurrency(forecastInflows)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {period}-month due-date forecast
                </p>
              </article>

              <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Overdue Amount
                  </span>
                  <span className="rounded-xl bg-red-50 p-2 text-red-600">
                    <TrendingDown className="h-5 w-5" />
                  </span>
                </div>

                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(overdueTotal)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {overdueInvoices.length} overdue invoices
                </p>
              </article>
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                <div>
                  <h2 className="font-bold text-amber-900">
                    {overdueInvoices.length > 0
                      ? `${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? "" : "s"} need follow-up`
                      : "Monitor outstanding invoice collections"}
                  </h2>

                  <p className="mt-1 text-sm text-amber-800">
                    {overdueInvoices.length > 0
                      ? `${formatCurrency(overdueTotal)} is overdue. Review the invoices and follow up with clients.`
                      : "Review upcoming due dates to help manage expected collections."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/payments")}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-amber-100 md:self-center"
              >
                View Payments <ArrowRight className="h-4 w-4" />
              </button>
            </section>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              Forecasts are based on invoice due dates and recorded amounts.
              They represent expected collections, not guaranteed cash receipts.
              Expense records are not yet connected, so outflows and net cash
              flow are not calculated.
              {nextMonth
                ? ` The first forecast month is ${nextMonth.label}.`
                : ""}
            </p>
          </>
        )}
      </main>
    </div>
  );
}