import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { existsSync } from "fs";
import { config } from "./config";
import { initDatabase } from "./db/database";
import { runMigrations } from "./db/schema";
import { seedInitialAdmin } from "./db/seed";
import { startCronJobs } from "./cron/scheduler";

import { authRoutes } from "./routes/auth.routes";
import { accountsRoutes } from "./routes/accounts.routes";
import { depositsRoutes } from "./routes/deposits.routes";
import { serversRoutes } from "./routes/servers.routes";
import { resellerRoutes } from "./routes/reseller.routes";
import { adminRoutes } from "./routes/admin.routes";
import { notificationsRoutes } from "./routes/notifications.routes";
import { webhooksRoutes } from "./routes/webhooks.routes";

initDatabase();
runMigrations();
seedInitialAdmin();

if (process.env.NODE_ENV !== "test") {
  startCronJobs();
}

export const app = new Elysia()
  .use(cors())
  .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(accountsRoutes)
  .use(depositsRoutes)
  .use(serversRoutes)
  .use(resellerRoutes)
  .use(adminRoutes)
  .use(notificationsRoutes)
  .use(webhooksRoutes)
  .use(
    staticPlugin({
      assets: "./web/dist",
      prefix: ""
    })
  )
  .get("*", ({ path }) => {
    const assetPath = `./web/dist${path}`;
    if (path !== "/" && existsSync(assetPath)) {
      return Bun.file(assetPath);
    }
    return Bun.file("./web/dist/index.html");
  });

if (import.meta.main) {
  app.listen(config.PORT);
  console.log(`🦊 VPN Web Dashboard active at http://localhost:${config.PORT}`);
}
