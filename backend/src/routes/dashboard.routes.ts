import { Router } from "express";

import {
  getDashboardStats,
  getRecentChallans,
  getDashboardLowStock,
} from "../controllers/dashboard.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/stats",
  authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getDashboardStats
);

router.get(
  "/recent-challans",
  authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getRecentChallans
);

router.get(
  "/low-stock",
  authorize("ADMIN", "SALES", "WAREHOUSE"),
  getDashboardLowStock
);

export default router;