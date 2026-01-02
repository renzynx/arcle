import { createRedisClient } from "@arcle/events/redis";
import { createLogger } from "@arcle/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config.ts";
import { maintenanceMode } from "./middleware/maintenance.ts";
import { rateLimiter } from "./middleware/ratelimit.ts";
import { healthRoutes } from "./routes/health.ts";
import { proxyRoutes } from "./routes/proxy.ts";

const log = createLogger({ name: "gateway" });

createRedisClient(config.redisUrl);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: config.allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("*", maintenanceMode);
app.use("*", rateLimiter);

app.route("/", healthRoutes);
app.route("/", proxyRoutes);

const server = Bun.serve({
  port: config.port,
  fetch: app.fetch,
});

log.success(`Listening on port ${server.port}`);
