import { Router } from "express";

import {
  createChallan,
  getChallans,
  getChallanById,
  confirmChallan,
  cancelChallan,
} from "../controllers/challan.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

/*
 * Create draft challan
 */
router.post(
  "/",
  authorize("ADMIN", "SALES"),
  createChallan
);

/*
 * List challans
 */
router.get(
  "/",
  authorize(
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "ACCOUNTS"
  ),
  getChallans
);

/*
 * Get challan details
 */
router.get(
  "/:id",
  authorize(
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "ACCOUNTS"
  ),
  getChallanById
);

/*
 * Confirm challan
 * Deducts stock.
 */
router.patch(
  "/:id/confirm",
  authorize("ADMIN", "SALES"),
  confirmChallan
);

/*
 * Cancel draft challan
 */
router.patch(
  "/:id/cancel",
  authorize("ADMIN", "SALES"),
  cancelChallan
);

export default router;