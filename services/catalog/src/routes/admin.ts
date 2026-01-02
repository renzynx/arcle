import { requireRole } from "@arcle/auth-server";
import { zValidator } from "@hono/zod-validator";
import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
import { Hono } from "hono";
import { chapters, db, series } from "../db/index.ts";
import { reindexAllSeries } from "../lib/search-sync.ts";
import { withCoverUrls } from "../lib/urls.ts";
import { adminPaginationQuery, idParam } from "../schemas/common.ts";

export const adminRoutes = new Hono()
  .use("/*", requireRole("admin"))

  .get("/series", zValidator("query", adminPaginationQuery), async (c) => {
    const { limit, offset, search } = c.req.valid("query");

    const chapterCountSq = db
      .select({ count: count() })
      .from(chapters)
      .where(eq(chapters.seriesId, series.id));

    const whereCondition = search
      ? like(series.title, `%${search}%`)
      : undefined;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: series.id,
          title: series.title,
          slug: series.slug,
          description: series.description,
          author: series.author,
          status: series.status,
          coverImage: series.coverImage,
          viewCount: series.viewCount,
          createdAt: series.createdAt,
          updatedAt: series.updatedAt,
          chapterCount: sql<number>`(${chapterCountSq})`.as("chapterCount"),
        })
        .from(series)
        .where(whereCondition)
        .orderBy(desc(series.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(series).where(whereCondition),
    ]);

    return c.json({
      data: await withCoverUrls(items),
      total: countResult[0]?.total ?? 0,
    });
  })

  .get(
    "/series/:id/chapters",
    zValidator("param", idParam),
    zValidator("query", adminPaginationQuery),
    async (c) => {
      const { id } = c.req.valid("param");
      const { limit, offset, search } = c.req.valid("query");

      const whereConditions = [eq(chapters.seriesId, id)];
      if (search) {
        whereConditions.push(
          like(sql`${chapters.number}::text`, `%${search}%`),
        );
      }

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(chapters)
          .where(and(...whereConditions))
          .orderBy(asc(chapters.number))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(chapters)
          .where(and(...whereConditions)),
      ]);

      return c.json({
        data: items,
        total: countResult[0]?.total ?? 0,
      });
    },
  )

  .post("/search/reindex", async (c) => {
    const count = await reindexAllSeries();
    return c.json({ success: true, indexed: count });
  });
