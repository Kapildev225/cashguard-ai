import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  Plus,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  RefreshCw,
  Bell,
} from "lucide-react";

import { useNotifications } from "../hooks/useNotification";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../Layout/Sidebar";
import TopNavigation from "../Layout/TopNavigation";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type HealthReport = {
  healthStatus: "HEALTHY" | "WATCH" | "AT_RISK";

  revenueTrend: {
    month: string;
    invoiced: number;
    collected: number;
  }[];

  summary: {
    totalRevenue: number;
    totalCollected: number;
    outstanding: number;
    overdueAmount: number;
    collectionRate: number;
    overdueRate: number;
  };

  invoices: {
    total: number;
    paid: number;
    partiallyPaid: number;
    overdue: number;
  };

  clientRisk: {
    totalClients: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };

  anomalies: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
};

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    notifications,
    unreadCount,
    markAsRead,
  } = useNotifications();

  useEffect(() => {
    let cancelled = false;

    const fetchHealthReport = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        const response = await fetch(`${API_URL}/dashboard/health`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();

          console.error(
            "Dashboard API error:",
            response.status,
            errorText
          );

          throw new Error(
            `Failed to load dashboard (${response.status})`
          );
        }

        const result = await response.json();

        if (!cancelled) {
          setReport(result.data);
        }
      } catch (err) {
        console.error("Dashboard request failed:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchHealthReport();

    return () => {
      cancelled = true;
    };
  }, []);

  const overdueClients = useMemo(() => {
    if (!report) return [];

    return [
      {
        initials: "HR",
        name: "High Risk Clients",
        description: `${report.clientRisk.highRisk} high risk`,
        amount: report.summary.overdueAmount,
      },
      {
        initials: "MR",
        name: "Medium Risk Clients",
        description: `${report.clientRisk.mediumRisk} medium risk`,
        amount: report.summary.outstanding,
      },
      {
        initials: "LR",
        name: "Low Risk Clients",
        description: `${report.clientRisk.lowRisk} low risk`,
        amount: report.summary.totalCollected,
      },
    ];
  }, [report]);

  const chartData = useMemo(() => {
    if (!report) return [];

    const months: {
      month: string;
      invoiced: number;
      collected: number;
    }[] = [];

    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const existing = report.revenueTrend.find(
        (item) => item.month.startsWith(key)
      );

      months.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
        }),
        invoiced: existing?.invoiced ?? 0,
        collected: existing?.collected ?? 0,
      });
    }

    return months;
  }, [report]);

  const maxRevenue = Math.max(
    ...chartData.map((item) =>
      Math.max(item.invoiced, item.collected)
    ),
    1
  );

  const makeChartPoints = (
    values: number[]
  ) =>
    values
      .map((value, index) => {
        const x =
          chartData.length > 1
            ? (index / (chartData.length - 1)) * 100
            : 50;

        const y = 88 - (value / maxRevenue) * 70;

        return `${x},${y}`;
      })
      .join(" ");

  const invoicedPoints = makeChartPoints(
    chartData.map((item) => item.invoiced)
  );

  const collectedPoints = makeChartPoints(
    chartData.map((item) => item.collected)
  );

  const outstandingPoints = makeChartPoints(
    chartData.map((item) =>
      Math.max(item.invoiced - item.collected, 0)
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5fb]">
        <Sidebar />

        <main className="ml-0 min-h-screen md:ml-[270px]">
          <TopNavigation />

          <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
              <RefreshCw
                size={22}
                className="mx-auto animate-spin text-violet-600"
              />

              <p className="mt-3 text-sm font-medium text-slate-500">
                Loading your financial dashboard...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#f4f5fb]">
        <Sidebar />

        <main className="ml-0 min-h-screen md:ml-[270px]">
          <TopNavigation />

          <div className="p-5 md:p-8">
            <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
              <p className="font-medium text-red-600">
                {error || "No dashboard data available"}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const collectionRate = Math.min(
    100,
    Math.max(0, report.summary.collectionRate)
  );

  const metrics = [
    {
      label: "Invoices Sent",
      value: report.invoices.total.toLocaleString("en-IN"),
      icon: Wallet,
      style: "bg-violet-100 text-violet-600",
    },
    {
      label: "Payments Received",
      value: money(report.summary.totalCollected),
      icon: CheckCircle2,
      style: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Overdue Invoices",
      value: report.invoices.overdue.toLocaleString("en-IN"),
      icon: AlertTriangle,
      style: "bg-red-100 text-red-600",
    },
    {
      label: "Collection Rate",
      value: `${collectionRate}%`,
      icon: Clock3,
      style: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="ml-0 min-h-screen md:ml-[270px]">
        {/* Shared top-right search, notification bell and member avatar */}
        <TopNavigation />

        <div className="space-y-7 p-5 md:p-8">
          {/* Dashboard heading and action buttons */}
          <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Good morning, {user?.name || "User"} 👋
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Here's what's happening with your cash flow today.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <ArrowDownToLine size={17} />
                Export
              </button>

              <button
                type="button"
                onClick={() => navigate("/invoices")}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
              >
                <Plus size={17} />
                New Invoice
              </button>
            </div>
          </section>

          {/* KPI cards */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Wallet size={23} />
                </div>

                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                  ↑ {report.summary.collectionRate}%
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                {money(report.summary.totalRevenue)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total Revenue
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Clock3 size={23} />
                </div>

                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                  {report.invoices.total} invoices
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                {money(report.summary.outstanding)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Outstanding
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle size={23} />
                </div>

                <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                  ↓ {report.summary.overdueRate}%
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                {money(report.summary.overdueAmount)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Overdue
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={23} />
                </div>

                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                  Paid
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                {report.invoices.paid}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Paid Invoices
              </p>
            </div>
          </section>

          {/* Cash flow chart and overdue clients */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            {/* Cash flow graph */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Cash Flow Overview
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Invoiced versus collected revenue
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Invoiced
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    Collected
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                    Outstanding
                  </span>
                </div>
              </div>

              <div className="relative h-[280px] overflow-hidden rounded-xl bg-slate-50 p-4">
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-5 py-5">
                  {[0, 1, 2, 3].map((line) => (
                    <div
                      key={line}
                      className="border-t border-dashed border-slate-200"
                    />
                  ))}
                </div>

                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-x-5 top-5 h-[220px] w-[calc(100%-40px)]"
                  role="img"
                  aria-label="Cash flow comparison chart"
                >
                  <polyline
                    points={invoicedPoints}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />

                  <polyline
                    points={collectedPoints}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />

                  <polyline
                    points={outstandingPoints}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div className="absolute bottom-2 left-5 right-5 flex justify-between text-[11px] font-medium text-slate-400">
                  {chartData.map((item) => (
                    <span key={item.month}>{item.month}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Overdue client risk summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-900">
                  Top Overdue Clients
                </h2>

                <button
                  type="button"
                  onClick={() => navigate("/clients")}
                  className="shrink-0 text-xs font-semibold text-violet-600 transition hover:text-violet-800"
                >
                  View all →
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {overdueClients.map((client, index) => (
                  <button
                    key={client.name}
                    type="button"
                    onClick={() => navigate("/clients")}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${
                        index === 0
                          ? "bg-red-500"
                          : index === 1
                            ? "bg-orange-500"
                            : "bg-violet-500"
                      }`}
                    >
                      {client.initials}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-800">
                        {client.name}
                      </span>

                      <span className="mt-1 block text-xs text-slate-400">
                        {client.description}
                      </span>
                    </span>

                    <strong className="shrink-0 text-sm text-slate-800">
                      {money(client.amount)}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom metrics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.style}`}
                    >
                      <Icon size={20} />
                    </span>

                    <p className="text-xs font-bold text-slate-500">
                      {item.label}
                    </p>
                  </div>

                  <p className="mt-4 text-xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Recent notifications */}
          {notifications.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Recent Notifications
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {unreadCount} unread notification
                    {unreadCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/notifications")}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                >
                  View all →
                </button>
              </div>

              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-violet-50 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Bell
                        size={17}
                        className="mt-0.5 shrink-0 text-violet-600"
                      />

                      <p className="break-words text-sm text-slate-700">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => {
                          void markAsRead(notification.id);
                        }}
                        className="shrink-0 self-start text-xs font-semibold text-violet-600 hover:text-violet-800 sm:self-center"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}