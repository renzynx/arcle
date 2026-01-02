import * as schema from "@arcle/database/schema";
import { drizzle } from "drizzle-orm/bun-sql";

if (!Bun.env.CATALOG_DATABASE_URL) {
  throw new Error("CATALOG_DATABASE_URL environment variable is required");
}

export const db = drizzle(Bun.env.CATALOG_DATABASE_URL, { schema });

export * from "@arcle/database/schema";
