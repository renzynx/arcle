import { CacheKey, getOrSet, TTL } from "@arcle/cache";
import { createSearchProvider, type SearchQuery } from "@arcle/search";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { chapters, db, series, seriesGenres } from "../db/index.ts";
import { withCoverUrls } from "../lib/urls.ts";

const searchQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z
    .enum(["latest", "popular", "alphabetical", "rating"])
    .default("latest"),
  status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]).optional(),
  includeGenres: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
  excludeGenres: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
  genreMode: z.enum(["any", "all"]).default("any"),
  minChapters: z.coerce.number().min(0).optional(),
  maxChapters: z.coerce.number().min(0).optional(),
});

const searchProvider = createSearchProvider({
  db,
  series,
  chapters,
  seriesGenres,
});

export const searchRoutes = new Hono().get(
  "/",
  zValidator("query", searchQuerySchema),
  async (c) => {
    const params = c.req.valid("query");

    const cacheHash = [
      params.q || "",
      params.limit,
      params.offset,
      params.sort,
      params.status || "",
      params.includeGenres?.join(",") || "",
      params.excludeGenres?.join(",") || "",
      params.genreMode,
      params.minChapters ?? "",
      params.maxChapters ?? "",
    ].join(":");

    const result = await getOrSet(
      CacheKey.search(cacheHash),
      TTL.SEARCH,
      async () => {
        const query: SearchQuery = {
          q: params.q,
          limit: params.limit,
          offset: params.offset,
          sort: params.sort,
          status: params.status,
          includeGenres: params.includeGenres,
          excludeGenres: params.excludeGenres,
          genreMode: params.genreMode,
          minChapters: params.minChapters,
          maxChapters: params.maxChapters,
        };

        return searchProvider.search(query);
      },
    );

    return c.json({
      data: await withCoverUrls(result.hits),
      total: result.total,
    });
  },
);
