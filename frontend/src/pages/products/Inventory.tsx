import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Package,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

type Product = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
};

type Movement = {
  id: string;
  quantity: number;
  type: "IN" | "OUT";
  reason: string;
  createdAt: string;
  product: {
    name: string;
    sku: string;
  };
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  const loadData = async () => {
    try {
      setRefreshing(true);

      const [productsRes, movementsRes] = await Promise.all([
        fetch("http://localhost:5000/api/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch("http://localhost:5000/api/stock-movements", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const productsData = await productsRes.json();
      const movementsData = await movementsRes.json();

      if (!productsRes.ok) {
        throw new Error(
          productsData.message || "Failed to load products"
        );
      }

      if (!movementsRes.ok) {
        throw new Error(
          movementsData.message || "Failed to load movements"
        );
      }

      setProducts(productsData.data || []);
      setMovements(movementsData.data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load inventory"
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedProduct || !quantity || !reason.trim()) {
      toast.error("Fill all fields");
      return;
    }

    const numericQuantity = Number(quantity);

    if (numericQuantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const selected = products.find(
      (product) => product.id === selectedProduct
    );

    if (!selected) {
      toast.error("Product not found");
      return;
    }

    if (
      type === "OUT" &&
      numericQuantity > selected.currentStock
    ) {
      toast.error("Insufficient stock");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/products/${selectedProduct}/movements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: numericQuantity,
            type,
            reason: reason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Stock update failed"
        );
      }

      toast.success(
        result.message || "Stock updated successfully"
      );

      setQuantity("");
      setReason("");
      setSelectedProduct("");

      await loadData();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Stock update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter(
    (product) =>
      product.currentStock <= product.minimumStock
  );

  const totalUnits = products.reduce(
    (total, product) => total + product.currentStock,
    0
  );

  const totalStockIn = movements
    .filter((movement) => movement.type === "IN")
    .reduce(
      (total, movement) => total + movement.quantity,
      0
    );

  const totalStockOut = movements
    .filter((movement) => movement.type === "OUT")
    .reduce(
      (total, movement) => total + movement.quantity,
      0
    );

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Page header */}
      <header className="border-b border-white/[0.06] bg-[#0b0b0b]">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/10 bg-amber-400/[0.07] text-amber-400">
              <Package size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Inventory
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Monitor stock levels and manage inventory movements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={refreshing}
            className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>
      </header>

      <main className="space-y-8 p-6 lg:p-8">
        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Products"
            value={products.length}
            icon={<Package size={18} />}
          />

          <StatCard
            label="Total Units"
            value={totalUnits}
            icon={<TrendingUp size={18} />}
          />

          <StatCard
            label="Stock In"
            value={totalStockIn}
            icon={<ArrowUp size={18} />}
            positive
          />

          <StatCard
            label="Stock Out"
            value={totalStockOut}
            icon={<ArrowDown size={18} />}
            negative
          />
        </section>

        {/* Low stock alert */}
        {lowStockProducts.length > 0 && (
          <section className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  Low stock attention required
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  {lowStockProducts.length} product
                  {lowStockProducts.length !== 1
                    ? "s are"
                    : " is"}{" "}
                  at or below the minimum stock level.
                </p>
              </div>

              <div className="rounded-full border border-amber-400/10 bg-amber-400/[0.06] px-3 py-1 text-xs font-medium text-amber-300">
                {lowStockProducts.length} Low Stock
              </div>
            </div>
          </section>
        )}

        {/* Stock movement */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d0d]">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-neutral-400">
                <Plus size={17} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Stock Movement
                </h2>

                <p className="mt-0.5 text-xs text-neutral-600">
                  Add or remove inventory
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4"
          >
            <Field label="Product">
              <select
                value={selectedProduct}
                onChange={(event) =>
                  setSelectedProduct(event.target.value)
                }
                className="w-full rounded-xl border border-white/[0.08] bg-[#080808] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/50"
                required
              >
                <option value="">
                  Select Product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — Stock:{" "}
                    {product.currentStock}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Movement">
              <select
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value as "IN" | "OUT"
                  )
                }
                className="w-full rounded-xl border border-white/[0.08] bg-[#080808] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/50"
              >
                <option value="IN">
                  Stock IN
                </option>

                <option value="OUT">
                  Stock OUT
                </option>
              </select>
            </Field>

            <Field label="Quantity">
              <input
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                className="w-full rounded-xl border border-white/[0.08] bg-[#080808] px-4 py-3 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-amber-400/50"
                required
              />
            </Field>

            <Field label="Reason">
              <input
                type="text"
                placeholder="e.g. New purchase"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                className="w-full rounded-xl border border-white/[0.08] bg-[#080808] px-4 py-3 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-amber-400/50"
                required
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="group flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-4"
            >
              {type === "IN" ? (
                <ArrowUp size={17} />
              ) : (
                <ArrowDown size={17} />
              )}

              {loading
                ? "Updating..."
                : type === "IN"
                ? "Add Stock"
                : "Remove Stock"}
            </button>
          </form>
        </section>

        {/* Current stock */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Current Stock
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                Live inventory levels
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] px-6 py-12 text-center text-sm text-neutral-600">
              No products found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const low =
                  product.currentStock <=
                  product.minimumStock;

                const stockPercentage =
                  product.minimumStock > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (product.currentStock /
                            product.minimumStock) *
                            100
                        )
                      )
                    : product.currentStock > 0
                    ? 100
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-[#111111]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs tracking-wide text-neutral-600">
                          {product.sku}
                        </p>
                      </div>

                      <span
                        className={
                          low
                            ? "shrink-0 rounded-full border border-red-400/10 bg-red-400/[0.06] px-3 py-1 text-[11px] font-medium text-red-400"
                            : "shrink-0 rounded-full border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-400"
                        }
                      >
                        {low
                          ? "Low Stock"
                          : "Healthy"}
                      </span>
                    </div>

                    <div className="mt-7 flex items-end justify-between">
                      <div>
                        <p className="text-4xl font-semibold tracking-tight text-white">
                          {product.currentStock}
                        </p>

                        <p className="mt-1 text-xs text-neutral-600">
                          Minimum {product.minimumStock}
                        </p>
                      </div>

                      <div
                        className={
                          low
                            ? "flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/[0.06] text-red-400"
                            : "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/[0.06] text-emerald-400"
                        }
                      >
                        {low ? (
                          <TrendingDown size={18} />
                        ) : (
                          <TrendingUp size={18} />
                        )}
                      </div>
                    </div>

                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className={
                          low
                            ? "h-full rounded-full bg-red-400 transition-all duration-500"
                            : "h-full rounded-full bg-emerald-400 transition-all duration-500"
                        }
                        style={{
                          width: `${stockPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Movement history */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d0d]">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <h2 className="font-semibold">
              Stock Movement History
            </h2>

            <p className="mt-1 text-xs text-neutral-600">
              Recent inventory activity
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-white/[0.05] bg-white/[0.015]">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                    Product
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                    Type
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                    Quantity
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                    Reason
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {movements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-neutral-600"
                    >
                      No stock movements found.
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-200">
                          {movement.product.name}
                        </div>

                        <div className="mt-1 text-xs text-neutral-600">
                          {movement.product.sku}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            movement.type === "IN"
                              ? "inline-flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-400"
                              : "inline-flex items-center gap-2 rounded-full border border-red-400/10 bg-red-400/[0.06] px-3 py-1.5 text-xs font-medium text-red-400"
                          }
                        >
                          {movement.type === "IN" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          )}

                          {movement.type}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-white">
                        {movement.quantity}
                      </td>

                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {movement.reason}
                      </td>

                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {new Date(
                          movement.createdAt
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------------------------------------------
   Small reusable UI components
---------------------------------------------- */

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  positive?: boolean;
  negative?: boolean;
};

function StatCard({
  label,
  value,
  icon,
  positive,
  negative,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.12]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value.toLocaleString()}
          </p>
        </div>

        <div
          className={
            positive
              ? "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/[0.06] text-emerald-400"
              : negative
              ? "flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/[0.06] text-red-400"
              : "flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/[0.06] text-amber-400"
          }
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-neutral-500">
        {label}
      </label>

      {children}
    </div>
  );
}