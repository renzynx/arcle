export * from "./config.ts";
export { PostgresSearchProvider } from "./providers/postgres.ts";
export { TypesenseSearchProvider } from "./providers/typesense.ts";
export * from "./types.ts";

import type * as schema from "@arcle/database/schema";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { getSearchConfig, type SearchConfig } from "./config.ts";
import { PostgresSearchProvider } from "./providers/postgres.ts";
import { TypesenseSearchProvider } from "./providers/typesense.ts";
import type { SearchProvider } from "./types.ts";

type DrizzleDB = BunSQLDatabase<typeof schema>;

interface CreateSearchProviderOptions {
  db: DrizzleDB;
  series: typeof schema.series;
  chapters: typeof schema.chapters;
  seriesGenres: typeof schema.seriesGenres;
  config?: SearchConfig;
}

export function createSearchProvider(
  options: CreateSearchProviderOptions,
): SearchProvider {
  const config = options.config ?? getSearchConfig();

  if (config.provider === "typesense" && config.typesense) {
    return new TypesenseSearchProvider(config.typesense);
  }

  return new PostgresSearchProvider({
    db: options.db,
    series: options.series,
    chapters: options.chapters,
    seriesGenres: options.seriesGenres,
  });
}
