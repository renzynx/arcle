import { AUTH_COOKIE_PREFIX } from "@arcle/auth-client/constants";
import { ac, roles } from "@arcle/auth-client/permissions";
import { passkey } from "@better-auth/passkey";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { admin, jwt, openAPI, twoFactor } from "better-auth/plugins";
import { db } from "@/db/";
import { publishUserCreated } from "@/events/publishers";
import { secondaryStorage } from "./secondary-storage";

export const auth = betterAuth({
  appName: "Arcle",
  trustedOrigins: Bun.env.TRUSTED_ORIGINS?.split(",") || [
    "http://localhost:8000",
    "http://localhost:9000",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secondaryStorage,
  experimental: { joins: true },
  rateLimit: {
    storage: "secondary-storage",
  },
  plugins: [
    admin({
      ac,
      roles,
    }),
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: user.role,
        }),
      },
    }),
    openAPI(),
    twoFactor(),
    passkey(),
  ],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    ipAddress: {
      ipAddressHeaders: [
        "cf-connecting-ip",
        "x-real-ip",
        "x-forwarded-for",
        "x-client-ip",
        "x-cluster-client-ip",
        "fastly-client-ip",
        "true-client-ip",
        "x-forwarded",
        "forwarded-for",
      ],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await publishUserCreated({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          });
        },
      },
    },
  },
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
