import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/";
import { admin, anonymous, jwt, openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "Arcle",
  trustedOrigins: Bun.env.TRUSTED_ORIGINS?.split(",") || ['http://localhost:3000'],
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  experimental: { joins: true },
  plugins: [admin(), jwt(), anonymous(), openAPI()],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    cookiePrefix: 'arcle_auth',
  },
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null
  session: typeof auth.$Infer.Session.session | null
}
