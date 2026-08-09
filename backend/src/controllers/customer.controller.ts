import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../utils/prisma.js";

export const createCustomer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (!name || !mobile || !businessName || !customerType || !address) {
      return res.status(400).json({
        success: false,
        message:
          "Name, mobile, business name, customer type and address are required",
      });
    }

    const customerData = {
      name,
      mobile,
      businessName,
      customerType,
      address,
      ...(email !== undefined && { email }),
      ...(gstNumber !== undefined && { gstNumber }),
      ...(status !== undefined && { status }),
      ...(followUpDate !== undefined && {
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      }),
      ...(notes !== undefined && { notes }),
      ...(req.user?.userId && {
        createdById: req.user.userId,
      }),
    };

    const customer = await prisma.customer.create({
      data: customerData,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

export const getCustomers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const customers = await prisma.customer.findMany({
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
                  mobile: {
                    contains: search,
                  },
                },
                {
                  businessName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),

        ...(status
          ? {
              status: status as any,
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

export const getCustomerById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: {
            followUpAt: "desc",
          },
        },
        challans: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(mobile !== undefined && { mobile }),
        ...(email !== undefined && { email }),
        ...(businessName !== undefined && { businessName }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(customerType !== undefined && { customerType }),
        ...(address !== undefined && { address }),
        ...(status !== undefined && { status }),
        ...(followUpDate !== undefined && {
          followUpDate: followUpDate
            ? new Date(followUpDate)
            : null,
        }),
        ...(notes !== undefined && { notes }),
      },
    });

    return res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

export const deleteCustomer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await prisma.customer.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};