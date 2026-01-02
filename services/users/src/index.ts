import { authMiddleware } from "@arcle/auth-server";
import { createPubSub } from "@arcle/events/pubsub";
import { createLogger } from "@arcle/logger";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { Hono } from "hono";
import { db } from "./db";
import { healthRoutes } from "./routes/health.ts";
import { libraryRoutes } from "./routes/library.ts";
import { settingsRoutes } from "./routes/settings.ts";

const log = createLogger({ name: "users" });

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  log.info("Database migrations applied");
} catch {
  log.info("Database already up to date");
}

const REDIS_URL = Bun.env.REDIS_URL || "redis://localhost:6379";

createPubSub(REDIS_URL);

const AUTH_JWKS_URL =
  Bun.env.AUTH_JWKS_URL || "http://localhost:4000/api/auth/jwks";

const app = new Hono()
  .use(
    "/library/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: false,
    }),
  )
  .use(
    "/settings/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: false,
    }),
  )
  .route("/health", healthRoutes)
  .route("/library", libraryRoutes)
  .route("/settings", settingsRoutes);

const port = Number(Bun.env.USERS_PORT) || 5000;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

log.success(`Listening on port ${server.port}`);
