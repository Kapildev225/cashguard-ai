import { useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  collapsed?: boolean;
}

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", number: "01", icon: "▦", path: "/dashboard" },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Clients", number: "02", icon: "♙", path: "/clients" },
    ],
  },
  {
    title: "INVOICING",
    items: [
      { label: "Invoice Builder", number: "03", icon: "▤", path: "/invoices" },
      { label: "Invoice Preview", number: "04", icon: "▧", path: "/invoices/preview" },
      { label: "Payment Tracking", number: "05", icon: "▣", path: "/payments" },
      { label: "Reminders", number: "06", icon: "♧", path: "/reminders" },
    ],
  },
  {
    title: "AI TOOLS",
    items: [
      { label: "AI Insights", number: "07", icon: "◈", path: "/ai-insights" },
      { label: "AI Finance Copilot", number: "08", icon: "▱", path: "/ai-copilot" },
      {
        label: "Negotiation Assistant",
        number: "09",
        icon: "⚒",
        path: "/negotiation-assistant",
      },
    ],
  },
  {
    title: "FORECASTING & REPORTS",
    items: [
      {
        label: "Cash Flow Forecasting",
        number: "10",
        icon: "↗",
        path: "/cash-flow",
      },
      {
        label: "Business Health",
        number: "11",
        icon: "◷",
        path: "/business-health",
      },
    ],
  },
  {
    title: "MONITORING",
    items: [
      {
        label: "Fraud Detection",
        number: "12",
        icon: "◉",
        path: "/fraud-detection",
      },
      {
        label: "Payment Anomaly",
        number: "13",
        icon: "⌁",
        path: "/payment-anomaly",
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Notifications",
        number: "14",
        icon: "♧",
        path: "/notifications",
      },
      {
        label: "Settings",
        number: "15",
        icon: "⚙",
        path: "/settings",
      },
    ],
  },
];

export const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-50
        flex h-screen flex-col
        overflow-hidden
        bg-[#0b0d17]
        text-white
        shadow-2xl
        transition-all duration-300
        ${collapsed ? "w-[82px]" : "w-[270px]"}
      `}
    >
      {/* =========================
          LOGO
      ========================== */}
      <div
        className={`
          flex h-[78px] shrink-0 items-center
          border-b border-white/[0.06]
          px-5
          ${collapsed ? "justify-center px-0" : "justify-between"}
        `}
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-xl
              bg-gradient-to-br
              from-violet-500
              to-indigo-600
              shadow-lg shadow-violet-500/20
            "
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3L19 6V11C19 15.5 16.2 19.4 12 21C7.8 19.4 5 15.5 5 11V6L12 3Z" />
              <path d="M9 12L11 14L15 10" />
            </svg>
          </div>

          {!collapsed && (
            <div>
              <div className="text-[17px] font-bold tracking-tight">
                CashGuard AI
              </div>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] font-medium text-slate-500">
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================
          NAVIGATION
      ========================== */}
      <nav
        className="
          flex-1
          overflow-y-auto
          overflow-x-hidden
          px-3
          py-5
          scrollbar-thin
          scrollbar-thumb-white/10
          scrollbar-track-transparent
        "
      >
        {navigation.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <p
                className="
                  mb-2
                  px-3
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-500
                "
              >
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      group
                      relative
                      flex
                      h-10
                      w-full
                      items-center
                      rounded-xl
                      transition-all
                      duration-200
                      ${
                        collapsed
                          ? "justify-center px-0"
                          : "px-3"
                      }
                      ${
                        active
                          ? `
                            border
                            border-violet-500/30
                            bg-violet-500/[0.10]
                            text-white
                            shadow-[inset_0_0_20px_rgba(139,92,246,0.04)]
                          `
                          : `
                            border border-transparent
                            text-slate-400
                            hover:bg-white/[0.04]
                            hover:text-slate-200
                          `
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span
                        className="
                          absolute
                          -left-3
                          top-1/2
                          h-5
                          w-1
                          -translate-y-1/2
                          rounded-r-full
                          bg-violet-500
                          shadow-[0_0_10px_rgba(139,92,246,0.8)]
                        "
                      />
                    )}

                    {/* Icon */}
                    <span
                      className={`
                        flex
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        text-[17px]
                        ${
                          active
                            ? "text-violet-400"
                            : "text-slate-500 group-hover:text-slate-300"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <>
                        {/* Label */}
                        <span
                          className="
                            flex-1
                            truncate
                            text-left
                            text-[13px]
                            font-medium
                          "
                        >
                          {item.label}
                        </span>

                        {/* Number */}
                        <span
                          className={`
                            rounded-md
                            px-1.5
                            py-0.5
                            text-[9px]
                            font-semibold
                            ${
                              active
                                ? "bg-violet-500/15 text-violet-300"
                                : "bg-white/[0.04] text-slate-600"
                            }
                          `}
                        >
                          {item.number}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* =========================
          BOTTOM USER AREA
      ========================== */}
      {!collapsed && (
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div
            className="
              flex
              items-center
              gap-3
              rounded-xl
              bg-white/[0.03]
              px-3
              py-3
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-violet-500
                to-indigo-500
                text-xs
                font-bold
              "
            >
              CG
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                CashGuard
              </p>
              <p className="text-[10px] text-slate-500">
                Finance Workspace
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;