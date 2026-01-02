import { authMiddleware } from "@arcle/auth-server";
import { createPubSub } from "@arcle/events/pubsub";
import { createRedisClient } from "@arcle/events/redis";
import { createLogger } from "@arcle/logger";
import { initQueueConnection } from "@arcle/queue";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { Hono } from "hono";
import { db } from "./db";
import { setupSubscribers } from "./events/subscribers.ts";
import { setupSearchSyncSubscribers } from "./lib/search-sync.ts";
import { adminRoutes } from "./routes/admin.ts";
import { chaptersRoutes } from "./routes/chapters.ts";
import { genresRoutes } from "./routes/genres.ts";
import { healthRoutes } from "./routes/health.ts";
import { pagesRoutes } from "./routes/pages.ts";
import { searchRoutes } from "./routes/search.ts";
import { seriesRoutes } from "./routes/series.ts";
import { settingsRoutes } from "./routes/settings.ts";
import { statsRoutes } from "./routes/stats.ts";

const log = createLogger({ name: "catalog" });

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  log.info("Database migrations applied");
} catch {
  log.info("Database already up to date");
}

const REDIS_URL = Bun.env.REDIS_URL || "redis://localhost:6379";

createRedisClient(REDIS_URL);
createPubSub(REDIS_URL);
initQueueConnection(REDIS_URL);
setupSubscribers();
setupSearchSyncSubscribers();

const AUTH_JWKS_URL =
  Bun.env.AUTH_JWKS_URL || "http://localhost:4000/api/auth/jwks";

const app = new Hono()
  .use(
    "/series/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/chapters/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/pages/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/settings",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/settings/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/stats/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
    }),
  )
  .use(
    "/genres/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/genres",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/admin/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
    }),
  )
  .route("/health", healthRoutes)
  .route("/search", searchRoutes)
  .route("/series", seriesRoutes)
  .route("/chapters", chaptersRoutes)
  .route("/pages", pagesRoutes)
  .route("/genres", genresRoutes)
  .route("/settings", settingsRoutes)
  .route("/stats", statsRoutes)
  .route("/admin", adminRoutes);

const port = Number(Bun.env.CATALOG_PORT) || 6000;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

log.success(`Listening on port ${server.port}`);
