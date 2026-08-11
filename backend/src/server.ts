import app from "./app.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`
🚀 VertexERP CRM API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server running on port: ${env.PORT}
Health: /api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();