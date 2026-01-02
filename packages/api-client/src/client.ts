import { type $Fetch, ofetch } from "ofetch";
import {
  createAdminDomain,
  createCatalogDomain,
  createMediaDomain,
  createSettingsDomain,
  createStatsDomain,
  createUsersDomain,
} from "./domains";

export type TokenGetter = () => Promise<string | undefined>;

export type ApiClientConfig = {
  baseURL?: string;
  credentials?: RequestCredentials;
  getToken?: TokenGetter;
  headers?: HeadersInit;
};

export function createApiClient(config: ApiClientConfig = {}) {
  const rawBaseURL =
    config.baseURL ??
    process.env.NEXT_PUBLIC_GATEWAY_URL ??
    "http://localhost:3000";

  const baseURL = rawBaseURL.endsWith("/")
    ? rawBaseURL.slice(0, -1)
    : rawBaseURL;

  const credentials = config.credentials ?? "include";
  const getToken = config.getToken;
  const customHeaders = config.headers;

  const $fetch = ofetch.create({
    baseURL: `${baseURL}/api`,
    credentials,
    retry: 2,
    retryDelay: 500,
    async onRequest({ options }) {
      options.headers = new Headers(options.headers);

      if (customHeaders) {
        const headers = new Headers(customHeaders);
        for (const [key, value] of headers.entries()) {
          options.headers.set(key, value);
        }
      }

      if (getToken) {
        const token = await getToken();
        if (token) {
          options.headers.set("Authorization", `Bearer ${token}`);
        }
      }
    },
  });

  return {
    admin: createAdminDomain($fetch),
    catalog: createCatalogDomain($fetch),
    users: createUsersDomain($fetch),
    settings: createSettingsDomain($fetch),
    stats: createStatsDomain($fetch, baseURL),
    media: createMediaDomain({ baseURL, credentials, getToken }),
    $fetch,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export type ApiFetch = $Fetch;
