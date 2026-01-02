import "server-only";

import { createApiClient } from "@arcle/api-client";
import { cookies } from "next/headers";

async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) return undefined;

  const baseURL =
    process.env.GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "http://localhost:3000";

  try {
    const response = await fetch(`${baseURL}/api/auth/token`, {
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

  const baseURL =
    process.env.GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "http://localhost:3000";

  return createApiClient({
    baseURL,
    getToken: async () => token,
  });
}
