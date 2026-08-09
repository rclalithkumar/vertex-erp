import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../utils/prisma.js";

/**
 * Create a follow-up for a customer
 */
export const createFollowUp = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerId = String(req.params.id);

    const { note, followUpAt } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Follow-up note is required",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const followUp = await prisma.followUp.create({
      data: {
        note: note.trim(),

        followUpAt: followUpAt
          ? new Date(followUpAt)
          : new Date(),

        customerId,

        ...(req.user?.userId && {
          createdById: req.user.userId,
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Follow-up added successfully",
      data: followUp,
    });
  } catch (error) {
    console.error("Create follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create follow-up",
    });
  }
};

/**
 * Get all follow-ups for a customer
 */
export const getCustomerFollowUps = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerId = String(req.params.id);

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const followUps = await prisma.followUp.findMany({
      where: {
        customerId,
      },
      orderBy: {
        followUpAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      count: followUps.length,
      data: followUps,
    });
  } catch (error) {
    console.error("Get follow-ups error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch follow-ups",
    });
  }
};

/**
 * Update a follow-up
 */
export const updateFollowUp = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const followUpId = String(req.params.followUpId);

    const { note, followUpAt, status } = req.body;

    const existingFollowUp =
      await prisma.followUp.findUnique({
        where: {
          id: followUpId,
        },
      });

    if (!existingFollowUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    const followUp = await prisma.followUp.update({
      where: {
        id: followUpId,
      },
      data: {
        ...(note !== undefined && {
          note: note.trim(),
        }),

        ...(followUpAt !== undefined && {
          followUpAt: followUpAt
            ? new Date(followUpAt)
            : new Date(),
        }),

        ...(status !== undefined && {
          status,
        }),
      },
    });

    return res.json({
      success: true,
      message: "Follow-up updated successfully",
      data: followUp,
    });
  } catch (error) {
    console.error("Update follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update follow-up",
    });
  }
};

/**
 * Delete a follow-up
 */
export const deleteFollowUp = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const followUpId = String(req.params.followUpId);

    const existingFollowUp =
      await prisma.followUp.findUnique({
        where: {
          id: followUpId,
        },
      });

    if (!existingFollowUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    await prisma.followUp.delete({
      where: {
        id: followUpId,
      },
    });

    return res.json({
      success: true,
      message: "Follow-up deleted successfully",
    });
  } catch (error) {
    console.error("Delete follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete follow-up",
    });
  }
};