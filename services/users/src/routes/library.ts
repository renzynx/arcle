import {
  CacheKey,
  CachePattern,
  del,
  delPattern,
  getOrSet,
  TTL,
} from "@arcle/cache";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, history, library, ratings } from "../db/index.ts";

const libraryStatus = z.enum([
  "reading",
  "completed",
  "on_hold",
  "dropped",
  "planning",
]);

const addToLibraryInput = z.object({
  seriesId: z.string().min(1),
  status: libraryStatus.default("planning"),
});

const updateLibraryInput = z.object({
  status: libraryStatus,
});

const trackHistoryInput = z.object({
  seriesId: z.string().min(1),
  chapterNumber: z.number().positive(),
  pageNumber: z.number().int().positive().optional(),
});

const updateHistoryInput = z.object({
  chapterNumber: z.number().positive().optional(),
  pageNumber: z.number().int().positive().optional(),
});

const addRatingInput = z.object({
  seriesId: z.string().min(1),
  score: z.number().int().min(1).max(10),
});

const updateRatingInput = z.object({
  score: z.number().int().min(1).max(10),
});

export const libraryRoutes = new Hono()
  .get("/", async (c) => {
    const userId = c.get("user")!.sub;
    const items = await getOrSet(
      CacheKey.libraryByUser(userId),
      TTL.LIBRARY,
      async () =>
        db.query.library.findMany({
          where: (lib, { eq }) => eq(lib.userId, userId),
        }),
    );
    return c.json(items);
  })
  .post("/", zValidator("json", addToLibraryInput), async (c) => {
    const userId = c.get("user")!.sub;
    const { seriesId, status } = c.req.valid("json");

    const existing = await db.query.library.findFirst({
      where: (lib, { and, eq }) =>
        and(eq(lib.userId, userId), eq(lib.seriesId, seriesId)),
    });

    if (existing) {
      return c.json({ error: "Series already in library" }, 409);
    }

    await db.insert(library).values({
      userId,
      seriesId,
      status,
    });

    await delPattern(CachePattern.libraryByUser(userId));

    return c.json({ success: true }, 201);
  })
  .get("/history", async (c) => {
    const userId = c.get("user")!.sub;
    const items = await getOrSet(
      CacheKey.historyByUser(userId),
      TTL.HISTORY,
      async () =>
        db.query.history.findMany({
          where: (h, { eq }) => eq(h.userId, userId),
          orderBy: (h, { desc }) => desc(h.readAt),
        }),
    );
    return c.json(items);
  })
  .post("/history", zValidator("json", trackHistoryInput), async (c) => {
    const userId = c.get("user")!.sub;
    const { seriesId, chapterNumber, pageNumber } = c.req.valid("json");

    const existing = await db.query.history.findFirst({
      where: (h, { and, eq }) =>
        and(eq(h.userId, userId), eq(h.seriesId, seriesId)),
    });

    if (existing) {
      await db
        .update(history)
        .set({
          chapterNumber: String(chapterNumber),
          pageNumber: pageNumber ?? 1,
          readAt: new Date(),
        })
        .where(eq(history.id, existing.id));
    } else {
      await db.insert(history).values({
        id: createId(),
        userId,
        seriesId,
        chapterNumber: String(chapterNumber),
        pageNumber: pageNumber ?? 1,
      });
    }

    await delPattern(CachePattern.historyByUser(userId));

    return c.json({ success: true });
  })
  .delete("/history", async (c) => {
    const userId = c.get("user")!.sub;

    await db.delete(history).where(eq(history.userId, userId));

    await delPattern(CachePattern.historyByUser(userId));

    return c.json({ success: true });
  })
  .put(
    "/history/:seriesId",
    zValidator("json", updateHistoryInput),
    async (c) => {
      const userId = c.get("user")!.sub;
      const seriesId = c.req.param("seriesId");
      const data = c.req.valid("json");

      const updateData: Record<string, unknown> = { readAt: new Date() };
      if (data.chapterNumber !== undefined) {
        updateData.chapterNumber = String(data.chapterNumber);
      }
      if (data.pageNumber !== undefined) {
        updateData.pageNumber = data.pageNumber;
      }

      const existing = await db.query.history.findFirst({
        where: (h, { and, eq }) =>
          and(eq(h.userId, userId), eq(h.seriesId, seriesId)),
      });

      if (!existing) {
        return c.json({ error: "History entry not found" }, 404);
      }

      await db
        .update(history)
        .set(updateData)
        .where(eq(history.id, existing.id));

      await Promise.all([
        del(CacheKey.historyByUser(userId)),
        del(CacheKey.historyItem(userId, seriesId)),
      ]);

      return c.json({ success: true });
    },
  )
  .delete("/history/:seriesId", async (c) => {
    const userId = c.get("user")!.sub;
    const seriesId = c.req.param("seriesId");

    const existing = await db.query.history.findFirst({
      where: (h, { and, eq }) =>
        and(eq(h.userId, userId), eq(h.seriesId, seriesId)),
    });

    if (!existing) {
      return c.json({ error: "History entry not found" }, 404);
    }

    await db.delete(history).where(eq(history.id, existing.id));

    await Promise.all([
      del(CacheKey.historyByUser(userId)),
      del(CacheKey.historyItem(userId, seriesId)),
    ]);

    return c.json({ success: true });
  })
  .get("/ratings", async (c) => {
    const userId = c.get("user")!.sub;
    const items = await getOrSet(
      CacheKey.ratingsByUser(userId),
      TTL.RATINGS,
      async () =>
        db.query.ratings.findMany({
          where: (r, { eq }) => eq(r.userId, userId),
        }),
    );
    return c.json(items);
  })
  .get("/ratings/:seriesId", async (c) => {
    const userId = c.get("user")!.sub;
    const seriesId = c.req.param("seriesId");

    const item = await getOrSet(
      CacheKey.ratingItem(userId, seriesId),
      TTL.RATINGS,
      async () =>
        db.query.ratings.findFirst({
          where: (r, { and, eq }) =>
            and(eq(r.userId, userId), eq(r.seriesId, seriesId)),
        }),
    );

    if (!item) {
      return c.json({ error: "Rating not found" }, 404);
    }

    return c.json(item);
  })
  .post("/ratings", zValidator("json", addRatingInput), async (c) => {
    const userId = c.get("user")!.sub;
    const { seriesId, score } = c.req.valid("json");

    const existing = await db.query.ratings.findFirst({
      where: (r, { and, eq }) =>
        and(eq(r.userId, userId), eq(r.seriesId, seriesId)),
    });

    if (existing) {
      return c.json({ error: "Rating already exists" }, 409);
    }

    await db.insert(ratings).values({
      id: createId(),
      userId,
      seriesId,
      score,
    });

    await delPattern(CachePattern.ratingsByUser(userId));

    return c.json({ success: true }, 201);
  })
  .put(
    "/ratings/:seriesId",
    zValidator("json", updateRatingInput),
    async (c) => {
      const userId = c.get("user")!.sub;
      const seriesId = c.req.param("seriesId");
      const { score } = c.req.valid("json");

      const existing = await db.query.ratings.findFirst({
        where: (r, { and, eq }) =>
          and(eq(r.userId, userId), eq(r.seriesId, seriesId)),
      });

      if (!existing) {
        return c.json({ error: "Rating not found" }, 404);
      }

      await db
        .update(ratings)
        .set({ score })
        .where(eq(ratings.id, existing.id));

      await Promise.all([
        del(CacheKey.ratingsByUser(userId)),
        del(CacheKey.ratingItem(userId, seriesId)),
      ]);

      return c.json({ success: true });
    },
  )
  .delete("/ratings/:seriesId", async (c) => {
    const userId = c.get("user")!.sub;
    const seriesId = c.req.param("seriesId");

    const existing = await db.query.ratings.findFirst({
      where: (r, { and, eq }) =>
        and(eq(r.userId, userId), eq(r.seriesId, seriesId)),
    });

    if (!existing) {
      return c.json({ error: "Rating not found" }, 404);
    }

    await db.delete(ratings).where(eq(ratings.id, existing.id));

    await Promise.all([
      del(CacheKey.ratingsByUser(userId)),
      del(CacheKey.ratingItem(userId, seriesId)),
    ]);

    return c.json({ success: true });
  })
  .get("/:seriesId", async (c) => {
    const userId = c.get("user")!.sub;
    const seriesId = c.req.param("seriesId");

    const item = await getOrSet(
      CacheKey.libraryItem(userId, seriesId),
      TTL.LIBRARY,
      async () =>
        db.query.library.findFirst({
          where: (lib, { and, eq }) =>
            and(eq(lib.userId, userId), eq(lib.seriesId, seriesId)),
        }),
    );

    if (!item) {
      return c.json({ error: "Not in library" }, 404);
    }

    return c.json(item);
  })
  .put("/:seriesId", zValidator("json", updateLibraryInput), async (c) => {
    const userId = c.get("user")!.sub;
    const seriesId = c.req.param("seriesId");
    const { status } = c.req.valid("json");

    const [updated] = await db
      .update(library)
      .set({ status })
      .where(and(eq(library.userId, userId), eq(library.seriesId, seriesId)))
      .returning();

    if (!updated) {
      return c.json({ error: "Library entry not found" }, 404);
    }

    await Promise.all([
      del(CacheKey.libraryByUser(userId)),
      del(CacheKey.libraryItem(userId, seriesId)),
    ]);

    return c.json({ success: true });
  })
  .delete("/:seriesId", async (c) => {
    const userId = c.get("user")!.sub;
    const seriesId = c.req.param("seriesId");

    const [deleted] = await db
      .delete(library)
      .where(and(eq(library.userId, userId), eq(library.seriesId, seriesId)))
      .returning();

    if (!deleted) {
      return c.json({ error: "Library entry not found" }, 404);
    }

    await Promise.all([
      del(CacheKey.libraryByUser(userId)),
      del(CacheKey.libraryItem(userId, seriesId)),
    ]);

    return c.json({ success: true });
  });
