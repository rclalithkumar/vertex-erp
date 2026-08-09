import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../utils/prisma.js";

export const createProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      name,
      sku,
      category,
      unitPrice,
      minimumStock,
      warehouse,
    } = req.body;

    if (
      !name ||
      !sku ||
      !category ||
      unitPrice === undefined ||
      !warehouse
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, SKU, category, unit price and warehouse are required",
      });
    }

    const parsedUnitPrice = Number(unitPrice);
    const parsedMinimumStock =
      minimumStock === undefined || minimumStock === ""
        ? 0
        : Number(minimumStock);

    if (
      !Number.isFinite(parsedUnitPrice) ||
      parsedUnitPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Unit price must be a valid positive number",
      });
    }

    if (
      !Number.isFinite(parsedMinimumStock) ||
      parsedMinimumStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock must be a valid non-negative number",
      });
    }

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          sku: sku.trim(),
        },
      });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        unitPrice: parsedUnitPrice,
        minimumStock: parsedMinimumStock,
        warehouse: warehouse.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

export const getProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const category =
      typeof req.query.category === "string"
        ? req.query.category
        : undefined;

    const products = await prisma.product.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  sku: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),

        ...(category
          ? {
              category: {
                equals: category,
                mode: "insensitive",
              },
            }
          : {}),
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const product = await prisma.product.findUnique({
      where: {
        id,
      },

      include: {
        stockMovements: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id,
        },
      });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name,
      sku,
      category,
      unitPrice,
      minimumStock,
      warehouse,
    } = req.body;

    /*
     * -----------------------------------------
     * Validate SKU
     * -----------------------------------------
     */

    const cleanedSku =
      sku !== undefined
        ? String(sku).trim()
        : existingProduct.sku;

    if (
      cleanedSku !== existingProduct.sku
    ) {
      const duplicateSku =
        await prisma.product.findUnique({
          where: {
            sku: cleanedSku,
          },
        });

      if (duplicateSku) {
        return res.status(409).json({
          success: false,
          message:
            "A product with this SKU already exists",
        });
      }
    }

    /*
     * -----------------------------------------
     * Validate unit price
     * -----------------------------------------
     */

    let parsedUnitPrice:
      | number
      | undefined;

    if (unitPrice !== undefined) {
      parsedUnitPrice = Number(unitPrice);

      if (
        !Number.isFinite(parsedUnitPrice) ||
        parsedUnitPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Unit price must be a valid non-negative number",
        });
      }
    }

    /*
     * -----------------------------------------
     * Validate minimum stock
     * -----------------------------------------
     *
     * IMPORTANT:
     * Do NOT use `minimumStock || existingProduct.minimumStock`
     * because 0 is a valid value.
     */

    let parsedMinimumStock:
      | number
      | undefined;

    if (
      minimumStock !== undefined &&
      minimumStock !== ""
    ) {
      parsedMinimumStock = Number(minimumStock);

      if (
        !Number.isFinite(parsedMinimumStock) ||
        parsedMinimumStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum stock must be a valid non-negative number",
        });
      }
    }

    /*
     * -----------------------------------------
     * Update product
     * -----------------------------------------
     */

    const product = await prisma.product.update({
      where: {
        id,
      },

      data: {
        ...(name !== undefined && {
          name: String(name).trim(),
        }),

        ...(sku !== undefined && {
          sku: cleanedSku,
        }),

        ...(category !== undefined && {
          category: String(category).trim(),
        }),

        ...(parsedUnitPrice !== undefined && {
          unitPrice: parsedUnitPrice,
        }),

        ...(parsedMinimumStock !== undefined && {
          minimumStock: parsedMinimumStock,
        }),

        ...(warehouse !== undefined && {
          warehouse: String(warehouse).trim(),
        }),
      },
    });

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id,
        },
      });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const movementCount =
      await prisma.stockMovement.count({
        where: {
          productId: id,
        },
      });

    if (movementCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Product cannot be deleted because it has stock movement history",
      });
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};