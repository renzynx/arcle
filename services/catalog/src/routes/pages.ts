import { requireRole } from "@arcle/auth-server";
import { CacheKey, del, getOrSet, TTL } from "@arcle/cache";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, pages } from "../db/index.ts";
import { withPageUrl } from "../lib/urls.ts";

const pageIdParam = z.object({
  id: z.string().min(1),
});

const createPageBody = z.object({
  chapterId: z.string().min(1),
  number: z.number().int().positive(),
  imageUrl: z.string(),
});

const createPagesBody = z.object({
  chapterId: z.string().min(1),
  pages: z.array(
    z.object({
      number: z.number().int().positive(),
      imageUrl: z.string(),
    }),
  ),
});

const updatePageBody = z.object({
  number: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
});

const deleteByChapterBody = z.object({
  chapterId: z.string().min(1),
});

export const pagesRoutes = new Hono()
  .get("/:id", zValidator("param", pageIdParam), async (c) => {
    const { id } = c.req.valid("param");

    const page = await getOrSet(CacheKey.pageById(id), TTL.PAGE, async () =>
      db.query.pages.findFirst({
        where: (p, { eq }) => eq(p.id, id),
      }),
    );

    if (!page) {
      return c.json({ error: "Page not found" }, 404);
    }
    return c.json(await withPageUrl(page));
  })
  .post(
    "/",
    requireRole("admin"),
    zValidator("json", createPageBody),
    async (c) => {
      const body = c.req.valid("json");

      const [created] = await db
        .insert(pages)
        .values({
          ...body,
          updatedAt: new Date(),
        })
        .returning();

      return c.json(created, 201);
    },
  )
  .post(
    "/bulk",
    requireRole("admin"),
    zValidator("json", createPagesBody),
    async (c) => {
      const { chapterId, pages: pagesList } = c.req.valid("json");

      const created = await db
        .insert(pages)
        .values(
          pagesList.map((page) => ({
            ...page,
            chapterId,
            updatedAt: new Date(),
          })),
        )
        .returning();

      return c.json(created, 201);
    },
  )
  .put(
    "/:id",
    requireRole("admin"),
    zValidator("param", pageIdParam),
    zValidator("json", updatePageBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const [updated] = await db
        .update(pages)
        .set(body)
        .where(eq(pages.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: "Page not found" }, 404);
      }

      await del(CacheKey.pageById(id));

      return c.json(updated);
    },
  )
  .delete(
    "/:id",
    requireRole("admin"),
    zValidator("param", pageIdParam),
    async (c) => {
      const { id } = c.req.valid("param");

      const [deleted] = await db
        .delete(pages)
        .where(eq(pages.id, id))
        .returning();

      if (!deleted) {
        return c.json({ error: "Page not found" }, 404);
      }

      await del(CacheKey.pageById(id));

      return c.json({ success: true });
    },
  )
  .post(
    "/delete-by-chapter",
    requireRole("admin"),
    zValidator("json", deleteByChapterBody),
    async (c) => {
      const { chapterId } = c.req.valid("json");

      await db.delete(pages).where(eq(pages.chapterId, chapterId));

      return c.json({ success: true });
    },
  );
