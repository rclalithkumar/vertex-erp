import { Router } from "express";

import {
  createFollowUp,
  getCustomerFollowUps,
  updateFollowUp,
  deleteFollowUp,
} from "../controllers/followup.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * Customer Follow-Ups
 *
 * GET
 * /api/customers/:id/followups
 */
router.get(
  "/customers/:id/followups",
  authorize("ADMIN", "SALES", "ACCOUNTS"),
  getCustomerFollowUps
);

/**
 * POST
 * /api/customers/:id/followups
 */
router.post(
  "/customers/:id/followups",
  authorize("ADMIN", "SALES"),
  createFollowUp
);

/**
 * PUT
 * /api/followups/:followUpId
 */
router.put(
  "/followups/:followUpId",
  authorize("ADMIN", "SALES"),
  updateFollowUp
);

/**
 * DELETE
 * /api/followups/:followUpId
 */
router.delete(
  "/followups/:followUpId",
  authorize("ADMIN"),
  deleteFollowUp
);

export default router;