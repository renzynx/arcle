import * as schema from "@arcle/database/schema";
import { drizzle } from "drizzle-orm/bun-sql";

export const db = drizzle(Bun.env.DATABASE_URL!, { schema });

export * from "@arcle/database/schema";
