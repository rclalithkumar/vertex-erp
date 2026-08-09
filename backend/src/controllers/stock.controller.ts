import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../utils/prisma.js";

export const createStockMovement = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const productId = String(req.params.productId);

    const {
      quantity,
      type,
      reason,
    } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    if (type !== "IN" && type !== "OUT") {
      return res.status(400).json({
        success: false,
        message: "Movement type must be IN or OUT",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (type === "OUT" && quantity > product.currentStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available stock: ${product.currentStock}`,
      });
    }

    const newStock =
      type === "IN"
        ? product.currentStock + quantity
        : product.currentStock - quantity;

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          quantity,
          type,
          reason,
          productId,
          ...(req.user?.userId && {
            createdById: req.user.userId,
          }),
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: newStock,
        },
      });

      return {
        movement,
        product: updatedProduct,
      };
    });

    return res.status(201).json({
      success: true,
      message: `Stock ${type === "IN" ? "added" : "removed"} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Stock movement error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update stock",
    });
  }
};

export const getStockMovements = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const productId =
      typeof req.query.productId === "string"
        ? req.query.productId
        : undefined;

    const movements = await prisma.stockMovement.findMany({
      where: {
        ...(productId && { productId }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: movements.length,
      data: movements,
    });
  } catch (error) {
    console.error("Get stock movements error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock movements",
    });
  }
};

export const getLowStockProducts = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        currentStock: {
          lte: prisma.product.fields.minimumStock,
        },
      },
      orderBy: {
        currentStock: "asc",
      },
    });

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Low stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch low-stock products",
    });
  }
};