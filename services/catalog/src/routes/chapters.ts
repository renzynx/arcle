import { requireRole } from "@arcle/auth-server";
import { CacheKey, del, getOrSet, TTL } from "@arcle/cache";
import { getViewsQueue, VIEW_JOB_NAMES } from "@arcle/queue";
import { zValidator } from "@hono/zod-validator";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { chapters, db } from "../db/index.ts";
import { invalidateChapterCaches } from "../lib/cache.ts";
import { getFingerprint } from "../lib/fingerprint.ts";
import { createSlug } from "../lib/slugify.ts";
import { withCoverUrl, withPageUrls } from "../lib/urls.ts";
import {
  chapterBySlugParam,
  chaptersListQuery,
  createChapterBody,
  updateChapterBody,
} from "../schemas/chapters.ts";
import { idParam } from "../schemas/common.ts";

export const chaptersRoutes = new Hono()
  .get("/", zValidator("query", chaptersListQuery), async (c) => {
    const { limit, offset, sort, seriesId } = c.req.valid("query");

    const cacheParams = `${seriesId || "all"}:${sort}:${limit}:${offset}`;

    const result = await getOrSet(
      CacheKey.chaptersListPaginated(cacheParams),
      TTL.CHAPTERS_LIST,
      async () => {
        const orderBy =
          sort === "latest"
            ? desc(chapters.createdAt)
            : sort === "oldest"
              ? asc(chapters.createdAt)
              : asc(chapters.number);

        const whereClause = seriesId
          ? eq(chapters.seriesId, seriesId)
          : undefined;

        const [data, countResult] = await Promise.all([
          db.query.chapters.findMany({
            where: whereClause,
            orderBy,
            limit,
            offset,
            with: {
              series: { columns: { id: true, title: true, slug: true } },
            },
          }),
          db
            .select({ count: sql<number>`count(*)` })
            .from(chapters)
            .where(whereClause),
        ]);

        return { data, total: Number(countResult[0]?.count ?? 0) };
      },
    );

    return c.json(result);
  })

  .get("/:id", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");

    const chapter = await getOrSet(
      CacheKey.chapterById(id),
      TTL.CHAPTER,
      async () =>
        db.query.chapters.findFirst({
          where: (ch, { eq }) => eq(ch.id, id),
          with: { pages: true },
        }),
    );

    if (!chapter) {
      return c.json({ error: "Chapter not found" }, 404);
    }
    return c.json({
      ...chapter,
      pages: await withPageUrls(chapter.pages),
    });
  })

  .get(
    "/by-slug/:seriesSlug/:chapterNumber",
    zValidator("param", chapterBySlugParam),
    async (c) => {
      const { seriesSlug, chapterNumber } = c.req.valid("param");

      const chapter = await getOrSet(
        CacheKey.chapterBySlug(seriesSlug, chapterNumber),
        TTL.CHAPTER,
        async () => {
          const seriesRecord = await db.query.series.findFirst({
            where: (s, { eq }) => eq(s.slug, seriesSlug),
            columns: { id: true },
          });

          if (!seriesRecord) return null;

          return db.query.chapters.findFirst({
            where: (ch, { eq, and }) =>
              and(
                eq(ch.seriesId, seriesRecord.id),
                eq(ch.number, chapterNumber),
              ),
            with: { pages: true, series: true },
          });
        },
      );

      if (!chapter) {
        return c.json({ error: "Chapter not found" }, 404);
      }

      return c.json({
        ...chapter,
        pages: await withPageUrls(chapter.pages),
        series: chapter.series ? await withCoverUrl(chapter.series) : null,
      });
    },
  )

  .get("/:id/pages", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");
    const pagesData = await db.query.pages.findMany({
      where: (p, { eq }) => eq(p.chapterId, id),
      orderBy: (p, { asc }) => asc(p.number),
    });
    return c.json(await withPageUrls(pagesData));
  })

  .post(
    "/",
    requireRole("admin"),
    zValidator("json", createChapterBody),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      const slug = body.title
        ? createSlug(body.title)
        : `chapter-${body.number}`;

      const [created] = await db
        .insert(chapters)
        .values({
          ...body,
          slug,
          createdBy: user.sub,
          updatedAt: new Date(),
        })
        .returning();

      if (!created) {
        return c.json({ error: "Failed to create chapter" }, 500);
      }

      const seriesRecord = await db.query.series.findFirst({
        where: (s, { eq }) => eq(s.id, body.seriesId),
        columns: { slug: true },
      });

      await invalidateChapterCaches(
        created.id,
        body.seriesId,
        seriesRecord?.slug,
        body.number,
      );

      return c.json(created, 201);
    },
  )

  .put(
    "/:id",
    requireRole("admin"),
    zValidator("param", idParam),
    zValidator("json", updateChapterBody),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const existing = await db.query.chapters.findFirst({
        where: (ch, { eq }) => eq(ch.id, id),
        columns: { seriesId: true, number: true },
        with: { series: { columns: { slug: true } } },
      });

      if (!existing) {
        return c.json({ error: "Chapter not found" }, 404);
      }

      const updateData: Record<string, unknown> = {
        ...body,
        updatedBy: user.sub,
      };

      if (body.title) {
        updateData.slug = createSlug(body.title);
      } else if (body.number !== undefined) {
        updateData.slug = `chapter-${body.number}`;
      }

      const [updated] = await db
        .update(chapters)
        .set(updateData)
        .where(eq(chapters.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: "Chapter not found" }, 404);
      }

      await invalidateChapterCaches(
        id,
        existing.seriesId,
        existing.series?.slug,
        existing.number,
      );

      if (body.number !== undefined && body.number !== existing.number) {
        await del(
          CacheKey.chapterBySlug(existing.series?.slug ?? "", body.number),
        );
      }

      return c.json(updated);
    },
  )

  .delete(
    "/:id",
    requireRole("admin"),
    zValidator("param", idParam),
    async (c) => {
      const { id } = c.req.valid("param");

      const existing = await db.query.chapters.findFirst({
        where: (ch, { eq }) => eq(ch.id, id),
        columns: { seriesId: true, number: true },
        with: { series: { columns: { slug: true } } },
      });

      const [deleted] = await db
        .delete(chapters)
        .where(eq(chapters.id, id))
        .returning();

      if (!deleted) {
        return c.json({ error: "Chapter not found" }, 404);
      }

      if (existing) {
        await invalidateChapterCaches(
          id,
          existing.seriesId,
          existing.series?.slug,
          existing.number,
        );
      }

      return c.json({ success: true });
    },
  )

  .post("/:id/view", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");

    const chapter = await db.query.chapters.findFirst({
      where: (ch, { eq }) => eq(ch.id, id),
      columns: { id: true },
    });

    if (!chapter) {
      return c.json({ error: "Chapter not found" }, 404);
    }

    const fingerprint = getFingerprint(c);
    await getViewsQueue().add(VIEW_JOB_NAMES.RECORD_VIEW, {
      type: "chapter",
      id,
      fingerprint,
      timestamp: Date.now(),
    });

    return c.json({ success: true });
  })

  .post(
    "/by-slug/:seriesSlug/:chapterNumber/view",
    zValidator("param", chapterBySlugParam),
    async (c) => {
      const { seriesSlug, chapterNumber } = c.req.valid("param");

      const seriesRecord = await db.query.series.findFirst({
        where: (s, { eq }) => eq(s.slug, seriesSlug),
        columns: { id: true },
      });

      if (!seriesRecord) {
        return c.json({ error: "Series not found" }, 404);
      }

      const chapter = await db.query.chapters.findFirst({
        where: (ch, { eq, and }) =>
          and(eq(ch.seriesId, seriesRecord.id), eq(ch.number, chapterNumber)),
        columns: { id: true },
      });

      if (!chapter) {
        return c.json({ error: "Chapter not found" }, 404);
      }

      const fingerprint = getFingerprint(c);
      await getViewsQueue().add(VIEW_JOB_NAMES.RECORD_VIEW, {
        type: "chapter",
        id: chapter.id,
        fingerprint,
        timestamp: Date.now(),
      });

      return c.json({ success: true });
    },
  );
