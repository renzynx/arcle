import { createApiClient } from "@arcle/api-client";
import { getAccessToken } from "@arcle/auth-client";
import { connection } from "next/server";

export const apiClient = createApiClient({ getToken: getAccessToken });

export async function getServerApiClient() {
  await connection();
  const baseURL = process.env.GATEWAY_URL || "http://localhost:3000";
  return createApiClient({ baseURL });
}
