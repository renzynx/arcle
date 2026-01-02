import { authMiddleware } from "@arcle/auth-server";
import { createPubSub } from "@arcle/events/pubsub";
import { createRedisClient } from "@arcle/events/redis";
import { createLogger } from "@arcle/logger";
import { Hono } from "hono";
import { setupSubscribers } from "./events/subscribers.ts";
import { healthRoutes } from "./routes/health.ts";
import { imagesRoutes } from "./routes/images.ts";
import { statsRoutes } from "./routes/stats.ts";

const log = createLogger({ name: "media" });

const REDIS_URL = Bun.env.REDIS_URL || "redis://localhost:6379";

createRedisClient(REDIS_URL);
createPubSub(REDIS_URL);
setupSubscribers();

const AUTH_JWKS_URL =
  Bun.env.AUTH_JWKS_URL || "http://localhost:4000/api/auth/jwks";

const app = new Hono()
  .use(
    "/images/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: true,
    }),
  )
  .use(
    "/stats/*",
    authMiddleware({
      jwksUrl: AUTH_JWKS_URL,
      optional: false,
    }),
  )
  .route("/health", healthRoutes)
  .route("/images", imagesRoutes)
  .route("/stats", statsRoutes);

const port = Number(Bun.env.MEDIA_PORT) || 7000;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

log.success(`Listening on port ${server.port}`);
