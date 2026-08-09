import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  ChevronDown,
  Command,
  Package,
  Clock3,
  LogOut,
  User,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";
import { useAuthStore } from "../../store/auth.store";

const pageInfo: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview of your business operations",
  },

  "/customers": {
    title: "Customers",
    description: "Manage your customer relationships",
  },

  "/products": {
    title: "Products",
    description: "Manage products and pricing",
  },

  "/inventory": {
    title: "Inventory",
    description: "Monitor stock and warehouse operations",
  },

  "/challans": {
    title: "Sales Challans",
    description: "Create and manage sales challans",
  },

  "/followups": {
    title: "Follow-ups",
    description: "Manage customer follow-ups and reminders",
  },
};

type Product = {
  id: string;
  name: string;
  sku: string;
  minimumStock: number;
  currentStock: number;
};

type Customer = {
  id: string;
  name: string;
  businessName: string;
};

type FollowUp = {
  id: string;
  note: string;
  followUpAt: string;
  status?: string;
};

type Notification = {
  id: string;
  type: "LOW_STOCK" | "FOLLOW_UP";
  title: string;
  description: string;
  path: string;
  icon: typeof Package;
  urgent?: boolean;
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const profileRef =
    useRef<HTMLDivElement | null>(null);

  const notificationRef =
    useRef<HTMLDivElement | null>(null);

  const searchRef =
    useRef<HTMLInputElement | null>(null);

  const current =
    pageInfo[location.pathname] ?? {
      title: "Mini ERP",
      description: "Business management system",
    };

  /*
   * ==========================================
   * LOAD NOTIFICATIONS
   * ==========================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        setLoadingNotifications(true);

        const nextNotifications: Notification[] =
          [];

        /*
         * --------------------------------------
         * LOW STOCK
         * --------------------------------------
         */

        const productsResponse =
          await api.get("/products");

        const products: Product[] =
          productsResponse.data?.data ?? [];

        products.forEach((product) => {
          const currentStock = Number(
            product.currentStock
          );

          const minimumStock = Number(
            product.minimumStock
          );

          if (
            currentStock <= minimumStock
          ) {
            nextNotifications.push({
              id: `stock-${product.id}`,

              type: "LOW_STOCK",

              title:
                currentStock <= 0
                  ? "Out of stock"
                  : "Low stock",

              description:
                currentStock <= 0
                  ? `${product.name} is out of stock`
                  : `${product.name} has only ${currentStock} units remaining`,

              path: "/inventory",

              icon: Package,

              urgent: currentStock <= 0,
            });
          }
        });

        /*
         * --------------------------------------
         * FOLLOW-UP NOTIFICATIONS
         * --------------------------------------
         */

        try {
          const customersResponse =
            await api.get("/customers");

          const customers: Customer[] =
            customersResponse.data?.data ?? [];

          const customerResults =
            await Promise.all(
              customers
                .slice(0, 50)
                .map(async (customer) => {
                  try {
                    const response =
                      await api.get(
                        `/customers/${customer.id}/followups`
                      );

                    return {
                      customer,
                      followUps:
                        (response.data?.data ??
                          []) as FollowUp[],
                    };
                  } catch {
                    return {
                      customer,
                      followUps: [],
                    };
                  }
                })
            );

          const now = new Date();

          customerResults.forEach(
            ({ customer, followUps }) => {
              followUps.forEach(
                (followUp) => {
                  /*
                   * Ignore completed follow-ups
                   */

                  if (
                    followUp.status &&
                    followUp.status.toUpperCase() ===
                      "COMPLETED"
                  ) {
                    return;
                  }

                  const followUpDate =
                    new Date(
                      followUp.followUpAt
                    );

                  const difference =
                    followUpDate.getTime() -
                    now.getTime();

                  const oneDay =
                    24 *
                    60 *
                    60 *
                    1000;

                  const customerName =
                    customer.businessName ||
                    customer.name;

                  /*
                   * OVERDUE
                   */

                  if (difference < 0) {
                    nextNotifications.push({
                      id: `followup-overdue-${followUp.id}`,

                      type: "FOLLOW_UP",

                      title:
                        "Follow-up overdue",

                      description:
                        `${customerName} has an overdue follow-up`,

                      path:
                        `/customers/${customer.id}`,

                      icon: Clock3,

                      urgent: true,
                    });

                    return;
                  }

                  /*
                   * DUE WITHIN 24 HOURS
                   */

                  if (
                    difference <= oneDay
                  ) {
                    nextNotifications.push({
                      id: `followup-${followUp.id}`,

                      type: "FOLLOW_UP",

                      title:
                        "Follow-up due soon",

                      description:
                        `${customerName} has a follow-up scheduled soon`,

                      path:
                        `/customers/${customer.id}`,

                      icon: Clock3,
                    });
                  }
                }
              );
            }
          );
        } catch (error) {
          console.error(
            "Failed to load follow-up notifications:",
            error
          );
        }

        /*
         * --------------------------------------
         * UPDATE STATE
         * --------------------------------------
         */

        if (!cancelled) {
          setNotifications(
            nextNotifications
          );
        }
      } catch (error) {
        console.error(
          "Failed to load notifications:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoadingNotifications(false);
        }
      }
    };

    /*
     * Initial load
     */

    void loadNotifications();

    /*
     * Refresh every 10 seconds
     */

    const interval =
      window.setInterval(
        loadNotifications,
        10_000
      );

    /*
     * Immediate refresh event
     */

    const handleNotificationRefresh =
      () => {
        void loadNotifications();
      };

    window.addEventListener(
      "erp:refresh-notifications",
      handleNotificationRefresh
    );

    /*
     * Cleanup
     */

    return () => {
      cancelled = true;

      window.clearInterval(interval);

      window.removeEventListener(
        "erp:refresh-notifications",
        handleNotificationRefresh
      );
    };
  }, []);

  /*
   * ==========================================
   * CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
   * ==========================================
   */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          target
        )
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * ==========================================
   * SEARCH
   * ==========================================
   */

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
  };

  const handleSearchSubmit = async () => {
    const query = search.trim();

    if (!query) {
      return;
    }

    /*
     * Try products first
     */

    try {
      const response =
        await api.get("/products", {
          params: {
            search: query,
          },
        });

      const products: Product[] =
        response.data?.data ?? [];

      if (products.length > 0) {
        navigate("/products");

        setSearchOpen(false);
        setSearch("");

        return;
      }
    } catch (error) {
      console.error(
        "Product search failed:",
        error
      );
    }

    /*
     * Try customers
     */

    try {
      const response =
        await api.get("/customers", {
          params: {
            search: query,
          },
        });

      const customers =
        response.data?.data ?? [];

      if (customers.length > 0) {
        navigate("/customers");

        setSearchOpen(false);
        setSearch("");

        return;
      }
    } catch (error) {
      console.error(
        "Customer search failed:",
        error
      );
    }

    /*
     * If nothing found
     */

    navigate("/products");

    setSearchOpen(false);
    setSearch("");
  };

  /*
   * ==========================================
   * LOGOUT
   * ==========================================
   */

  const handleLogout = () => {
    setProfileOpen(false);

    logout();

    navigate("/login");
  };

  /*
   * ==========================================
   * NOTIFICATION CLICK
   * ==========================================
   */

  const handleNotificationClick = (
    notification: Notification
  ) => {
    setNotificationOpen(false);

    navigate(notification.path);
  };

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <header className="relative flex min-w-0 items-center justify-between gap-4 px-8 py-5">
      {/* ====================================
          LEFT
      ==================================== */}

      <div className="min-w-0 flex-1">
        <motion.h1
          key={current.title}
          initial={{
            opacity: 0,
            y: 5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="truncate text-xl font-semibold tracking-tight text-white"
        >
          {current.title}
        </motion.h1>

        <motion.p
          key={current.description}
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="mt-0.5 truncate text-xs text-zinc-500"
        >
          {current.description}
        </motion.p>
      </div>

      {/* ====================================
          RIGHT
      ==================================== */}

      <div className="flex shrink-0 items-center gap-3">
        {/* ==================================
            SEARCH
        ================================== */}

        <div className="relative">
          <motion.button
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.99,
            }}
            onClick={() =>
              setSearchOpen(
                (value) => !value
              )
            }
            className="hidden items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-left transition hover:border-white/[0.12] hover:bg-white/[0.045] md:flex md:w-56"
          >
            <Search
              size={16}
              className="text-zinc-500"
            />

            <span className="flex-1 text-xs text-zinc-500">
              Search...
            </span>

            <span className="flex items-center gap-1 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-600">
              <Command size={9} />
              K
            </span>
          </motion.button>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                  scale: 0.98,
                }}
                className="absolute right-0 top-14 z-50 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.08] bg-[#111111] p-3 shadow-2xl"
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
                  <Search
                    size={16}
                    className="shrink-0 text-zinc-500"
                  />

                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(event) =>
                      handleSearch(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        void handleSearchSubmit();
                      }

                      if (
                        event.key ===
                        "Escape"
                      ) {
                        setSearchOpen(false);
                      }
                    }}
                    placeholder="Search products or customers..."
                    className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                </div>

                <p className="px-2 pt-3 text-[11px] text-zinc-600">
                  Press Enter to search
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ==================================
            NOTIFICATIONS
        ================================== */}

        {/* ==================================
    NOTIFICATIONS
================================== */}

