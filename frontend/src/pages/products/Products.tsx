import { useEffect, useState } from "react";
import {
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
  X,
  Boxes,
  Warehouse,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../services/api";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number | string;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
};

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  minimumStock: string;
  warehouse: string;
};

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
  minimumStock: "0",
  warehouse: "",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/products", {
        params: search ? { search } : undefined,
      });

      setProducts(response.data?.data || []);
    } catch (error) {
      console.error("Fetch products error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchProducts();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: String(product.unitPrice),
      minimumStock: String(product.minimumStock),
      warehouse: product.warehouse,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (
    field: keyof ProductForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.sku.trim() ||
      !form.category.trim() ||
      !form.unitPrice ||
      !form.warehouse.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const unitPrice = Number(form.unitPrice);
    const minimumStock = Number(form.minimumStock);

    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      toast.error("Enter a valid unit price");
      return;
    }

    if (
      Number.isNaN(minimumStock) ||
      minimumStock < 0
    ) {
      toast.error("Enter a valid minimum stock");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim(),
        unitPrice,
        minimumStock,
        warehouse: form.warehouse.trim(),
      };

      if (editingId) {
        await api.put(
          `/products/${editingId}`,
          payload
        );

        toast.success("Product updated successfully");
      } else {
        await api.post("/products", payload);

        toast.success("Product created successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchProducts();
    } catch (error) {
      console.error("Save product error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/products/${id}`);

      toast.success("Product deleted");

      await fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete product"
      );
    }
  };

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) =>
      sum + (Number(product.currentStock) || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.currentStock) <=
      Number(product.minimumStock)
  ).length;

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.currentStock || 0) *
        Number(product.unitPrice || 0),
    0
  );

  return (
    <div>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{
              rotate: 8,
              scale: 1.05,
            }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300"
          >
            <Package size={20} />
          </motion.div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/70">
              Inventory Control
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Products
            </h1>

            <p className="mt-1 max-w-xl text-sm text-zinc-500">
              Manage your product catalogue, pricing,
              warehouses and stock thresholds.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{
            y: -2,
            scale: 1.01,
          }}
          whileTap={{
            scale: 0.98,
          }}
          onClick={openCreateModal}
          className="group flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-black shadow-xl shadow-amber-950/20 transition hover:bg-amber-300"
        >
          <Plus
            size={18}
            className="transition-transform group-hover:rotate-90"
          />

          Add Product
        </motion.button>
      </motion.header>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Boxes size={19} />}
          label="Products"
          value={totalProducts}
          accent="amber"
        />

        <StatCard
          icon={<Package size={19} />}
          label="Total Stock"
          value={totalStock}
          accent="yellow"
        />

        <StatCard
          icon={<AlertTriangle size={19} />}
          label="Low Stock"
          value={lowStockProducts}
          accent="orange"
        />

        <StatCard
          icon={<IndianRupee size={19} />}
          label="Inventory Value"
          value={`₹${inventoryValue.toLocaleString(
            "en-IN",
            {
              maximumFractionDigits: 0,
            }
          )}`}
          accent="gold"
        />
      </div>

      {/* Search */}
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.08,
        }}
        className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl"
      >
        <div className="relative max-w-xl">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products by name or SKU..."
            className="w-full rounded-xl border border-white/[0.07] bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-400/40 focus:bg-black/50"
          />
        </div>
      </motion.div>

      {/* Product table */}
      <motion.div
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.12,
        }}
        className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div className="border-b border-white/[0.06] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Product Catalogue
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                {products.length} products currently
                displayed
              </p>
            </div>

            <Warehouse
              size={19}
              className="text-zinc-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-white/[0.05] bg-black/20">
                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Product
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  SKU
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Category
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Price
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Stock
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Warehouse
                </th>

                <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <motion.div
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="h-6 w-6 rounded-full border-2 border-amber-400/20 border-t-amber-400"
                      />

                      <span className="text-sm text-zinc-600">
                        Loading products...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center"
                  >
                    <Package
                      size={30}
                      className="mx-auto mb-3 text-zinc-700"
                    />

                    <p className="text-sm text-zinc-500">
                      No products found.
                    </p>

                    <button
                      onClick={openCreateModal}
                      className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/15"
                    >
                      Add Product
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const stock =
                    Number(product.currentStock) || 0;

                  const minimum =
                    Number(product.minimumStock) || 0;

                  const lowStock =
                    stock <= minimum;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.25,
                        delay: index * 0.025,
                      }}
                      className="group border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/10 bg-amber-400/5 text-amber-300">
                            <Package size={16} />
                          </div>

                          <div>
                            <p className="font-medium text-zinc-200">
                              {product.name}
                            </p>

                            <p className="text-xs text-zinc-600">
                              Product
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 font-mono text-xs text-zinc-500">
                        {product.sku}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-lg border border-amber-400/10 bg-amber-400/5 px-2.5 py-1 text-xs text-amber-300">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-6 py-5 font-medium text-zinc-300">
                        ₹
                        {Number(
                          product.unitPrice
                        ).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                              lowStock
                                ? "border-amber-400/15 bg-amber-400/5 text-amber-300"
                                : "border-emerald-400/15 bg-emerald-400/5 text-emerald-300"
                            }`}
                          >
                            {stock}
                          </span>

                          {lowStock && (
                            <AlertTriangle
                              size={14}
                              className="text-amber-400"
                            />
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-zinc-500">
                        {product.warehouse}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                          <motion.button
                            whileHover={{
                              scale: 1.08,
                            }}
                            whileTap={{
                              scale: 0.95,
                            }}
                            onClick={() =>
                              openEditModal(product)
                            }
                            className="rounded-xl p-2.5 text-zinc-600 transition hover:bg-amber-400/10 hover:text-amber-300"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </motion.button>

                          <motion.button
                            whileHover={{
                              scale: 1.08,
                            }}
                            whileTap={{
                              scale: 0.95,
                            }}
                            onClick={() =>
                              handleDelete(product.id)
                            }
                            className="rounded-xl p-2.5 text-zinc-600 transition hover:bg-red-400/10 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 10,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#111111] shadow-2xl shadow-black/60"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/70">
                    Catalogue
                  </p>

                  <h2 className="text-xl font-bold text-white">
                    {editingId
                      ? "Edit Product"
                      : "Add Product"}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-600">
                    Configure product information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2.5 text-zinc-600 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6 p-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="Product Name *"
                    value={form.name}
                    onChange={(value) =>
                      handleChange("name", value)
                    }
                  />

                  <Input
                    label="SKU *"
                    value={form.sku}
                    onChange={(value) =>
                      handleChange("sku", value)
                    }
                  />

                  <Input
                    label="Category *"
                    value={form.category}
                    onChange={(value) =>
                      handleChange(
                        "category",
                        value
                      )
                    }
                  />

                  <Input
                    label="Unit Price *"
                    type="number"
                    value={form.unitPrice}
                    onChange={(value) =>
                      handleChange(
                        "unitPrice",
                        value
                      )
                    }
                  />

                  <Input
                    label="Minimum Stock"
                    type="number"
                    value={form.minimumStock}
                    onChange={(value) =>
                      handleChange(
                        "minimumStock",
                        value
                      )
                    }
                  />

                  <Input
                    label="Warehouse *"
                    value={form.warehouse}
                    onChange={(value) =>
                      handleChange(
                        "warehouse",
                        value
                      )
                    }
                  />
                </div>

                <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-4">
                  <div className="flex gap-3">
                    <Package
                      size={18}
                      className="mt-0.5 text-amber-300"
                    />

                    <div>
                      <p className="text-sm font-medium text-amber-200">
                        Stock management
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        Initial stock is managed through
                        Inventory and Stock Movements.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    Cancel
                  </button>

                  <motion.button
                    whileHover={{
                      y: -1,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-950/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Product"
                      : "Create Product"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent:
    | "amber"
    | "yellow"
    | "orange"
    | "gold";
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: StatCardProps) {
  const accentClasses = {
    amber:
      "border-amber-400/10 bg-amber-400/[0.035] text-amber-300",

    yellow:
      "border-yellow-400/10 bg-yellow-400/[0.035] text-yellow-300",

    orange:
      "border-orange-400/10 bg-orange-400/[0.035] text-orange-300",

    gold:
      "border-amber-300/10 bg-amber-300/[0.035] text-amber-200",
  };

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl transition-shadow hover:shadow-xl hover:shadow-black/20"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accentClasses[accent]}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   INPUT
========================================================= */

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
};

function Input({
  label,
  value,
  onChange,
  type = "text",
}: InputProps) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-amber-400/40 focus:bg-black/50"
        required={label.includes("*")}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        step={
          type === "number"
            ? "any"
            : undefined
        }
      />
    </div>
  );
}