import { requireRole } from "@arcle/auth-server";
import { CacheKey, del, getOrSet, TTL } from "@arcle/cache";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db, genres } from "../db/index.ts";
import { createSlug } from "../lib/slugify.ts";
import { idParam } from "../schemas/common.ts";
import { createGenreBody, updateGenreBody } from "../schemas/genres.ts";

export const genresRoutes = new Hono()
  .get("/", async (c) => {
    const items = await getOrSet(CacheKey.genresList(), TTL.GENRES, async () =>
      db.query.genres.findMany({
        orderBy: (g, { asc }) => asc(g.name),
      }),
    );

    return c.json(items);
  })

  .get("/:id", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");

    const item = await getOrSet(CacheKey.genreById(id), TTL.GENRES, async () =>
      db.query.genres.findFirst({
        where: (g, { eq }) => eq(g.id, id),
      }),
    );

    if (!item) {
      return c.json({ error: "Genre not found" }, 404);
    }

    return c.json(item);
  })

  .post(
    "/",
    requireRole("admin"),
    zValidator("json", createGenreBody),
    async (c) => {
      const body = c.req.valid("json");
      const slug = createSlug(body.name);

      const existing = await db.query.genres.findFirst({
        where: (g, { or, eq }) => or(eq(g.name, body.name), eq(g.slug, slug)),
      });

      if (existing) {
        return c.json({ error: "Genre with this name already exists" }, 409);
      }

      const [created] = await db
        .insert(genres)
        .values({
          ...body,
          slug,
          updatedAt: new Date(),
        })
        .returning();

      if (!created) {
        return c.json({ error: "Failed to create genre" }, 500);
      }

      await del(CacheKey.genresList());

      return c.json(created, 201);
    },
  )

  .put(
    "/:id",
    requireRole("admin"),
    zValidator("param", idParam),
    zValidator("json", updateGenreBody),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const existing = await db.query.genres.findFirst({
        where: (g, { eq }) => eq(g.id, id),
      });

      if (!existing) {
        return c.json({ error: "Genre not found" }, 404);
      }

      const updateData: Record<string, unknown> = { ...body };

      if (body.name) {
        const name = body.name;
        const slug = createSlug(name);

        const duplicate = await db.query.genres.findFirst({
          where: (g, { and, or, eq, ne }) =>
            and(ne(g.id, id), or(eq(g.name, name), eq(g.slug, slug))),
        });

        if (duplicate) {
          return c.json({ error: "Genre with this name already exists" }, 409);
        }

        updateData.slug = slug;
      }

      const [updated] = await db
        .update(genres)
        .set(updateData)
        .where(eq(genres.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: "Genre not found" }, 404);
      }

      await Promise.all([
        del(CacheKey.genresList()),
        del(CacheKey.genreById(id)),
      ]);

      return c.json(updated);
    },
  )

  .delete(
    "/:id",
    requireRole("admin"),
    zValidator("param", idParam),
    async (c) => {
      const { id } = c.req.valid("param");

      const [deleted] = await db
        .delete(genres)
        .where(eq(genres.id, id))
        .returning();

      if (!deleted) {
        return c.json({ error: "Genre not found" }, 404);
      }

      await Promise.all([
        del(CacheKey.genresList()),
        del(CacheKey.genreById(id)),
      ]);

      return c.json({ success: true });
    },
  );
