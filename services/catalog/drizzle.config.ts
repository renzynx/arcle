import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: [
    "../../packages/database/src/schema/catalog/*",
    "../../packages/database/src/schema/settings/*",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: Bun.env.DATABASE_URL!,
  },
});
