import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Clock,
  BrainCircuit,
  BellRing,
  X,
} from "lucide-react";

import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", path: "/clients", icon: Users },
  { label: "Invoice Builder", path: "/invoices", icon: FileText },
  { label: "Invoice Preview", path: "/invoices/preview", icon: FileText },
  { label: "Payment Tracking", path: "/payments", icon: CreditCard },
  { label: "Reminders", path: "/reminders", icon: Clock },
  { label: "AI Insights", path: "/ai-insights", icon: BrainCircuit },
  { label: "AI Finance Copilot", path: "/ai-copilot", icon: BrainCircuit },
  {
    label: "Negotiation Assistant",
    path: "/negotiation-assistant",
    icon: BrainCircuit,
  },
  { label: "Cash Flow Forecasting", path: "/cash-flow", icon: CreditCard },
  { label: "Business Health", path: "/business-health", icon: LayoutDashboard },
  { label: "Fraud Detection", path: "/fraud-detection", icon: BellRing },
  { label: "Payment Anomaly", path: "/payment-anomaly", icon: BellRing },
  { label: "Notifications", path: "/notifications", icon: BellRing },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function TopNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const filteredItems = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!searchRef.current?.contains(target)) {
        setSearchOpen(false);
      }

      if (!profileRef.current?.contains(target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "US";

  return (
    <header className="sticky top-0 z-40 flex h-[72px] w-full items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8">
      {/* Current page */}
      <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-400 sm:flex">
        <span>CashGuard AI</span>
        <span>→</span>
        <span className="font-semibold text-slate-900">
          {navigationItems.find((item) => item.path === location.pathname)
            ?.label || "Dashboard"}
        </span>
      </div>

      {/* Search, notification bell, profile */}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {/* Functional navigation search */}
        <div className="relative" ref={searchRef}>
          <div className="flex h-10 w-[190px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 sm:w-[240px] lg:w-[306px]">
            <Search size={17} className="shrink-0 text-slate-400" />

            <input
              type="search"
              value={search}
              placeholder="Search anything..."
              aria-label="Search pages"
              aria-expanded={searchOpen}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchOpen(false);
                }

                if (event.key === "Enter" && filteredItems.length > 0) {
                  navigate(filteredItems[0].path);
                  setSearch("");
                  setSearchOpen(false);
                }
              }}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  setSearchOpen(true);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {searchOpen && search.trim() && (
            <div className="absolute right-0 top-12 z-50 max-h-80 w-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:w-[320px]">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pages
              </p>

              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setSearch("");
                        setSearchOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-5 text-center text-sm text-slate-500">
                  No matching pages found.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Existing notification bell */}
        <div className="shrink-0">
          <NotificationBell />
        </div>

        {/* Logged-in member profile */}
        <div className="relative shrink-0" ref={profileRef}>
          <button
            type="button"
            aria-label="Open account details"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className="flex h-10 items-center gap-2 rounded-xl transition hover:bg-slate-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
              {initials}
            </span>

            <ChevronDown
              size={14}
              className={`hidden text-slate-400 transition sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {/* Member details */}
              <div className="border-b border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 font-bold text-white">
                    {initials}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {user?.name || "User"}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user?.email || "Email unavailable"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Account role
                  </span>

                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    {user?.role || "USER"}
                  </span>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <User size={17} className="text-slate-500" />
                  Account settings
                </button>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}