import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import customerRoutes from "./routes/customer.routes.js";
import followUpRoutes from "./routes/followup.routes.js";
import productRoutes from "./routes/product.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import challanRoutes from "./routes/challan.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Mini ERP CRM API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/customers", customerRoutes);
app.use("/api", followUpRoutes);
app.use("/api/products", productRoutes);
app.use("/api", stockRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(errorHandler);

export default app;