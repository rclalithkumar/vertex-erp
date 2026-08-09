import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

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

type FollowUp = {
  id: string;
  note: string;
  followUpAt: string;
  createdAt: string;
  completed?: boolean;
};

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  /*
   * ==========================================
   * LOAD CUSTOMER + FOLLOW-UPS
   * ==========================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [customerResponse, followUpsResponse] =
          await Promise.all([
            api.get(`/customers/${id}`),
            api.get(`/customers/${id}/followups`),
          ]);

        if (cancelled) return;

        const customerResult = customerResponse.data;
        const followUpsResult = followUpsResponse.data;

        const customerData =
          customerResult.data?.customer ||
          customerResult.data;

        setCustomer(customerData);

        setFollowUps(followUpsResult.data || []);

        if (customerData?.followUpDate) {
          setFollowUpDate(
            customerData.followUpDate.split("T")[0]
          );
        } else {
          setFollowUpDate("");
        }
      } catch (error) {
        if (cancelled) return;

        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load customer"
        );

        navigate("/customers");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  /*
   * ==========================================
   * REFRESH CUSTOMER
   * ==========================================
   */

  const refreshCustomer = async () => {
    if (!id) return;

    try {
      const response = await api.get(`/customers/${id}`);

      const result = response.data;

      const customerData =
        result.data?.customer ||
        result.data;

      setCustomer(customerData);

      if (customerData?.followUpDate) {
        setFollowUpDate(
          customerData.followUpDate.split("T")[0]
        );
      } else {
        setFollowUpDate("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * ==========================================
   * REFRESH FOLLOW-UPS
   * ==========================================
   */

  const refreshFollowUps = async () => {
    if (!id) return;

    try {
      const response = await api.get(
        `/customers/${id}/followups`
      );

      const result = response.data;

      setFollowUps(result.data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load follow-ups"
      );
    }
  };

  /*
   * ==========================================
   * ADD FOLLOW-UP
   * ==========================================
   */

  const addFollowUp = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!id) return;

    if (!note.trim()) {
      toast.error("Enter a follow-up note");
      return;
    }

    if (!followUpDate) {
      toast.error("Select a follow-up date");
      return;
    }

    try {
      setSaving(true);

      await api.post(
        `/customers/${id}/followups`,
        {
          note: note.trim(),
          followUpAt: followUpDate,
        }
      );

      toast.success("Follow-up added");

      setNote("");

      await refreshFollowUps();
      await refreshCustomer();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add follow-up"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================
   * TOGGLE FOLLOW-UP
   * ==========================================
   */

  const toggleFollowUp = async (
    followUp: FollowUp
  ) => {
    try {
      await api.put(
        `/followups/${followUp.id}`,
        {
          completed: !followUp.completed,
        }
      );

      toast.success(
        followUp.completed
          ? "Follow-up reopened"
          : "Follow-up completed"
      );

      await refreshFollowUps();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update follow-up"
      );
    }
  };

  /*
   * ==========================================
   * DELETE FOLLOW-UP
   * ==========================================
   */

  const deleteFollowUp = async (
    followUpId: string
  ) => {
    const confirmed = window.confirm(
      "Delete this follow-up?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/followups/${followUpId}`
      );

      toast.success("Follow-up deleted");

      await refreshFollowUps();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete follow-up"
      );
    }
  };

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-yellow-400" />

          <span className="text-sm">
            Loading customer...
          </span>
        </div>
      </div>
    );
  }

  /*
   * ==========================================
   * CUSTOMER NOT FOUND
   * ==========================================
   */

  if (!customer) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold text-white">
          Customer not found
        </p>

        <Link
          to="/customers"
          className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  /*
   * ==========================================
   * PAGE
   * ==========================================
   */

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
        className="mb-8"
      >
        <button
          type="button"
          onClick={() =>
            navigate("/customers")
          }
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />

          Back to Customers
        </button>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/10 bg-yellow-400/10 text-xl font-semibold text-yellow-300">
              {customer.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400/70">
                Customer Profile
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {customer.name}
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                {customer.businessName}
              </p>
            </div>
          </div>

          <Link
            to="/customers"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            <Edit size={16} />

            Edit from Customers
          </Link>
        </div>
      </motion.header>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        {/* Customer information */}

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
            delay: 0.05,
          }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/20"
        >
          <div className="border-b border-white/[0.06] px-6 py-5">
            <h2 className="font-semibold text-white">
              Customer Information
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Business and contact details
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <InfoItem
              icon={<User size={16} />}
              label="Customer"
              value={customer.name}
            />

            <InfoItem
              icon={<Building2 size={16} />}
              label="Business"
              value={customer.businessName}
            />

            <InfoItem
              icon={<Phone size={16} />}
              label="Mobile"
              value={customer.mobile}
            />

            <InfoItem
              icon={<Mail size={16} />}
              label="Email"
              value={
                customer.email ||
                "Not provided"
              }
            />

            <InfoItem
              icon={<Building2 size={16} />}
              label="Customer Type"
              value={customer.customerType}
            />

            <InfoItem
              icon={<StickyNote size={16} />}
              label="GST Number"
              value={
                customer.gstNumber ||
                "Not provided"
              }
            />

            <InfoItem
              icon={<MapPin size={16} />}
              label="Address"
              value={customer.address}
            />

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                Status
              </p>

              <StatusBadge
                status={
                  customer.status ||
                  "ACTIVE"
                }
              />
            </div>

            {customer.notes && (
              <div className="sm:col-span-2">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                  Notes
                </p>

                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 text-sm leading-6 text-zinc-400">
                  {customer.notes}
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Add follow-up */}

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
            delay: 0.1,
          }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.025]"
        >
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-300">
                <Plus size={17} />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Add Follow-up
                </h2>

                <p className="mt-1 text-sm text-zinc-600">
                  Record your next customer action
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={addFollowUp}
            className="space-y-5 p-6"
          >
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Follow-up Date
              </label>

              <input
                type="date"
                value={followUpDate}
                onChange={(event) =>
                  setFollowUpDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-400/40 focus:bg-black/50"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Follow-up Note
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Example: Call customer regarding pending quotation..."
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-yellow-400/40 focus:bg-black/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />

              {saving
                ? "Adding..."
                : "Add Follow-up"}
            </button>
          </form>
        </motion.section>
      </div>

      {/* Follow-up history */}

      <motion.section
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.15,
        }}
        className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 className="font-semibold text-white">
              Follow-up History
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Customer interactions and upcoming actions
            </p>
          </div>

          <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-500">
            {followUps.length} record
            {followUps.length === 1
              ? ""
              : "s"}
          </div>
        </div>

        <div className="p-6">
          {followUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
                <Clock
                  size={20}
                  className="text-zinc-600"
                />
              </div>

              <p className="text-sm font-medium text-zinc-400">
                No follow-ups yet
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Add the first follow-up above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map(
                (followUp) => (
                  <motion.div
                    key={followUp.id}
                    layout
                    className={`rounded-xl border p-4 transition ${
                      followUp.completed
                        ? "border-emerald-400/10 bg-emerald-400/[0.025]"
                        : "border-white/[0.07] bg-black/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            toggleFollowUp(
                              followUp
                            )
                          }
                          className={`mt-0.5 shrink-0 rounded-lg p-1.5 transition ${
                            followUp.completed
                              ? "text-emerald-400 hover:bg-emerald-400/10"
                              : "text-zinc-600 hover:bg-white/[0.06] hover:text-yellow-400"
                          }`}
                          title={
                            followUp.completed
                              ? "Mark as pending"
                              : "Mark as completed"
                          }
                        >
                          <CheckCircle2
                            size={18}
                          />
                        </button>

                        <div>
                          <p
                            className={`text-sm leading-6 ${
                              followUp.completed
                                ? "text-zinc-500 line-through"
                                : "text-zinc-300"
                            }`}
                          >
                            {followUp.note}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-600">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays
                                size={13}
                              />

                              {formatDate(
                                followUp.followUpAt
                              )}
                            </span>

                            <span>
                              Added{" "}
                              {formatDate(
                                followUp.createdAt
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteFollowUp(
                            followUp.id
                          )
                        }
                        className="shrink-0 rounded-lg p-2 text-zinc-700 transition hover:bg-red-400/10 hover:text-red-400"
                        title="Delete follow-up"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-zinc-600">
        {icon}

        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">
          {label}
        </p>
      </div>

      <p className="text-sm text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const isInactive =
    status === "INACTIVE";

  const isLead =
    status === "LEAD";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
        isInactive
          ? "bg-red-400/10 text-red-300"
          : isLead
          ? "bg-yellow-400/10 text-yellow-300"
          : "bg-emerald-400/10 text-emerald-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isInactive
            ? "bg-red-400"
            : isLead
            ? "bg-yellow-400"
            : "bg-emerald-400"
        }`}
      />

      {status}
    </span>
  );
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}