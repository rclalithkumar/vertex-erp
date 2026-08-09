import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("ADMIN", "SALES"),
  createCustomer
);

router.get(
  "/",
  authorize("ADMIN", "SALES", "ACCOUNTS"),
  getCustomers
);

router.get(
  "/:id",
  authorize("ADMIN", "SALES", "ACCOUNTS"),
  getCustomerById
);

router.put(
  "/:id",
  authorize("ADMIN", "SALES"),
  updateCustomer
);

router.delete(
  "/:id",
  authorize("ADMIN"),
  deleteCustomer
);

export default router;