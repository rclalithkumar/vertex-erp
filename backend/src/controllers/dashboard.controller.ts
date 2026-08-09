import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../utils/prisma.js";

export const getDashboardStats = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const [
      totalCustomers,
      totalProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      cancelledChallans,
      lowStockProducts,
      pendingFollowUps,
      stockResult,
    ] = await Promise.all([
      prisma.customer.count(),

      prisma.product.count(),

      prisma.challan.count(),

      prisma.challan.count({
        where: {
          status: "CONFIRMED",
        },
      }),

      prisma.challan.count({
        where: {
          status: "DRAFT",
        },
      }),

      prisma.challan.count({
        where: {
          status: "CANCELLED",
        },
      }),

      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "Product"
        WHERE "currentStock" <= "minimumStock"
      `,

      prisma.followUp.count(),

      prisma.product.aggregate({
        _sum: {
          currentStock: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        customers: totalCustomers,
        products: totalProducts,

        challans: {
          total: totalChallans,
          confirmed: confirmedChallans,
          draft: draftChallans,
          cancelled: cancelledChallans,
        },

        inventory: {
          totalUnits: stockResult._sum.currentStock ?? 0,
          lowStockProducts: Number(
            lowStockProducts[0]?.count ?? 0
          ),
        },

        followUps: pendingFollowUps,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

export const getRecentChallans = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const challans = await prisma.challan.findMany({
      take: 10,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },

        items: {
          select: {
            quantity: true,
            productName: true,
            sku: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: challans,
    });
  } catch (error) {
    console.error("Recent challans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent challans",
    });
  }
};

export const getDashboardLowStock = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const products = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        currentStock: number;
        minimumStock: number;
        warehouse: string;
      }>
    >`
      SELECT
        "id",
        "name",
        "sku",
        "currentStock",
        "minimumStock",
        "warehouse"
      FROM "Product"
      WHERE "currentStock" <= "minimumStock"
      ORDER BY "currentStock" ASC
      LIMIT 10
    `;

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Dashboard low stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch low-stock products",
    });
  }
};