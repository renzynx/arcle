import { createApiClient } from "@arcle/api-client";
import { connection } from "next/server";

export { useApiClient } from "@arcle/auth-client";

export async function getServerApiClient() {
  await connection();
  const baseURL = process.env.GATEWAY_URL || "http://localhost:3000";
  return createApiClient({ baseURL });
}
