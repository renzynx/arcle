import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  jwtClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roles } from "./permissions";

export function createAuthClientWithBaseURL(gatewayUrl: string) {
  return createAuthClient({
    baseURL: `${gatewayUrl}/api/auth`,
    plugins: [
      adminClient({ ac, roles }),
      jwtClient(),
      twoFactorClient(),
      passkeyClient(),
    ],
  });
}

export type AuthClientInstance = ReturnType<typeof createAuthClientWithBaseURL>;

export type Session = AuthClientInstance["$Infer"]["Session"];
export type User = Session["user"];
