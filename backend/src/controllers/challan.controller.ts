import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../utils/prisma.js";

const generateChallanNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);

  return `CH-${timestamp}-${random}`;
};

/**
 * Create a new challan
 * Creates the challan as DRAFT.
 * Stock is NOT deducted until confirmation.
 */
export const createChallan = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { customerId, items } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: String(customerId),
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
     * Validate every item before touching the database.
     */
    for (const item of items) {
      if (!item?.productId) {
        return res.status(400).json({
          success: false,
          message: "Every challan item must have a product",
        });
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product quantity must be a positive whole number",
        });
      }
    }

    /*
     * Prevent duplicate products inside one challan.
     *
     * Example:
     * Product A -> 5
     * Product A -> 10
     *
     * becomes invalid instead of creating confusing
     * stock calculations.
     */
    const productIdList = items.map((item) =>
      String(item.productId)
    );

    const uniqueProductIds = new Set(productIdList);

    if (
      uniqueProductIds.size !== productIdList.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A product can only appear once in a challan",
      });
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: [...uniqueProductIds],
        },
      },
    });

    if (products.length !== uniqueProductIds.size) {
      return res.status(404).json({
        success: false,
        message: "One or more products were not found",
      });
    }

    /*
     * Create product snapshots.
     *
     * Even if the product name, SKU or price changes later,
     * the challan retains the original values.
     */
    const challanItems = items.map(
      (item: {
        productId: string;
        quantity: number;
      }) => {
        const product = products.find(
          (p) => p.id === String(item.productId)
        );

        if (!product) {
          throw new Error("Product not found");
        }

        return {
          productId: product.id,
          quantity: Number(item.quantity),
          productName: product.name,
          sku: product.sku,
          unitPrice: product.unitPrice,
        };
      }
    );

    const totalQuantity = challanItems.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const challan = await prisma.challan.create({
      data: {
        challanNumber: generateChallanNumber(),

        customerId: String(customerId),

        totalQuantity,

        status: "DRAFT",

        ...(req.user?.userId && {
          createdById: req.user.userId,
        }),

        items: {
          create: challanItems,
        },
      },

      include: {
        customer: true,

        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Challan created successfully",
      data: challan,
    });
  } catch (error) {
    console.error("Create challan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create challan",
    });
  }
};

/**
 * Get challans
 */
export const getChallans = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const challans =
      await prisma.challan.findMany({
        where: {
          ...(status
            ? {
                status: status as any,
              }
            : {}),

          ...(search
            ? {
                OR: [
                  {
                    challanNumber: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    customer: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                  {
                    customer: {
                      businessName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
            },
          },

          items: {
            select: {
              id: true,
              quantity: true,
              productName: true,
              sku: true,
              unitPrice: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.json({
      success: true,
      count: challans.length,
      data: challans,
    });
  } catch (error) {
    console.error("Get challans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch challans",
    });
  }
};

/**
 * Get one challan
 */
export const getChallanById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const challan =
      await prisma.challan.findUnique({
        where: {
          id,
        },

        include: {
          customer: true,

          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },

          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    return res.json({
      success: true,
      data: challan,
    });
  } catch (error) {
    console.error("Get challan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch challan",
    });
  }
};

/**
 * Confirm challan
 *
 * IMPORTANT BUSINESS LOGIC:
 *
 * Draft
 *   ↓
 * Confirm
 *   ↓
 * Check stock
 *   ↓
 * Deduct stock
 *   ↓
 * Create OUT movement
 *   ↓
 * Mark challan CONFIRMED
 *
 * Everything happens inside one transaction.
 */
export const confirmChallan = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const challan =
      await prisma.challan.findUnique({
        where: {
          id,
        },

        include: {
          items: true,
        },
      });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    if (challan.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: `Challan cannot be confirmed because it is already ${challan.status}`,
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * First verify that every product has enough stock.
         */
        for (const item of challan.items) {
          const product =
            await tx.product.findUnique({
              where: {
                id: item.productId,
              },
            });

          if (!product) {
            throw new Error(
              `Product ${item.productName} no longer exists`
            );
          }

          if (
            product.currentStock < item.quantity
          ) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Required: ${item.quantity}`
            );
          }
        }

        /*
         * Deduct stock atomically.
         *
         * The WHERE condition ensures the database
         * refuses the update if stock is no longer enough.
         */
        for (const item of challan.items) {
          const updatedProduct =
            await tx.product.updateMany({
              where: {
                id: item.productId,
                currentStock: {
                  gte: item.quantity,
                },
              },

              data: {
                currentStock: {
                  decrement: item.quantity,
                },
              },
            });

          if (updatedProduct.count !== 1) {
            throw new Error(
              `Insufficient stock for ${item.productName}`
            );
          }

          /*
           * Record stock movement.
           */
          await tx.stockMovement.create({
            data: {
              quantity: item.quantity,
              type: "OUT",
              reason: `Sales Challan ${challan.challanNumber}`,
              productId: item.productId,

              ...(req.user?.userId && {
                createdById: req.user.userId,
              }),
            },
          });
        }

        /*
         * Finally mark challan as confirmed.
         */
        return tx.challan.update({
          where: {
            id,
          },

          data: {
            status: "CONFIRMED",
          },

          include: {
            customer: true,

            items: {
              include: {
                product: true,
              },
            },
          },
        });
      }
    );

    return res.json({
      success: true,
      message:
        "Challan confirmed and stock deducted successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Confirm challan error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to confirm challan",
    });
  }
};

/**
 * Cancel draft challan
 *
 * Cancelling a draft does NOT affect stock
 * because stock is only deducted during confirmation.
 */
export const cancelChallan = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const challan =
      await prisma.challan.findUnique({
        where: {
          id,
        },
      });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: "Challan not found",
      });
    }

    if (challan.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          "Only draft challans can be cancelled",
      });
    }

    const updatedChallan =
      await prisma.challan.update({
        where: {
          id,
        },

        data: {
          status: "CANCELLED",
        },
      });

    return res.json({
      success: true,
      message: "Challan cancelled successfully",
      data: updatedChallan,
    });
  } catch (error) {
    console.error(
      "Cancel challan error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to cancel challan",
    });
  }
};