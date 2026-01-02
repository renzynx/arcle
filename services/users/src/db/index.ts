import { drizzle } from "drizzle-orm/bun-sql";
import * as users from "./schema/users.ts";

const schema = {
  ...users,
};

export const db = drizzle(Bun.env.DATABASE_URL!, { schema });

export * from "./schema/users.ts";
