import "server-only";

import { createApiClient } from "@arcle/api-client";
import { cookies } from "next/headers";

const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:3000";

async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) return undefined;

  try {
    const response = await fetch(`${gatewayUrl}/api/auth/token`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) return undefined;

    const data = await response.json();
    return data?.token;
  } catch {
    return undefined;
  }
}

export async function createAuthenticatedServerClient() {
  const token = await getServerToken();

  return createApiClient({
    baseURL: gatewayUrl,
    getToken: async () => token,
  });
}
