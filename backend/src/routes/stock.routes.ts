import { Router } from "express";
import {
  createStockMovement,
  getStockMovements,
  getLowStockProducts,
} from "../controllers/stock.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/products/:productId/movements",
  authorize("ADMIN", "WAREHOUSE"),
  createStockMovement
);

router.get(
  "/stock-movements",
  authorize("ADMIN", "WAREHOUSE", "ACCOUNTS"),
  getStockMovements
);

router.get(
  "/stock/low",
  authorize("ADMIN", "WAREHOUSE", "SALES"),
  getLowStockProducts
);

export default router;