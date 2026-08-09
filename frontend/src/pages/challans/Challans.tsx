import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Package,
  Plus,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
type Customer = {
  id: string;
  name: string;
  businessName: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  unitPrice: number;
};

type ChallanItem = {
  productId: string;
  quantity: number;
};

type Challan = {
  id: string;
  challanNumber: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  totalQuantity: number;
  customer: Customer;
  items: {
    id: string;
    quantity: number;
    productName: string;
    sku: string;
    unitPrice: number;
  }[];
};

const API_URL = "http://localhost:5000/api";

export default function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");

  const [items, setItems] = useState<ChallanItem[]>([
    {
      productId: "",
      quantity: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const loadData = useCallback(async () => {
    try {
      const [
        challansRes,
        customersRes,
        productsRes,
      ] = await Promise.all([
        fetch(`${API_URL}/challans`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/customers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const challansData = await challansRes.json();
      const customersData = await customersRes.json();
      const productsData = await productsRes.json();

      if (!challansRes.ok) {
        throw new Error(
          challansData.message ||
            "Failed to load challans"
        );
      }

      if (!customersRes.ok) {
        throw new Error(
          customersData.message ||
            "Failed to load customers"
        );
      }

      if (!productsRes.ok) {
        throw new Error(
          productsData.message ||
            "Failed to load products"
        );
      }

      setChallans(challansData.data || []);
      setCustomers(customersData.data || []);
      setProducts(productsData.data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load challans"
      );
    } finally {
      setPageLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;

      await loadData();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const addItem = () => {
    setItems((previous) => [
      ...previous,
      {
        productId: "",
        quantity: 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((previous) =>
      previous.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  const updateItem = (
    index: number,
    field: "productId" | "quantity",
    value: string
  ) => {
    setItems((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        [field]:
          field === "quantity"
            ? Math.max(1, Number(value) || 1)
            : value,
      };

      return updated;
    });
  };

  const getProduct = (productId: string) => {
    return products.find(
      (product) => product.id === productId
    );
  };

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + (Number(item.quantity) || 0),
      0
    );
  }, [items]);

  const estimatedValue = useMemo(() => {
    return items.reduce((total, item) => {
      const product = products.find(
        (currentProduct) =>
          currentProduct.id === item.productId
      );

      if (!product) {
        return total;
      }

      return (
        total +
        product.unitPrice *
          (Number(item.quantity) || 0)
      );
    }, 0);
  }, [items, products]);
  const downloadInvoice = async (id: string) => {
  try {
    const response = await fetch(
      `${API_URL}/challans/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to fetch challan"
      );
    }

    const challan = result.data;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    /*
     * --------------------------------------------------
     * COMPANY INFORMATION
     * --------------------------------------------------
     */

    const companyName = "NexaCore Solutions";
    const companyTagline =
      "Business & Technology Solutions";

    const companyAddress =
      "Bengaluru, Karnataka, India";

    const companyPhone =
      "+91 98765 43210";

    const companyEmail =
      "contact@nexacore.in";

    /*
     * --------------------------------------------------
     * HEADER
     * --------------------------------------------------
     */

    pdf.setFillColor(15, 23, 42);
    pdf.rect(
      0,
      0,
      pageWidth,
      38,
      "F"
    );

    // Company name
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);

    pdf.text(
      companyName,
      margin,
      16
    );

    // Tagline
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    pdf.setTextColor(203, 213, 225);

    pdf.text(
      companyTagline,
      margin,
      22
    );

    pdf.text(
      companyAddress,
      margin,
      27
    );

    pdf.text(
      `${companyPhone}  |  ${companyEmail}`,
      margin,
      32
    );

    /*
     * TAX INVOICE
     */

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);

    pdf.text(
      "TAX INVOICE",
      pageWidth - margin,
      17,
      {
        align: "right",
      }
    );

    /*
     * Status badge
     */

    const status =
      challan.status === "CONFIRMED"
        ? "CONFIRMED"
        : challan.status;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.setFillColor(
      status === "CONFIRMED"
        ? 16
        : 120,
      status === "CONFIRMED"
        ? 185
        : 120,
      status === "CONFIRMED"
        ? 129
        : 120
    );

    pdf.roundedRect(
      pageWidth - margin - 34,
      23,
      34,
      7,
      2,
      2,
      "F"
    );

    pdf.setTextColor(255, 255, 255);

    pdf.text(
      status,
      pageWidth - margin - 17,
      27.8,
      {
        align: "center",
      }
    );

    /*
     * --------------------------------------------------
     * INVOICE INFORMATION
     * --------------------------------------------------
     */

    let y = 50;

    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);

    pdf.text(
      "BILL TO",
      margin,
      y
    );

    pdf.text(
      "INVOICE DETAILS",
      125,
      y
    );

    y += 7;

    /*
     * Customer
     */

    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);

    pdf.text(
      challan.customer.name,
      margin,
      y
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    y += 5;

    pdf.setTextColor(71, 85, 105);

    if (
      challan.customer.businessName
    ) {
      pdf.text(
        challan.customer.businessName,
        margin,
        y
      );

      y += 4;
    }

    if (challan.customer.mobile) {
      pdf.text(
        `Mobile: ${challan.customer.mobile}`,
        margin,
        y
      );

      y += 4;
    }

    /*
     * Invoice details
     */

    const detailX = 125;
    let detailY = 57;

    const invoiceDate =
      new Date(
        challan.createdAt
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    pdf.text(
      "Invoice Number",
      detailX,
      detailY
    );

    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");

    pdf.text(
      challan.challanNumber,
      pageWidth - margin,
      detailY,
      {
        align: "right",
      }
    );

    detailY += 6;

    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "normal");

    pdf.text(
      "Invoice Date",
      detailX,
      detailY
    );

    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");

    pdf.text(
      invoiceDate,
      pageWidth - margin,
      detailY,
      {
        align: "right",
      }
    );

    detailY += 6;

    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "normal");

    pdf.text(
      "Payment Status",
      detailX,
      detailY
    );

    pdf.setTextColor(16, 185, 129);
    pdf.setFont("helvetica", "bold");

    pdf.text(
      status,
      pageWidth - margin,
      detailY,
      {
        align: "right",
      }
    );

    /*
     * --------------------------------------------------
     * ITEMS TABLE
     * --------------------------------------------------
     */

    y = 88;

    const tableX = margin;

    const colNo = tableX;
    const colProduct = tableX + 10;
    const colSku = tableX + 87;
    const colQty = tableX + 116;
    const colRate = tableX + 137;
    const colAmount =
      pageWidth - margin;

    /*
     * Table header
     */

    pdf.setFillColor(
      15,
      23,
      42
    );

    pdf.roundedRect(
      tableX,
      y,
      contentWidth,
      10,
      2,
      2,
      "F"
    );

    pdf.setTextColor(
      255,
      255,
      255
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(7);

    pdf.text(
      "#",
      colNo + 3,
      y + 6.5
    );

    pdf.text(
      "PRODUCT",
      colProduct,
      y + 6.5
    );

    pdf.text(
      "SKU",
      colSku,
      y + 6.5
    );

    pdf.text(
      "QTY",
      colQty,
      y + 6.5,
      {
        align: "center",
      }
    );

    pdf.text(
      "RATE",
      colRate,
      y + 6.5,
      {
        align: "right",
      }
    );

    pdf.text(
      "AMOUNT",
      colAmount,
      y + 6.5,
      {
        align: "right",
      }
    );

    /*
     * Table rows
     */

    y += 10;

    let subtotal = 0;

    challan.items.forEach(
      (
        item: {
          productName: string;
          sku: string;
          quantity: number;
          unitPrice: number;
        },
        index: number
      ) => {
        const quantity =
          Number(item.quantity);

        const unitPrice =
          Number(item.unitPrice);

        const amount =
          quantity * unitPrice;

        subtotal += amount;

        /*
         * Alternate row background
         */

        if (index % 2 === 0) {
          pdf.setFillColor(
            248,
            250,
            252
          );

          pdf.rect(
            tableX,
            y,
            contentWidth,
            11,
            "F"
          );
        }

        pdf.setTextColor(
          30,
          41,
          59
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8);

        pdf.text(
          String(index + 1),
          colNo + 3,
          y + 7
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          item.productName,
          colProduct,
          y + 7,
          {
            maxWidth: 72,
          }
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setTextColor(
          100,
          116,
          139
        );

        pdf.text(
          item.sku,
          colSku,
          y + 7,
          {
            maxWidth: 27,
          }
        );

        pdf.setTextColor(
          30,
          41,
          59
        );

        pdf.text(
          String(quantity),
          colQty,
          y + 7,
          {
            align: "center",
          }
        );

        pdf.text(
          `Rs. ${unitPrice.toLocaleString(
            "en-IN"
          )}`,
          colRate,
          y + 7,
          {
            align: "right",
          }
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          `Rs. ${amount.toLocaleString(
            "en-IN"
          )}`,
          colAmount,
          y + 7,
          {
            align: "right",
          }
        );

        pdf.setDrawColor(
          226,
          232,
          240
        );

        pdf.line(
          tableX,
          y + 11,
          pageWidth - margin,
          y + 11
        );

        y += 11;
      }
    );

    /*
     * --------------------------------------------------
     * TOTALS
     * --------------------------------------------------
     */

    y += 8;

    const totalsX = 125;
    const totalsValueX =
      pageWidth - margin;

    const gstRate = 18;

    const gstAmount =
      subtotal * (gstRate / 100);

    const grandTotal =
      subtotal + gstAmount;

    pdf.setFontSize(9);

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setTextColor(
      100,
      116,
      139
    );

    pdf.text(
      "Subtotal",
      totalsX,
      y
    );

    pdf.setTextColor(
      15,
      23,
      42
    );

    pdf.text(
      `Rs. ${subtotal.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
        }
      )}`,
      totalsValueX,
      y,
      {
        align: "right",
      }
    );

    y += 7;

    pdf.setTextColor(
      100,
      116,
      139
    );

    pdf.text(
      `GST (${gstRate}%)`,
      totalsX,
      y
    );

    pdf.setTextColor(
      15,
      23,
      42
    );

    pdf.text(
      `Rs. ${gstAmount.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
        }
      )}`,
      totalsValueX,
      y,
      {
        align: "right",
      }
    );

    y += 5;

    pdf.setDrawColor(
      203,
      213,
      225
    );

    pdf.line(
      totalsX,
      y,
      totalsValueX,
      y
    );

    y += 9;

    /*
     * Grand total box
     */

    pdf.setFillColor(
      15,
      23,
      42
    );

    pdf.roundedRect(
      totalsX - 5,
      y - 6,
      contentWidth -
        (totalsX - margin) +
        5,
      16,
      2,
      2,
      "F"
    );

    pdf.setTextColor(
      255,
      255,
      255
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(10);

    pdf.text(
      "GRAND TOTAL",
      totalsX,
      y + 4
    );

    pdf.setFontSize(12);

    pdf.text(
      `Rs. ${grandTotal.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
        }
      )}`,
      totalsValueX,
      y + 4,
      {
        align: "right",
      }
    );

    /*
     * --------------------------------------------------
     * NOTES
     * --------------------------------------------------
     */

    y += 30;

    pdf.setTextColor(
      71,
      85,
      105
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(8);

    pdf.text(
      "NOTES",
      margin,
      y
    );

    y += 5;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setTextColor(
      100,
      116,
      139
    );

    pdf.setFontSize(7.5);

    pdf.text(
      "This invoice is generated from the NexaCore Solutions",
      margin,
      y
    );

    y += 4;

    pdf.text(
      "Sales & Inventory Management System.",
      margin,
      y
    );

    y += 4;

    pdf.text(
      "Please retain this invoice for your records.",
      margin,
      y
    );

    /*
     * --------------------------------------------------
     * SIGNATURE
     * --------------------------------------------------
     */

    const signatureX =
      pageWidth - margin - 55;

    pdf.setDrawColor(
      148,
      163,
      184
    );

    pdf.line(
      signatureX,
      y + 12,
      pageWidth - margin,
      y + 12
    );

    pdf.setTextColor(
      71,
      85,
      105
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(7.5);

    pdf.text(
      "Authorized Signatory",
      signatureX,
      y + 17
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      companyName,
      signatureX,
      y + 22
    );

    /*
     * --------------------------------------------------
     * FOOTER
     * --------------------------------------------------
     */

    pdf.setDrawColor(
      226,
      232,
      240
    );

    pdf.line(
      margin,
      280,
      pageWidth - margin,
      280
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(7);

    pdf.setTextColor(
      148,
      163,
      184
    );

    pdf.text(
      "Thank you for doing business with us.",
      margin,
      287
    );

    pdf.text(
      `${companyName} • ${companyAddress}`,
      pageWidth - margin,
      287,
      {
        align: "right",
      }
    );

    /*
     * --------------------------------------------------
     * SAVE
     * --------------------------------------------------
     */

    pdf.save(
      `${challan.challanNumber}-invoice.pdf`
    );

    toast.success(
      "Professional invoice generated"
    );
  } catch (error) {
    console.error(error);

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to generate invoice"
    );
  }
};
  const createChallan = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!customerId) {
      toast.error("Select a customer");
      return;
    }

    if (
      items.some(
        (item) =>
          !item.productId ||
          Number(item.quantity) <= 0
      )
    ) {
      toast.error(
        "Select products and enter valid quantities"
      );
      return;
    }

    const hasInsufficientStock = items.some(
      (item) => {
        const product = getProduct(item.productId);

        return (
          product &&
          Number(item.quantity) >
            product.currentStock
        );
      }
    );

    if (hasInsufficientStock) {
      toast.error(
        "One or more products have insufficient stock"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/challans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerId,
            items,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create challan"
        );
      }

      toast.success(
        "Challan created successfully"
      );

      setCustomerId("");

      setItems([
        {
          productId: "",
          quantity: 1,
        },
      ]);

      await loadData();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create challan"
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmChallan = async (id: string) => {
    try {
      setActionId(id);

      const response = await fetch(
        `${API_URL}/challans/${id}/confirm`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to confirm challan"
        );
      }

      toast.success(
        "Challan confirmed. Stock deducted."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to confirm challan"
      );
    } finally {
      setActionId(null);
    }
  };

  const cancelChallan = async (id: string) => {
    try {
      setActionId(id);

      const response = await fetch(
        `${API_URL}/challans/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to cancel challan"
        );
      }

      toast.success("Challan cancelled");

      await loadData();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel challan"
      );
    } finally {
      setActionId(null);
    }
  };

  const getStatusStyle = (
    status: Challan["status"]
  ) => {
    switch (status) {
      case "CONFIRMED":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "CANCELLED":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-amber-300/20 bg-amber-300/10 text-amber-200";
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
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
              <div className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]" />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Sales Operations
              </span>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Sales Challans
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Create, review and confirm outbound
              sales challans while keeping
              inventory synchronized.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                Total Challans
              </p>

              <p className="mt-1 text-xl font-semibold">
                {challans.length}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] px-5 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                Confirmed
              </p>

              <p className="mt-1 text-xl font-semibold text-amber-200">
                {
                  challans.filter(
                    (challan) =>
                      challan.status ===
                      "CONFIRMED"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Create Challan */}
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
        className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl shadow-black/20"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/70">
              New transaction
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Create Challan
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShoppingBag size={14} />
            Draft mode
          </div>
        </div>

        <form
          onSubmit={createChallan}
          className="p-6"
        >
          {/* Customer */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
              Customer
            </label>

            <div className="relative">
              <UserRound
                size={17}
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

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name} —{" "}
                    {customer.businessName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product rows */}
          <div className="space-y-3">
            <div className="hidden grid-cols-[1fr_140px_48px] gap-3 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600 md:grid">
              <span>Product</span>
              <span>Quantity</span>
              <span />
            </div>

            {items.map((item, index) => {
              const product = getProduct(
                item.productId
              );

              const insufficientStock =
                product !== undefined &&
                Number(item.quantity) >
                  product.currentStock;

              return (
                <motion.div
                  key={`${index}-${item.productId}`}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="grid gap-3 md:grid-cols-[1fr_140px_48px]"
                >
                  <div>
                    <select
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "productId",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3.5 text-sm text-white outline-none transition focus:border-amber-300/40"
                      required
                    >
                      <option value="">
                        Select product
                      </option>

                      {products.map(
                        (product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name} —{" "}
                            {product.sku} — Stock:{" "}
                            {product.currentStock}
                          </option>
                        )
                      )}
                    </select>

                    {product && (
                      <div className="mt-2 flex items-center justify-between px-1 text-[11px]">
                        <span className="text-neutral-600">
                          SKU: {product.sku}
                        </span>

                        <span
                          className={
                            insufficientStock
                              ? "text-red-400"
                              : "text-neutral-500"
                          }
                        >
                          Available:{" "}
                          {product.currentStock}
                        </span>
                      </div>
                    )}
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(
                        index,
                        "quantity",
                        event.target.value
                      )
                    }
                    className={`rounded-xl border bg-[#080808] px-4 py-3.5 text-sm text-white outline-none transition ${
                      insufficientStock
                        ? "border-red-400/40"
                        : "border-white/10 focus:border-amber-300/40"
                    }`}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeItem(index)
                    }
                    disabled={
                      items.length === 1
                    }
                    className="flex h-[50px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-neutral-600 transition hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <X size={17} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Add product */}
          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-neutral-500 transition hover:border-amber-300/30 hover:bg-amber-300/[0.025] hover:text-amber-200"
          >
            <Plus size={16} />
            Add another product
          </button>

          {/* Summary */}
          <div className="mt-7 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-3">
            <SummaryCard
              label="Line Items"
              value={String(items.length)}
            />

            <SummaryCard
              label="Total Quantity"
              value={String(totalItems)}
            />

            <SummaryCard
              label="Estimated Value"
              value={`₹${estimatedValue.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}`}
              accent
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 py-3.5 text-sm font-bold text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating challan..."
              : "Create Challan"}

            {!loading && (
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </button>
        </form>
      </motion.section>

      {/* History */}
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
        className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl shadow-black/20"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
              Activity
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Challan History
            </h2>
          </div>

          <Package
            size={19}
            className="text-neutral-700"
          />
        </div>

        <div className="overflow-x-auto">
          {pageLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-white/[0.035]"
                />
              ))}
            </div>
          ) : challans.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025]">
                <ClipboardList
                  size={22}
                  className="text-neutral-600"
                />
              </div>

              <h3 className="mt-4 font-semibold">
                No challans yet
              </h3>

              <p className="mt-1 text-sm text-neutral-600">
                Create your first sales challan
                above.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Challan
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">
                    Items
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
                {challans.map(
                  (challan, index) => (
                    <motion.tr
                      key={challan.id}
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        delay: index * 0.035,
                      }}
                      className="border-b border-white/[0.045] transition hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
                            <ClipboardList
                              size={16}
                            />
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {
                                challan.challanNumber
                              }
                            </p>

                            <p className="mt-0.5 text-[11px] text-neutral-600">
                              Sales document
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-medium text-neutral-200">
                          {
                            challan.customer
                              .name
                          }
                        </p>

                        <p className="mt-1 text-xs text-neutral-600">
                          {
                            challan.customer
                              .businessName
                          }
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-white">
                            {
                              challan.totalQuantity
                            }
                          </span>

                          <span className="text-xs text-neutral-600">
                            units
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusStyle(
                            challan.status
                          )}`}
                        >
                          {challan.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
  <div className="flex justify-end gap-2">
    {challan.status === "DRAFT" && (
      <>
        <button
          onClick={() =>
            confirmChallan(challan.id)
          }
          disabled={
            actionId === challan.id
          }
          className="flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50"
        >
          <Check size={14} />

          {actionId === challan.id
            ? "..."
            : "Confirm"}
        </button>

        <button
          onClick={() =>
            cancelChallan(challan.id)
          }
          disabled={
            actionId === challan.id
          }
          className="flex items-center gap-1.5 rounded-lg border border-red-400/15 bg-red-400/5 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
        >
          <X size={14} />

          Cancel
        </button>
      </>
    )}

    {challan.status === "CONFIRMED" && (
      <button
        onClick={() =>
          void downloadInvoice(challan.id)
        }
        className="flex items-center gap-1.5 rounded-lg border border-amber-300/15 bg-amber-300/5 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-300/10"
      >
        <ClipboardList size={14} />

        Invoice PDF
      </button>
    )}

    {challan.status === "CANCELLED" && (
      <span className="text-xs text-neutral-700">
        No actions
      </span>
    )}
  </div>
</td>
                    </motion.tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </motion.section>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function SummaryCard({
  label,
  value,
  accent = false,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        accent
          ? "border-amber-300/10 bg-amber-300/[0.035]"
          : "border-white/[0.07] bg-white/[0.02]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-semibold ${
          accent
            ? "text-amber-200"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}