import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  jwtClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roles } from "./permissions";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return `${process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000"}/api/auth`;
  }
  return `${process.env.GATEWAY_URL || "http://localhost:3000"}/api/auth`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    adminClient({ ac, roles }),
    jwtClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/two-factor";
      },
    }),
    passkeyClient(),
  ],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  getSession,
  $fetch,
  token,
  admin,
  twoFactor,
  passkey,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];

const TOKEN_CACHE_DURATION_MS = 4 * 60 * 1000;
const TOKEN_BUFFER_MS = 30000;

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
let pendingTokenRequest: Promise<string | undefined> | null = null;

export async function getAccessToken(): Promise<string | undefined> {
  if (
    cachedToken &&
    tokenExpiry &&
    Date.now() < tokenExpiry - TOKEN_BUFFER_MS
  ) {
    return cachedToken;
  }

  if (pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = fetchToken();
  try {
    return await pendingTokenRequest;
  } finally {
    pendingTokenRequest = null;
  }
}

async function fetchToken(): Promise<string | undefined> {
  try {
    const { data, error } = await token();
    if (error || !data?.token) {
      cachedToken = null;
      tokenExpiry = null;
      return undefined;
    }

    cachedToken = data.token;
    tokenExpiry = Date.now() + TOKEN_CACHE_DURATION_MS;
    return cachedToken;
  } catch {
    cachedToken = null;
    tokenExpiry = null;
    return undefined;
  }
}

export function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = null;
}
