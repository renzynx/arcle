import type { Context, MiddlewareHandler } from "hono";
import {
  createJWTVerifier,
  type JWTVerifierConfig,
  type VerifiedPayload,
} from "./jwt";

export type AuthMiddlewareConfig = JWTVerifierConfig & {
  optional?: boolean;
};

declare module "hono" {
  interface ContextVariableMap {
    user: VerifiedPayload | null;
  }
}

function extractToken(c: Context): string | null {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export function authMiddleware(
  config: AuthMiddlewareConfig,
): MiddlewareHandler {
  const verifier = createJWTVerifier(config);

  return async (c, next) => {
    const token = extractToken(c);

    if (!token) {
      if (config.optional) {
        c.set("user", null);
        return next();
      }
      return c.json(
        { error: "Unauthorized", message: "Missing authorization token" },
        401,
      );
    }

    try {
      const payload = await verifier.verify(token);
      c.set("user", payload);
      return next();
    } catch (_error) {
      if (config.optional) {
        c.set("user", null);
        return next();
      }
      return c.json(
        { error: "Unauthorized", message: "Invalid or expired token" },
        401,
      );
    }
  };
}

export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        { error: "Unauthorized", message: "Authentication required" },
        401,
      );
    }
    return next();
  };
}

export function requireRole(role: string): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        { error: "Unauthorized", message: "Authentication required" },
        401,
      );
    }
    const userRole = (user as { role?: string }).role;
    if (userRole !== role) {
      return c.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        403,
      );
    }
    return next();
  };
}

export function requireAdmin(): MiddlewareHandler {
  return requireRole("admin");
}
