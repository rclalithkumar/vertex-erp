import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("ADMIN", "WAREHOUSE"),
  createProduct
);

router.get(
  "/",
  authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getProducts
);

router.get(
  "/:id",
  authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getProductById
);

router.put(
  "/:id",
  authorize("ADMIN", "WAREHOUSE"),
  updateProduct
);

router.delete(
  "/:id",
  authorize("ADMIN"),
  deleteProduct
);

export default router;