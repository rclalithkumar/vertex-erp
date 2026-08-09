import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  AlertTriangle,
  ClipboardList,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  XCircle,
  Boxes,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

type DashboardStats = {
  customers: number;
  products: number;
  challans: {
    total: number;
    confirmed: number;
    draft: number;
    cancelled: number;
  };
  inventory: {
    totalUnits: number;
    lowStockProducts: number;
  };
  followUps: number;
};

type RecentChallan = {
  id: string;
  challanNumber: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  totalQuantity: number;
  customer: {
    name: string;
    businessName: string;
  };
  items: {
    quantity: number;
    productName: string;
    sku: string;
  }[];
};

type LowStockProduct = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
};

export default function Dashboard() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [recentChallans, setRecentChallans] =
    useState<RecentChallan[]>([]);

  const [lowStock, setLowStock] =
    useState<LowStockProduct[]>([]);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [statsRes, challansRes, stockRes] =
          await Promise.all([
            fetch(
              "http://localhost:5000/api/dashboard/stats",
              { headers }
            ),
            fetch(
              "http://localhost:5000/api/dashboard/recent-challans",
              { headers }
            ),
            fetch(
              "http://localhost:5000/api/dashboard/low-stock",
              { headers }
            ),
          ]);

        const statsData = await statsRes.json();
        const challansData = await challansRes.json();
        const stockData = await stockRes.json();

        if (!statsRes.ok) {
          throw new Error(
            statsData.message ||
              "Failed to load dashboard"
          );
        }

        if (!challansRes.ok) {
          throw new Error(
            challansData.message ||
              "Failed to load challans"
          );
        }

        if (!stockRes.ok) {
          throw new Error(
            stockData.message ||
              "Failed to load inventory"
          );
        }

        setStats(statsData.data);
        setRecentChallans(challansData.data || []);
        setLowStock(stockData.data || []);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white/[0.03]" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-white/[0.03]"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-white/[0.03] xl:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  const data = stats ?? {
    customers: 0,
    products: 0,
    challans: {
      total: 0,
      confirmed: 0,
      draft: 0,
      cancelled: 0,
    },
    inventory: {
      totalUnits: 0,
      lowStockProducts: 0,
    },
    followUps: 0,
  };

  const cards = [
    {
      title: "Customers",
      value: data.customers,
      description: "Total registered customers",
      icon: Users,
    },
    {
      title: "Products",
      value: data.products,
      description: "Products in catalogue",
      icon: Package,
    },
    {
      title: "Inventory",
      value: data.inventory.totalUnits,
      description: "Units currently in stock",
      icon: Boxes,
    },
    {
      title: "Follow-ups",
      value: data.followUps,
      description: "Customer follow-ups",
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#15110d] via-[#0d0e11] to-[#090a0d] p-8"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/[0.07] px-3 py-1.5 text-xs text-orange-300">
            <Activity size={13} />
            System operational
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Business command center
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
            Monitor customers, inventory, sales challans and
            follow-ups from one place.
          </p>
        </div>

        <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 xl:block">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-orange-400/20">
            <div className="absolute h-20 w-20 rounded-full border border-orange-400/10" />

            <div className="h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_25px_rgba(251,146,60,0.8)]" />
          </div>
        </div>
      </motion.section>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.title}
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.06,
              }}
              whileHover={{
                y: -4,
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0e11] p-5 transition-colors hover:border-orange-400/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                    {card.title}
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    {card.value.toLocaleString()}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-zinc-500 transition-colors group-hover:border-orange-400/20 group-hover:text-orange-300">
                  <Icon size={18} />
                </div>
              </div>

              <p className="mt-5 text-xs text-zinc-600">
                {card.description}
              </p>

              <ArrowUpRight
                size={15}
                className="absolute bottom-5 right-5 text-zinc-700 opacity-0 transition-all group-hover:text-orange-400 group-hover:opacity-100"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Challan Activity */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d0e11] xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <div>
              <h3 className="font-semibold text-white">
                Sales activity
              </h3>

              <p className="mt-1 text-xs text-zinc-600">
                Recent sales challans
              </p>
            </div>

            <ClipboardList
              size={18}
              className="text-zinc-600"
            />
          </div>

          <div className="divide-y divide-white/[0.05]">
            {recentChallans.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-zinc-600">
                No challans yet.
              </div>
            ) : (
              recentChallans.slice(0, 6).map((challan) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between px-6 py-4 transition hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.035] text-zinc-500">
                      <ClipboardList size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {challan.challanNumber}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {challan.customer.name}
                        {challan.customer.businessName
                          ? ` · ${challan.customer.businessName}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <StatusBadge
                      status={challan.status}
                    />

                    <p className="mt-1 text-xs text-zinc-600">
                      {challan.totalQuantity} units
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Inventory */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d0e11]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <div>
              <h3 className="font-semibold text-white">
                Inventory alerts
              </h3>

              <p className="mt-1 text-xs text-zinc-600">
                Products requiring attention
              </p>
            </div>

            <AlertTriangle
              size={18}
              className={
                data.inventory.lowStockProducts > 0
                  ? "text-orange-400"
                  : "text-zinc-600"
              }
            />
          </div>

          <div className="p-4">
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2
                  size={28}
                  className="text-emerald-400"
                />

                <p className="mt-3 text-sm font-medium text-zinc-300">
                  Inventory healthy
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  No low-stock products
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-300">
                          {product.name}
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-600">
                          {product.sku}
                        </p>
                      </div>

                      <div className="ml-3 text-right">
                        <p className="text-sm font-semibold text-orange-400">
                          {product.currentStock}
                        </p>

                        <p className="text-[10px] text-zinc-600">
                          min {product.minimumStock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <MiniStat
          icon={CheckCircle2}
          label="Confirmed Challans"
          value={data.challans.confirmed}
          iconClass="text-emerald-400"
        />

        <MiniStat
          icon={Clock3}
          label="Draft Challans"
          value={data.challans.draft}
          iconClass="text-amber-400"
        />

        <MiniStat
          icon={XCircle}
          label="Cancelled Challans"
          value={data.challans.cancelled}
          iconClass="text-red-400"
        />
      </section>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: RecentChallan["status"];
}) {
  const styles = {
    CONFIRMED:
      "border-emerald-400/10 bg-emerald-400/[0.07] text-emerald-400",
    DRAFT:
      "border-amber-400/10 bg-amber-400/[0.07] text-amber-400",
    CANCELLED:
      "border-red-400/10 bg-red-400/[0.07] text-red-400",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#0d0e11] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.025]">
        <Icon size={18} className={iconClass} />
      </div>

      <div>
        <p className="text-xs text-zinc-600">
          {label}
        </p>

        <p className="mt-1 text-xl font-semibold text-white">
          {value}
        </p>
      </div>
    </div>
  );
}