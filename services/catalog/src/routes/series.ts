import { requireRole } from "@arcle/auth-server";
import {
  CacheKey,
  CachePattern,
  delPattern,
  getOrSet,
  TTL,
} from "@arcle/cache";
import { getViewsQueue, VIEW_JOB_NAMES } from "@arcle/queue";
import { zValidator } from "@hono/zod-validator";
import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
import { Hono } from "hono";
import { chapters, db, series, seriesGenres } from "../db/index.ts";
import { publishCoverCleanup } from "../events/publishers.ts";
import { invalidateSeriesCaches } from "../lib/cache.ts";
import { getFingerprint } from "../lib/fingerprint.ts";
import { createSlug } from "../lib/slugify.ts";
import { withCoverUrl, withCoverUrls } from "../lib/urls.ts";
import {
  chaptersPaginationQuery,
  idParam,
  paginationQuery,
  slugParam,
} from "../schemas/common.ts";
import { createSeriesBody, updateSeriesBody } from "../schemas/series.ts";

export const seriesRoutes = new Hono()
  .get("/", zValidator("query", paginationQuery), async (c) => {
    const { limit, offset, sort } = c.req.valid("query");

    const result = await getOrSet(
      CacheKey.seriesList(sort, limit, offset),
      TTL.SERIES_LIST,
      async () => {
        const [items, countResult] = await Promise.all([
          db.query.series.findMany({
            limit,
            offset,
            orderBy: (s, { desc }) =>
              sort === "popular" ? desc(s.viewCount) : desc(s.createdAt),
            with: {
              chapters: {
                orderBy: (ch, { desc }) => desc(ch.number),
                limit: 1,
              },
            },
          }),
          db.select({ total: count() }).from(series),
        ]);

        const data = items.map((item) => {
          const { chapters, ...rest } = item;
          return {
            ...rest,
            latestChapter: chapters[0] ?? null,
          };
        });

        return { data, total: countResult[0]?.total ?? 0 };
      },
    );

    return c.json({
      ...result,
      data: await withCoverUrls(result.data),
    });
  })

  .get("/:id", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");

    const item = await getOrSet(CacheKey.seriesById(id), TTL.SERIES, async () =>
      db.query.series.findFirst({
        where: (s, { eq }) => eq(s.id, id),
        with: {
          chapters: true,
          seriesGenres: {
            with: { genre: true },
          },
        },
      }),
    );

    if (!item) {
      return c.json({ error: "Series not found" }, 404);
    }

    const { seriesGenres: sg, ...rest } = item;
    return c.json({
      ...(await withCoverUrl(rest)),
      genres: sg.map((sg) => sg.genre),
    });
  })

  .get("/by-slug/:slug", zValidator("param", slugParam), async (c) => {
    const { slug } = c.req.valid("param");

    const item = await getOrSet(
      CacheKey.seriesBySlug(slug),
      TTL.SERIES,
      async () =>
        db.query.series.findFirst({
          where: (s, { eq }) => eq(s.slug, slug),
          with: {
            chapters: true,
            seriesGenres: {
              with: { genre: true },
            },
          },
        }),
    );

    if (!item) {
      return c.json({ error: "Series not found" }, 404);
    }

    const { seriesGenres: sg, ...rest } = item;
    return c.json({
      ...(await withCoverUrl(rest)),
      genres: sg.map((sg) => sg.genre),
    });
  })

  .get(
    "/:id/chapters",
    zValidator("param", idParam),
    zValidator("query", chaptersPaginationQuery),
    async (c) => {
      const { id } = c.req.valid("param");
      const { limit, offset, sort, search } = c.req.valid("query");

      const whereConditions = [eq(chapters.seriesId, id)];
      if (search) {
        whereConditions.push(
          like(sql`${chapters.number}::text`, `%${search}%`),
        );
      }

      const orderBy =
        sort === "latest"
          ? desc(chapters.createdAt)
          : sort === "oldest"
            ? asc(chapters.createdAt)
            : sort === "-number"
              ? desc(chapters.number)
              : asc(chapters.number);

      const cacheKey = `chapters:${id}:${sort}:${limit}:${offset}${search ? `:${search}` : ""}`;

      const result = await getOrSet(cacheKey, TTL.CHAPTERS_LIST, async () => {
        const [items, countResult] = await Promise.all([
          db
            .select()
            .from(chapters)
            .where(search ? and(...whereConditions) : eq(chapters.seriesId, id))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(chapters)
            .where(
              search ? and(...whereConditions) : eq(chapters.seriesId, id),
            ),
        ]);

        return {
          data: items,
          total: countResult[0]?.total ?? 0,
        };
      });

      return c.json(result);
    },
  )

  .post(
    "/",
    requireRole("admin"),
    zValidator("json", createSeriesBody),
    async (c) => {
      const user = c.get("user")!;
      const { genreIds, ...body } = c.req.valid("json");
      const slug = createSlug(body.title);

      const [created] = await db
        .insert(series)
        .values({
          ...body,
          slug,
          createdBy: user.sub,
          updatedAt: new Date(),
        })
        .returning();

      if (!created) {
        return c.json({ error: "Failed to create series" }, 500);
      }

      if (genreIds && genreIds.length > 0) {
        await db.insert(seriesGenres).values(
          genreIds.map((genreId) => ({
            seriesId: created.id,
            genreId,
          })),
        );
      }

      await delPattern(CachePattern.seriesLists());

      return c.json(await withCoverUrl(created), 201);
    },
  )

  .put(
    "/:id",
    requireRole("admin"),
    zValidator("param", idParam),
    zValidator("json", updateSeriesBody),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const { genreIds, ...body } = c.req.valid("json");

      const existing = await db.query.series.findFirst({
        where: (s, { eq }) => eq(s.id, id),
        columns: { coverImage: true, slug: true },
      });

      if (!existing) {
        return c.json({ error: "Series not found" }, 404);
      }

      const oldCoverFilename = existing.coverImage;
      const oldSlug = existing.slug;

      const updateData: Record<string, unknown> = {
        ...body,
        updatedBy: user.sub,
      };

      if (body.title) {
        updateData.slug = createSlug(body.title);
      }

      const [updated] = await db
        .update(series)
        .set(updateData)
        .where(eq(series.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: "Series not found" }, 404);
      }

      if (genreIds !== undefined) {
        await db.delete(seriesGenres).where(eq(seriesGenres.seriesId, id));
        if (genreIds.length > 0) {
          await db.insert(seriesGenres).values(
            genreIds.map((genreId) => ({
              seriesId: id,
              genreId,
            })),
          );
        }
      }

      if (oldCoverFilename && body.coverImage !== updated.coverImage) {
        await publishCoverCleanup({ filename: oldCoverFilename });
      }

      await invalidateSeriesCaches(id, oldSlug);

      return c.json(await withCoverUrl(updated));
    },
  )

  .delete(
    "/:id",
    requireRole("admin"),
    zValidator("param", idParam),
    async (c) => {
      const { id } = c.req.valid("param");

      const existing = await db.query.series.findFirst({
        where: (s, { eq }) => eq(s.id, id),
        columns: { coverImage: true, slug: true },
      });

      const [deleted] = await db
        .delete(series)
        .where(eq(series.id, id))
        .returning();

      if (!deleted) {
        return c.json({ error: "Series not found" }, 404);
      }

      if (deleted.coverImage) {
        await publishCoverCleanup({ filename: deleted.coverImage });
      }

      await invalidateSeriesCaches(id, existing?.slug);

      return c.json({ success: true });
    },
  )

  .post("/:id/view", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");

    const item = await db.query.series.findFirst({
      where: (s, { eq }) => eq(s.id, id),
      columns: { id: true },
    });

    if (!item) {
      return c.json({ error: "Series not found" }, 404);
    }

    const fingerprint = getFingerprint(c);
    await getViewsQueue().add(VIEW_JOB_NAMES.RECORD_VIEW, {
      type: "series",
      id,
      fingerprint,
      timestamp: Date.now(),
    });

    return c.json({ success: true });
  })

  .post("/by-slug/:slug/view", zValidator("param", slugParam), async (c) => {
    const { slug } = c.req.valid("param");

    const item = await db.query.series.findFirst({
      where: (s, { eq }) => eq(s.slug, slug),
      columns: { id: true },
    });

    if (!item) {
      return c.json({ error: "Series not found" }, 404);
    }

    const fingerprint = getFingerprint(c);
    await getViewsQueue().add(VIEW_JOB_NAMES.RECORD_VIEW, {
      type: "series",
      id: item.id,
      fingerprint,
      timestamp: Date.now(),
    });

    return c.json({ success: true });
  });
