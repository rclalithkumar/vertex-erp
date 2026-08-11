import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  ClipboardList,
  Clock3,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";

type Role =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: [
          "ADMIN",
          "SALES",
          "WAREHOUSE",
          "ACCOUNTS",
        ] as Role[],
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        name: "Customers",
        path: "/customers",
        icon: Users,
        roles: [
          "ADMIN",
          "SALES",
          "ACCOUNTS",
        ] as Role[],
      },
      {
        name: "Products",
        path: "/products",
        icon: Package,
        roles: [
          "ADMIN",
          "WAREHOUSE",
        ] as Role[],
      },
      {
        name: "Inventory",
        path: "/inventory",
        icon: Warehouse,
        roles: [
          "ADMIN",
          "WAREHOUSE",
        ] as Role[],
      },
      {
        name: "Challans",
        path: "/challans",
        icon: ClipboardList,
        roles: [
          "ADMIN",
          "SALES",
          "ACCOUNTS",
        ] as Role[],
      },
      {
        name: "Follow-ups",
        path: "/followups",
        icon: Clock3,
        roles: [
          "ADMIN",
          "SALES",
        ] as Role[],
      },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const role: Role = user?.role ?? "ADMIN";

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const displayName =
    user?.name ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const displayRole =
    user?.role || "ADMIN";

  const avatarLetter =
    displayName.charAt(0).toUpperCase() || "A";

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/[0.06] bg-[#090909]">
      {/* =========================
          BRAND
      ========================== */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="w-full border-b border-white/[0.06] text-left"
      >
        <motion.div
          initial={{
            opacity: 0,
            x: -10,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          whileHover={{
            backgroundColor:
              "rgba(255,255,255,0.025)",
          }}
          transition={{
            duration: 0.2,
          }}
          className="flex h-20 items-center gap-3 px-6"
        >
          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.08]">
            <Sparkles
              size={20}
              strokeWidth={1.8}
              className="text-amber-400"
            />
          </div>

          {/* Brand */}
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              VertexERP 
            </h1>

            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.24em] text-neutral-500">
              Operations Portal
            </p>
          </div>
        </motion.div>
      </button>

      {/* =========================
          NAVIGATION
      ========================== */}
      <nav className="flex-1 overflow-y-auto px-4 py-7">
        <div className="space-y-8">
          {navigation.map((section) => {
            /*
             * Only show items available to
             * the currently logged-in role.
             */
            const visibleItems =
              section.items.filter((item) =>
                item.roles.includes(role)
              );

            /*
             * Don't render an empty section.
             */
            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div key={section.label}>
                {/* Section title */}
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className="group relative block"
                      >
                        {({ isActive }) => (
                          <motion.div
                            whileHover={{
                              x: 3,
                            }}
                            whileTap={{
                              scale: 0.99,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 28,
                            }}
                            className={`
                              relative flex items-center gap-3
                              rounded-xl px-3 py-3
                              transition-all duration-200
                              ${
                                isActive
                                  ? "bg-white/[0.07] text-white"
                                  : "text-neutral-500 hover:bg-white/[0.035] hover:text-neutral-200"
                              }
                            `}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <motion.div
                                layoutId="active-sidebar"
                                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-amber-400"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              />
                            )}

                            {/* Icon */}
                            <div
                              className={`
                                flex h-9 w-9 shrink-0 items-center justify-center
                                rounded-lg
                                transition-all duration-200
                                ${
                                  isActive
                                    ? "bg-amber-400/10 text-amber-400"
                                    : "bg-white/[0.035] text-neutral-600 group-hover:bg-white/[0.06] group-hover:text-neutral-300"
                                }
                              `}
                            >
                              <Icon
                                size={18}
                                strokeWidth={1.8}
                              />
                            </div>

                            {/* Label */}
                            <span
                              className={`
                                flex-1 text-sm
                                ${
                                  isActive
                                    ? "font-medium text-white"
                                    : "font-medium"
                                }
                              `}
                            >
                              {item.name}
                            </span>

                            {/* Arrow */}
                            <ChevronRight
                              size={15}
                              strokeWidth={1.8}
                              className={`
                                transition-all duration-200
                                ${
                                  isActive
                                    ? "translate-x-0 text-amber-400 opacity-100"
                                    : "-translate-x-1 text-neutral-700 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                }
                              `}
                            />
                          </motion.div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* =========================
          USER / LOGOUT
      ========================== */}
      <div className="border-t border-white/[0.06] p-4">
        {/* User */}
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-black">
              {avatarLetter}
            </div>

            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#090909] bg-emerald-400" />
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>

            <p className="text-xs text-neutral-500">
              {displayRole}
            </p>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          type="button"
          whileHover={{
            x: 3,
          }}
          whileTap={{
            scale: 0.98,
          }}
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-500 transition hover:bg-red-500/[0.05] hover:text-red-400"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.035]">
            <LogOut
              size={17}
              strokeWidth={1.8}
            />
          </div>

          <span>Sign out</span>
        </motion.button>
      </div>
    </aside>
  );
}