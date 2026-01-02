import { createApiClient } from "@arcle/api-client";
import { getAccessToken } from "@arcle/auth-client";

export const apiClient = createApiClient({ getToken: getAccessToken });

const serverBaseURL =
  process.env.GATEWAY_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  "http://localhost:3000";

export const serverApiClient = createApiClient({ baseURL: serverBaseURL });