<div ref={notificationRef} className="relative">
  <motion.button
    whileHover={{
      scale: 1.05,
    }}
    whileTap={{
      scale: 0.95,
    }}
    onClick={() =>
      setNotificationOpen((value) => !value)
    }
    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white"
  >
    <Bell size={17} />

    {notifications.length > 0 && (
      <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-black">
        {notifications.length > 9
          ? "9+"
          : notifications.length}
      </span>
    )}
  </motion.button>

  <AnimatePresence>
    {notificationOpen && (
      <motion.div
        initial={{
          opacity: 0,
          y: -8,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -8,
          scale: 0.98,
        }}
        transition={{
          duration: 0.15,
        }}
        className="
          fixed
          right-4
          top-[72px]
          z-[9999]
          w-[min(384px,calc(100vw-2rem))]
          max-w-[calc(100vw-2rem)]
          overflow-hidden
          rounded-2xl
          border
          border-white/[0.08]
          bg-[#111111]
          shadow-2xl
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Notifications
            </h3>

            <p className="mt-0.5 text-[11px] text-zinc-600">
              {notifications.length === 0
                ? "You're all caught up"
                : `${notifications.length} alert${
                    notifications.length !== 1
                      ? "s"
                      : ""
                  }`}
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="ml-3 shrink-0 rounded-lg bg-amber-400/10 px-2 py-1 text-[10px] font-medium text-amber-400">
              Active
            </div>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[min(420px,calc(100vh-120px))] overflow-y-auto">
          {loadingNotifications &&
          notifications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />

              <p className="text-xs text-zinc-600">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10">
                <Bell
                  size={20}
                  className="text-emerald-400"
                />
              </div>

              <p className="text-sm font-medium text-zinc-300">
                No notifications
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Everything looks good.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notification.icon;

              return (
                <button
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                  className="flex w-full gap-3 border-b border-white/[0.05] px-5 py-4 text-left transition hover:bg-white/[0.035]"
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      notification.urgent
                        ? "bg-red-400/10 text-red-400"
                        : "bg-amber-400/10 text-amber-400"
                    }`}
                  >
                    <Icon size={17} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 truncate text-xs font-semibold text-white">
                        {notification.title}
                      </p>

                      {notification.urgent && (
                        <span className="shrink-0 rounded bg-red-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-red-400">
                          Urgent
                        </span>
                      )}
                    </div>

                    <p className="mt-1 break-words text-[11px] leading-5 text-zinc-500">
                      {notification.description}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>

        {/* ==================================
            DIVIDER
        ================================== */}

        <div className="mx-1 h-8 w-px shrink-0 bg-white/[0.07]" />

        {/* ==================================
            PROFILE
        ================================== */}

        <div
          ref={profileRef}
          className="relative shrink-0"
        >
          <button
            onClick={() =>
              setProfileOpen(
                (value) => !value
              )
            }
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-xs font-bold text-white shadow-lg shadow-orange-500/10">
              {user?.name
                ?.charAt(0)
                .toUpperCase() ?? "A"}
            </div>

            <ChevronDown
              size={14}
              className={`text-zinc-600 transition-transform ${
                profileOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                  scale: 0.98,
                }}
                className="absolute right-0 top-14 z-50 w-[min(16rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl"
              >
                {/* User info */}

                <div className="border-b border-white/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-bold text-white">
                      {user?.name
                        ?.charAt(0)
                        .toUpperCase() ??
                        "A"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {user?.name ??
                          "Administrator"}
                      </p>

                      <p className="truncate text-[11px] text-zinc-600">
                        {user?.email ??
                          "admin@erp.com"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 inline-flex rounded-lg bg-amber-400/10 px-2 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                      {user?.role ??
                        "ADMIN"}
                    </span>
                  </div>
                </div>

                {/* Profile */}

                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileOpen(
                        false
                      );

                      navigate(
                        "/dashboard"
                      );
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    <User size={16} />

                    <span>
                      Account overview
                    </span>
                  </button>

                  {/* Logout */}

                  <button
                    onClick={
                      handleLogout
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-zinc-400 transition hover:bg-red-500/[0.06] hover:text-red-400"
                  >
                    <LogOut
                      size={16}
                    />

                    <span>
                      Sign out
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}