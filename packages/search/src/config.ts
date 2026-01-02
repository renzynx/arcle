/// <reference path="./features.d.ts" />
import type { SearchProviderType } from "./types.ts";

export interface SearchConfig {
  provider: SearchProviderType;
  typesense?: {
    host: string;
    port: number;
    protocol: "http" | "https";
    apiKey: string;
  };
}

export function getSearchConfig(): SearchConfig {
  const provider: SearchProviderType =
    typeof FEATURES !== "undefined"
      ? FEATURES.SEARCH_PROVIDER
      : (Bun.env.SEARCH_PROVIDER as SearchProviderType) || "postgres";

  if (provider === "typesense") {
    return {
      provider,
      typesense: {
        host: Bun.env.TYPESENSE_HOST || "localhost",
        port: Number(Bun.env.TYPESENSE_PORT) || 8108,
        protocol: (Bun.env.TYPESENSE_PROTOCOL || "http") as "http" | "https",
        apiKey: Bun.env.TYPESENSE_API_KEY || "",
      },
    };
  }

  return { provider: "postgres" };
}
