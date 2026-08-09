import app from "./app.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    app.listen(env.PORT, () => {
      console.log(`
🚀 Mini ERP CRM API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server: http://localhost:${env.PORT}
Health: http://localhost:${env.PORT}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();