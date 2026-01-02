import { createPubSub } from "@arcle/events/pubsub";
import { createRedisClient } from "@arcle/events/redis";
import { createLogger } from "@arcle/logger";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { Hono } from "hono";
import { db } from "./db";
import { type AuthType, auth } from "./lib/auth.ts";
import { registrationGuard } from "./middleware/registration.ts";
import { sessionMiddleware } from "./middleware/session.ts";
import { healthRoutes } from "./routes/health.ts";

const log = createLogger({ name: "auth" });

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  log.info("Database migrations applied");
} catch {
  log.info("Database already up to date");
}

const REDIS_URL = Bun.env.REDIS_URL || "redis://localhost:6379";

createRedisClient(REDIS_URL);
createPubSub(REDIS_URL);

const app = new Hono<{ Variables: AuthType }>()
  .use("*", sessionMiddleware)
  .route("/health", healthRoutes)
  .use("/api/auth/*", registrationGuard)
  .on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const port = Number(Bun.env.AUTH_PORT) || 4000;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

log.success(`Listening on port ${server.port}`);
