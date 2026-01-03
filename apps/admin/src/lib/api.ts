import { createApiClient } from "@arcle/api-client";
import { getAccessToken } from "@arcle/auth-client";

export const apiClient = createApiClient({ getToken: getAccessToken });

function getServerBaseURL() {
  return process.env.GATEWAY_URL || "http://localhost:3000";
}

export function getServerApiClient() {
  return createApiClient({ baseURL: getServerBaseURL() });
}
