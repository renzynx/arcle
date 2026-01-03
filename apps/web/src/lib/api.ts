import { createApiClient } from "@arcle/api-client";

export { useApiClient } from "@arcle/auth-client";

const serverBaseURL = process.env.GATEWAY_URL || "http://localhost:3000";

export const serverApiClient = createApiClient({ baseURL: serverBaseURL });
