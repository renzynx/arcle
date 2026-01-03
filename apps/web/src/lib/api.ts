import { createApiClient } from "@arcle/api-client";

export { useApiClient } from "@arcle/auth-client";

function getServerBaseURL() {
  return process.env.GATEWAY_URL || "http://localhost:3000";
}

export function getServerApiClient() {
  return createApiClient({ baseURL: getServerBaseURL() });
}
