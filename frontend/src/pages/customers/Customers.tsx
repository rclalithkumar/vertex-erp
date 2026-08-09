import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Edit,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

type Customer = {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName: string;
  gstNumber?: string | null;
  customerType: string;
  address: string;
  status?: string;
  followUpDate?: string | null;
  notes?: string | null;
};

type CustomerForm = {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: string;
  address: string;
  status: string;
  followUpDate: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "ACTIVE",
  followUpDate: "",
  notes: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/customers", {
        params: search
          ? {
              search,
            }
          : undefined,
      });

      const result = response.data;

      /*
       * Supports both:
       *
       * { success: true, data: [...] }
       *
       * and:
       *
       * { data: { customers: [...] } }
       */

      const customerData =
        result?.data?.customers ??
        result?.data ??
        result?.customers ??
        [];

      setCustomers(
        Array.isArray(customerData)
          ? customerData
          : []
      );
    } catch (error) {
      console.error("Fetch customers error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load customers";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingId(customer.id);

    setForm({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || "",
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || "",
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status || "ACTIVE",
      followUpDate: customer.followUpDate
        ? customer.followUpDate.split("T")[0]
        : "",
      notes: customer.notes || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleChange = (
    field: keyof CustomerForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.mobile.trim() ||
      !form.businessName.trim() ||
      !form.customerType ||
      !form.address.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        followUpDate: form.followUpDate || null,
        email: form.email || null,
        gstNumber: form.gstNumber || null,
        notes: form.notes || null,
      };

      if (editingId) {
        await api.put(
          `/customers/${editingId}`,
          payload
        );

        toast.success(
          "Customer updated successfully"
        );
      } else {
        await api.post(
          "/customers",
          payload
        );

        toast.success(
          "Customer created successfully"
        );
      }

      closeModal();

      await fetchCustomers();
    } catch (error) {
      console.error(
        "Customer save error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/customers/${id}`
      );

      toast.success("Customer deleted");

      await fetchCustomers();
    } catch (error) {
      console.error(
        "Delete customer error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete customer";

      toast.error(message);
    }
  };

  return (
    <div>
      {/* Header */}

      <motion.header
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400/70">
            CRM
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Customers
          </h1>

          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Manage customer relationships, business
            information, follow-ups and account activity.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          className="group flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-xl shadow-black/20 transition hover:bg-zinc-200"
        >
          <Plus
            size={17}
            className="transition-transform group-hover:rotate-90"
          />

          Add Customer
        </motion.button>
      </motion.header>

      {/* Search + count */}

      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.08,
          duration: 0.35,
        }}
        className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative w-full sm:max-w-md">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customers..."
            className="w-full rounded-xl border border-white/[0.08] bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/40 focus:bg-black/50"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />

          {customers.length} customer
          {customers.length === 1 ? "" : "s"}
        </div>
      </motion.section>

      {/* Customer table */}

      <motion.section
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.14,
          duration: 0.4,
        }}
        className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] shadow-2xl shadow-black/20"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Customer
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Business
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Contact
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Type
                </th>

                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-yellow-400" />

                      <span className="text-sm text-zinc-600">
                        Loading customers...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                        <Users
                          size={22}
                          className="text-zinc-600"
                        />
                      </div>

                      <p className="font-medium text-zinc-300">
                        No customers found
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        Add your first customer to start
                        managing your CRM.
                      </p>

                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Add Customer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map(
                  (customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay:
                          index * 0.025,
                      }}
                      className="group transition-colors hover:bg-white/[0.025]"
                    >
                      {/* Customer */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-yellow-500/15 to-amber-500/10 text-sm font-semibold text-yellow-200">
                            {customer.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <Link
                              to={`/customers/${customer.id}`}
                              className="font-medium text-zinc-200 transition hover:text-yellow-300"
                            >
                              {customer.name}
                            </Link>

                            <p className="mt-0.5 text-xs text-zinc-600">
                              {customer.email ||
                                "No email provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Business */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Building2
                            size={15}
                            className="text-zinc-600"
                          />

                          {customer.businessName}
                        </div>
                      </td>

                      {/* Contact */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Phone
                            size={14}
                            className="text-zinc-600"
                          />

                          {customer.mobile}
                        </div>
                      </td>

                      {/* Type */}

                      <td className="px-6 py-5">
                        <span className="rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-zinc-400">
                          {customer.customerType}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            customer.status ===
                            "INACTIVE"
                              ? "bg-red-400/10 text-red-300"
                              : customer.status ===
                                "LEAD"
                              ? "bg-yellow-400/10 text-yellow-300"
                              : "bg-emerald-400/10 text-emerald-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              customer.status ===
                              "INACTIVE"
                                ? "bg-red-400"
                                : customer.status ===
                                  "LEAD"
                                ? "bg-yellow-400"
                                : "bg-emerald-400"
                            }`}
                          />

                          {customer.status ||
                            "ACTIVE"}
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                customer
                              )
                            }
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.07] hover:text-white"
                            title="Edit customer"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                customer.id
                              )
                            }
                            className="rounded-lg p-2 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
                            title="Delete customer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </motion.section>

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
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
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
                stiffness: 350,
                damping: 28,
              }}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#101010] shadow-2xl shadow-black/60"
            >
              {/* Modal header */}

              <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-300">
                      {editingId ? (
                        <Edit size={17} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </div>

                    <h2 className="text-lg font-semibold text-white">
                      {editingId
                        ? "Edit Customer"
                        : "Add Customer"}
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-zinc-600">
                    {editingId
                      ? "Update customer information"
                      : "Create a new customer record"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Form */}

              <form
                onSubmit={handleSubmit}
                className="space-y-6 p-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="Customer Name *"
                    value={form.name}
                    onChange={(value) =>
                      handleChange(
                        "name",
                        value
                      )
                    }
                  />

                  <Input
                    label="Mobile *"
                    value={form.mobile}
                    onChange={(value) =>
                      handleChange(
                        "mobile",
                        value
                      )
                    }
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      handleChange(
                        "email",
                        value
                      )
                    }
                  />

                  <Input
                    label="Business Name *"
                    value={
                      form.businessName
                    }
                    onChange={(value) =>
                      handleChange(
                        "businessName",
                        value
                      )
                    }
                  />

                  <Input
                    label="GST Number"
                    value={
                      form.gstNumber
                    }
                    onChange={(value) =>
                      handleChange(
                        "gstNumber",
                        value
                      )
                    }
                  />

                  <SelectField
                    label="Customer Type *"
                    value={
                      form.customerType
                    }
                    onChange={(value) =>
                      handleChange(
                        "customerType",
                        value
                      )
                    }
                    options={[
                      {
                        value: "RETAIL",
                        label: "Retail",
                      },
                      {
                        value: "WHOLESALE",
                        label: "Wholesale",
                      },
                      {
                        value: "DISTRIBUTOR",
                        label: "Distributor",
                      },
                    ]}
                  />

                  <SelectField
                    label="Status"
                    value={form.status}
                    onChange={(value) =>
                      handleChange(
                        "status",
                        value
                      )
                    }
                    options={[
                      {
                        value: "ACTIVE",
                        label: "Active",
                      },
                      {
                        value: "INACTIVE",
                        label: "Inactive",
                      },
                      {
                        value: "LEAD",
                        label: "Lead",
                      },
                    ]}
                  />

                  <Input
                    label="Follow-up Date"
                    type="date"
                    value={
                      form.followUpDate
                    }
                    onChange={(value) =>
                      handleChange(
                        "followUpDate",
                        value
                      )
                    }
                  />
                </div>

                <TextareaField
                  label="Address *"
                  value={form.address}
                  onChange={(value) =>
                    handleChange(
                      "address",
                      value
                    )
                  }
                  rows={3}
                />

                <TextareaField
                  label="Notes"
                  value={form.notes}
                  onChange={(value) =>
                    handleChange(
                      "notes",
                      value
                    )
                  }
                  rows={3}
                />

                {/* Actions */}

                <div className="flex justify-end gap-3 border-t border-white/[0.07] pt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
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
                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Customer"
                      : "Create Customer"}
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
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <div className="relative">
        {type === "email" && (
          <Mail
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700"
          />
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-yellow-400/40 focus:bg-black/50 ${
            type === "email"
              ? "pl-10"
              : ""
          }`}
          required={label.includes("*")}
        />
      </div>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-400/40 focus:bg-black/50"
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#111111]"
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

type TextareaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <div className="relative">
        <textarea
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          rows={rows}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-yellow-400/40 focus:bg-black/50"
        />

        {label.includes(
          "Address"
        ) && (
          <MapPin
            size={15}
            className="pointer-events-none absolute right-3 top-3 text-zinc-700"
          />
        )}
      </div>
    </div>
  );
}