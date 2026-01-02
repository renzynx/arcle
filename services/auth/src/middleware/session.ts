import type { Context, Next } from "hono";
import { type AuthType, auth } from "@/lib/auth";

export async function sessionMiddleware(
  c: Context<{ Variables: AuthType }>,
  next: Next,
) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
}

export function requireAuth(c: Context<{ Variables: AuthType }>, next: Next) {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
}
