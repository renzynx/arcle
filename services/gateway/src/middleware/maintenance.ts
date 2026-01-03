import { getSettingBool } from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";
import type { Context, Next } from "hono";
import { config } from "../config.ts";

const AUTH_URL = Bun.env.AUTH_URL || "http://localhost:4000";

export async function maintenanceMode(c: Context, next: Next) {
  const isMaintenanceMode = await getSettingBool(
    SettingKey.MAINTENANCE_MODE,
    false,
  );

  if (!isMaintenanceMode) {
    return next();
  }

  // Allow all requests from admin origin
  const origin = c.req.header("Origin") || c.req.header("Referer");
  if (origin?.startsWith(config.adminOrigin)) {
    return next();
  }

  if (c.req.path.startsWith("/api/auth")) {
    return next();
  }

  if (c.req.path === "/health" || c.req.path === "/status") {
    return next();
  }

  // Allow settings endpoint for maintenance page to fetch config
  if (c.req.path === "/api/catalog/settings") {
    return next();
  }

  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    try {
      const { verifyToken } = await import("@arcle/auth-server");
      const token = authHeader.replace("Bearer ", "");
      const payload = await verifyToken(token, {
        jwksUrl: `${AUTH_URL}/api/auth/.well-known/jwks.json`,
      });

      if (payload?.role === "admin") {
        return next();
      }
    } catch {
      // Token verification failed, continue to maintenance response
    }
  }

  return c.json(
    {
      error: "Service Unavailable",
      message:
        "The site is currently under maintenance. Please try again later.",
    },
    503,
  );
}
