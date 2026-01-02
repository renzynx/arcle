import { getSettingBool } from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";
import type { Context, Next } from "hono";

const REGISTRATION_PATHS = ["/api/auth/sign-up", "/api/auth/sign-up/email"];

export async function registrationGuard(c: Context, next: Next) {
  const path = c.req.path;
  const method = c.req.method;

  if (method !== "POST") {
    return next();
  }

  const isRegistrationPath = REGISTRATION_PATHS.some((p) => path.startsWith(p));
  if (!isRegistrationPath) {
    return next();
  }

  const isRegistrationEnabled = await getSettingBool(
    SettingKey.REGISTRATION_ENABLED,
    true,
  );

  if (isRegistrationEnabled) {
    return next();
  }

  return c.json(
    {
      error: "Registration Disabled",
      message: "New user registration is currently disabled.",
    },
    403,
  );
}
