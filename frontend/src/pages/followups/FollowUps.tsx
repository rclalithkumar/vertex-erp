import { useEffect, useState } from "react";
import {
  Plus,
  CheckCircle,
  Clock,
  Trash2,
  UserRound,
  CalendarClock,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type Customer = {
  id: string;
  name: string;
  businessName: string;
};

type FollowUp = {
  id: string;
  note: string;
  followUpAt: string;
  createdAt: string;
  status: "PENDING" | "COMPLETED";
  customerId: string;
  customer: Customer;
};

const API_URL = "http://localhost:5000/api";

export default function FollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoadingData(true);

      const token = localStorage.getItem("token");

      // -----------------------------
      // Load customers
      // -----------------------------
      const customersResponse = await fetch(
        `${API_URL}/customers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const customersResult =
        await customersResponse.json();

      if (!customersResponse.ok) {
        throw new Error(
          customersResult.message ||
            "Failed to load customers"
        );
      }

      const customerList: Customer[] =
        customersResult.data || [];

      setCustomers(customerList);

      // -----------------------------
      // Load follow-ups
      // -----------------------------
      const followUpResponses =
        await Promise.all(
          customerList.map(async (customer) => {
            const response = await fetch(
              `${API_URL}/customers/${customer.id}/followups`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const result = await response.json();

            if (!response.ok) {
              throw new Error(
                result.message ||
                  `Failed to load follow-ups for ${customer.name}`
              );
            }

            return (result.data || []).map(
              (
                followUp: Omit<
                  FollowUp,
                  "customer"
                >
              ) => ({
                ...followUp,
                customer,
              })
            );
          })
        );

      const allFollowUps: FollowUp[] =
        followUpResponses
          .flat()
          .sort(
            (a, b) =>
              new Date(
                b.followUpAt
              ).getTime() -
              new Date(
                a.followUpAt
              ).getTime()
          );

      setFollowUps(allFollowUps);
    } catch (error) {
      console.error(
        "Load follow-ups error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load follow-ups"
      );
    } finally {
      setLoadingData(false);
    }
  };

  // ---------------------------------
  // Initial load
  // ---------------------------------
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };

    // loadData intentionally handled once
    // when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------
  // Create Follow-up
  // ---------------------------------
  const createFollowUp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!customerId) {
      toast.error("Select a customer");
      return;
    }

    if (!followUpAt) {
      toast.error(
        "Select follow-up date and time"
      );
      return;
    }

    if (!note.trim()) {
      toast.error("Enter follow-up note");
      return;
    }

    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/customers/${customerId}/followups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            note: note.trim(),
            followUpAt,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create follow-up"
        );
      }

      toast.success(
        "Follow-up created successfully"
      );

      setCustomerId("");
      setFollowUpAt("");
      setNote("");

      await loadData();
    } catch (error) {
      console.error(
        "Create follow-up error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create follow-up"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------
  // Complete Follow-up
  // ---------------------------------
  const completeFollowUp = async (id: string) => {
  try {
    setActionId(id);

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/followups/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to complete follow-up"
      );
    }

    toast.success("Follow-up completed successfully");

    await loadData();
  } catch (error) {
    console.error("Complete follow-up error:", error);

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to complete follow-up"
    );
  } finally {
    setActionId(null);
  }
};
  // ---------------------------------
  // Delete Follow-up
  // ---------------------------------
  const deleteFollowUp = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this follow-up?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(id);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/followups/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete follow-up"
        );
      }

      toast.success(
        "Follow-up deleted successfully"
      );

      await loadData();
    } catch (error) {
      console.error(
        "Delete follow-up error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete follow-up"
      );
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = followUps.filter(
    (followUp) =>
      followUp.status === "PENDING"
  ).length;

  const completedCount = followUps.filter(
    (followUp) =>
      followUp.status === "COMPLETED"
  ).length;

  return (
    <div className="min-h-screen text-white">
      {/* -------------------------------- */}
      {/* Header */}
      {/* -------------------------------- */}

      <motion.header
        initial={{
          opacity: 0,
          y: -15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
        }}
        className="mb-8"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock
                size={15}
                className="text-amber-300"
              />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                CRM Operations
              </span>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Follow-ups
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Schedule customer follow-ups,
              track pending conversations and
              keep your sales pipeline moving.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                Pending
              </p>

              <p className="mt-1 text-xl font-semibold text-amber-200">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] px-5 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                Completed
              </p>

              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {completedCount}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* -------------------------------- */}
      {/* Create Follow-up */}
      {/* -------------------------------- */}

      <motion.section
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.08,
        }}
        className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#101010]"
      >
        {/* Section header */}

        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/70">
              New activity
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Create Follow-up
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Clock size={14} />

            Schedule a reminder
          </div>
        </div>

        <form
          onSubmit={createFollowUp}
          className="p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
            {/* Customer */}

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                Customer
              </label>

              <div className="relative">
                <UserRound
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600"
                />

                <select
                  value={customerId}
                  onChange={(event) =>
                    setCustomerId(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#080808] px-11 py-3.5 text-sm text-white outline-none transition focus:border-amber-300/40"
                  required
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name} —{" "}
                        {
                          customer.businessName
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Date */}

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                Follow-up Date
              </label>

              <input
                type="datetime-local"
                value={followUpAt}
                onChange={(event) =>
                  setFollowUpAt(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3.5 text-sm text-white outline-none transition focus:border-amber-300/40"
                required
              />
            </div>

            {/* Note */}

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                Note
              </label>

              <input
                type="text"
                placeholder="e.g. Call regarding quotation"
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3.5 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-amber-300/40"
                required
              />
            </div>
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 py-3.5 text-sm font-bold text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus
              size={17}
              className="transition-transform group-hover:rotate-90"
            />

            {loading
              ? "Creating..."
              : "Create Follow-up"}
          </button>
        </form>
      </motion.section>

      {/* -------------------------------- */}
      {/* Follow-up History */}
      {/* -------------------------------- */}

      <motion.section
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.15,
        }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010]"
      >
        {/* History header */}

        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
              Activity
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Follow-up History
            </h2>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025]">
            <Clock
              size={17}
              className="text-neutral-600"
            />
          </div>
        </div>

        {/* Loading */}

        {loadingData ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-white/[0.035]"
              />
            ))}
          </div>
        ) : followUps.length === 0 ? (
          /* Empty state */

          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025]">
              <Clock
                size={22}
                className="text-neutral-600"
              />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              No follow-ups yet
            </h3>

            <p className="mt-1 text-sm text-neutral-600">
              Create your first customer
              follow-up above.
            </p>
          </div>
        ) : (
          /* Table */

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Follow-up
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Note
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {followUps.map(
                  (followUp, index) => (
                    <motion.tr
                      key={followUp.id}
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        delay:
                          index * 0.035,
                      }}
                      className="border-b border-white/[0.045] transition hover:bg-white/[0.02]"
                    >
                      {/* Customer */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.035] text-neutral-400">
                            <UserRound
                              size={16}
                            />
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {
                                followUp
                                  .customer
                                  .name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-neutral-600">
                              {
                                followUp
                                  .customer
                                  .businessName
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock
                            size={15}
                            className={
                              followUp.status ===
                              "COMPLETED"
                                ? "text-neutral-700"
                                : "text-amber-300"
                            }
                          />

                          <span className="text-sm text-neutral-300">
                            {new Date(
                              followUp.followUpAt
                            ).toLocaleString(
                              "en-IN",
                              {
                                dateStyle:
                                  "medium",
                                timeStyle:
                                  "short",
                              }
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Note */}

                      <td className="max-w-[280px] px-6 py-5">
                        <p className="truncate text-sm text-neutral-400">
                          {followUp.note}
                        </p>
                      </td>

                      {/* Status */}

                      <td className="px-6 py-5">
                        {followUp.status ===
                        "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                            <CheckCircle
                              size={12}
                            />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                            <Clock
                              size={12}
                            />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          {followUp.status !==
                            "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() =>
                                completeFollowUp(
                                  followUp.id
                                )
                              }
                              disabled={
                                actionId ===
                                followUp.id
                              }
                              className="flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle
                                size={14}
                              />

                              {actionId ===
                              followUp.id
                                ? "..."
                                : "Complete"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              deleteFollowUp(
                                followUp.id
                              )
                            }
                            disabled={
                              actionId ===
                              followUp.id
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-red-400/15 bg-red-400/5 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2
                              size={14}
                            />

                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </div>
  );
}