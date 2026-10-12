import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Clock3, ExternalLink, X } from "lucide-react";
import { useNotifications } from "../hooks/useNotification";

const formatTime = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    refetch,
  } = useNotifications();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((previous) => !previous);

          if (!open) {
            void refetch();
          }
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Notifications
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[390px] overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading notifications...
                </p>
              </div>
            )}

            {!loading && error && notifications.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-medium text-red-600">
                  Unable to load notifications.
                </p>

                <p className="mt-1 text-xs text-slate-500">{error}</p>

                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              notifications.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    <Bell size={22} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    You're all caught up
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    New notifications will appear here.
                  </p>
                </div>
              )}

            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-3 border-b border-slate-100 px-4 py-4 transition hover:bg-slate-50 ${
                  !notification.read ? "bg-violet-50/50" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    notification.read
                      ? "bg-slate-100 text-slate-500"
                      : "bg-violet-100 text-violet-700"
                  }`}
                >
                  <Bell size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {notification.title || "Notification"}
                    </p>

                    {!notification.read && (
                      <span
                        aria-label="Unread"
                        className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600"
                      />
                    )}
                  </div>

                  <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                    {notification.message}
                  </p>

                  {notification.createdAt && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 size={12} />
                      {formatTime(notification.createdAt)}
                    </p>
                  )}

                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleMarkAsRead(notification.id)
                      }
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
                    >
                      <Check size={13} />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
            <button
              type="button"
              onClick={handleViewAll}
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
            >
              View all notifications
              <ExternalLink size={15} />
            </button>

            <button
              type="button"
              onClick={() => void refetch()}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}