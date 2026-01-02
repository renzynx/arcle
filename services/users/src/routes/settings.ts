import { CacheKey, del, getOrSet, TTL } from "@arcle/cache";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, userSettings } from "../db/index.ts";

const updateSettingsInput = z.object({
  trackViews: z.boolean().optional(),
  trackHistory: z.boolean().optional(),
});

const defaultSettings = {
  trackViews: true,
  trackHistory: true,
};

export const settingsRoutes = new Hono()
  .get("/", async (c) => {
    const userId = c.get("user")!.sub;

    const settings = await getOrSet(
      CacheKey.userSettings(userId),
      TTL.USER_SETTINGS,
      async () =>
        db.query.userSettings.findFirst({
          where: (s, { eq }) => eq(s.userId, userId),
        }),
    );

    if (!settings) {
      return c.json({ userId, ...defaultSettings });
    }

    return c.json(settings);
  })
  .put("/", zValidator("json", updateSettingsInput), async (c) => {
    const userId = c.get("user")!.sub;
    const data = c.req.valid("json");

    const existing = await db.query.userSettings.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });

    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set(data)
        .where(eq(userSettings.userId, userId))
        .returning();

      await del(CacheKey.userSettings(userId));

      return c.json(updated);
    }

    const [created] = await db
      .insert(userSettings)
      .values({
        userId,
        ...defaultSettings,
        ...data,
      })
      .returning();

    await del(CacheKey.userSettings(userId));

    return c.json(created);
  });
