import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Clock3,
  RefreshCw,
  ShieldAlert,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
} from "lucide-react";

import Sidebar from "../../Layout/Sidebar";
import TopNavigation from "../../Layout/TopNavigation";
import { useNotifications } from "../../hooks/useNotification";

const formatDate = (value?: string) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function NotificationPage() {
  const navigate = useNavigate();

  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    refetch,
  } = useNotifications();

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.read
    );

    for (const notification of unreadNotifications) {
      const success = await markAsRead(notification.id);

      if (!success) {
        return;
      }
    }

    await refetch();
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "success":
        return {
          Icon: CheckCircle2,
          style: "bg-emerald-100 text-emerald-600",
        };

      case "warning":
        return {
          Icon: CalendarClock,
          style: "bg-orange-100 text-orange-600",
        };

      case "error":
        return {
          Icon: ShieldAlert,
          style: "bg-red-100 text-red-600",
        };

      default:
        return {
          Icon: Bell,
          style: "bg-blue-100 text-blue-600",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      {/* Existing dark sidebar */}
      <Sidebar />

      {/* Main application content */}
      <main className="ml-0 min-h-screen md:ml-[270px]">
        {/* Shared search, notification bell and profile navigation */}
        <TopNavigation />

        <div className="space-y-6 p-5 md:p-8">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm text-slate-400">
                CashGuard AI <span className="mx-2">→</span>
                <span className="font-medium text-slate-700">
                  Notifications
                </span>
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Real-time alerts and updates across your account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-slate-500">
                  Unread notifications
                </p>

                <p className="mt-1 text-xl font-bold text-violet-700">
                  {unreadCount}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={unreadCount === 0 || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={16} />
                Mark all as read
              </button>
            </div>
          </section>

          {/* Notifications card */}
          <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-6">
            {/* Card heading */}
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Recent activity
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {notifications.length} total notifications ·{" "}
                  {unreadCount} unread
                </p>
              </div>

              <button
                type="button"
                onClick={() => void refetch()}
                disabled={loading}
                aria-label="Refresh notifications"
                title="Refresh notifications"
                className="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            {/* Loading state */}
            {loading && notifications.length === 0 && (
              <div className="py-16 text-center">
                <RefreshCw
                  size={25}
                  className="mx-auto animate-spin text-violet-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading notifications...
                </p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && notifications.length === 0 && (
              <div className="py-12 text-center">
                <ShieldAlert
                  size={32}
                  className="mx-auto text-red-500"
                />

                <h3 className="mt-3 font-semibold text-slate-800">
                  Unable to load notifications
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading &&
              !error &&
              notifications.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Bell size={27} />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-800">
                    No notifications yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    New notifications will appear here when available.
                  </p>
                </div>
              )}

            {/* Actual backend notifications */}
            {notifications.length > 0 && (
              <div>
                {notifications.map((notification) => {
                  const { Icon, style } = getNotificationIcon(
                    notification.type
                  );

                  return (
                    <article
                      key={notification.id}
                      id={`notification-${notification.id}`}
                      className={`flex flex-col gap-4 border-b border-slate-100 px-2 py-5 last:border-b-0 sm:flex-row sm:items-start ${
                        notification.read
                          ? "bg-white"
                          : "bg-violet-50/40"
                      }`}
                    >
                      {/* Notification icon */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style}`}
                      >
                        <Icon size={20} />
                      </div>

                      {/* Notification information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {notification.title || "Notification"}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              notification.read
                                ? "bg-slate-100 text-slate-500"
                                : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {notification.read ? "Read" : "Unread"}
                          </span>
                        </div>

                        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                          {notification.message}
                        </p>

                        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 size={14} />
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      {/* Mark individual notification as read */}
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() =>
                            void markAsRead(notification.id)
                          }
                          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* Bottom navigation */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <CircleDollarSign size={15} />
                CashGuard AI · Account notifications
              </p>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-sm font-semibold text-violet-600 transition hover:text-violet-800"
              >
                Back to dashboard →
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}