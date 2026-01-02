import { randomBytes } from "node:crypto";
import { requireRole } from "@arcle/auth-server";
import { CacheKey, getOrSet, TTL } from "@arcle/cache";
import { SETTING_KEYS, SettingKey } from "@arcle/database/schema/settings";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, settings } from "../db/index.ts";
import { publishSigningConfigChanged } from "../events/publishers.ts";
import {
  invalidateSettingsCache,
  setSettingsRefreshCallback,
} from "../lib/cache.ts";
import { clearSigningConfigCache } from "../lib/urls.ts";

const SIGNING_SETTINGS: string[] = [
  SettingKey.MEDIA_SIGNING_ENABLED,
  SettingKey.MEDIA_SIGNING_SECRET,
  SettingKey.MEDIA_SIGNING_EXPIRY,
];

function isSigningSetting(key: string): boolean {
  return SIGNING_SETTINGS.includes(key);
}

async function notifySigningConfigChanged(): Promise<void> {
  clearSigningConfigCache();
  await publishSigningConfigChanged({ changedAt: new Date() });
}

function generateSigningSecret(): string {
  return randomBytes(32).toString("hex");
}

async function ensureSigningSecret(): Promise<void> {
  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.key, SettingKey.MEDIA_SIGNING_SECRET))
    .limit(1);

  if (existing.length === 0 || !existing[0]?.value) {
    const secret = generateSigningSecret();
    await db
      .insert(settings)
      .values({
        key: SettingKey.MEDIA_SIGNING_SECRET,
        value: secret,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: secret, updatedAt: new Date() },
      });
  }
}

const settingKeySchema = z.enum(SETTING_KEYS as [string, ...string[]]);

const settingKeyParam = z.object({
  key: settingKeySchema,
});

const updateSettingBody = z.object({
  value: z.string(),
});

const bulkUpdateBody = z.object({
  settings: z.array(
    z.object({
      key: settingKeySchema,
      value: z.string(),
    }),
  ),
});

async function fetchAllSettings(): Promise<Record<string, string>> {
  const allSettings = await db.select().from(settings);
  const result: Record<string, string> = {};
  for (const s of allSettings) {
    result[s.key] = s.value;
  }
  return result;
}

setSettingsRefreshCallback(fetchAllSettings);

export const settingsRoutes = new Hono()
  .get("/", async (c) => {
    const result = await getOrSet(
      CacheKey.settings(),
      TTL.SETTINGS,
      fetchAllSettings,
    );
    return c.json(result);
  })

  .get("/:key", zValidator("param", settingKeyParam), async (c) => {
    const { key } = c.req.valid("param");

    const allSettings = await getOrSet(
      CacheKey.settings(),
      TTL.SETTINGS,
      fetchAllSettings,
    );

    const value = allSettings[key];
    if (value === undefined) {
      return c.json({ error: "Setting not found" }, 404);
    }

    return c.json({ key, value });
  })

  .put(
    "/:key",
    requireRole("admin"),
    zValidator("param", settingKeyParam),
    zValidator("json", updateSettingBody),
    async (c) => {
      const { key } = c.req.valid("param");
      const { value } = c.req.valid("json");

      const [updated] = await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        })
        .returning();

      if (key === SettingKey.MEDIA_SIGNING_ENABLED && value === "true") {
        await ensureSigningSecret();
      }

      await invalidateSettingsCache();

      if (isSigningSetting(key)) {
        await notifySigningConfigChanged();
      }

      return c.json(updated);
    },
  )

  .post(
    "/bulk",
    requireRole("admin"),
    zValidator("json", bulkUpdateBody),
    async (c) => {
      const { settings: settingsToUpdate } = c.req.valid("json");

      const results = await Promise.all(
        settingsToUpdate.map(async ({ key, value }) => {
          const [updated] = await db
            .insert(settings)
            .values({ key, value })
            .onConflictDoUpdate({
              target: settings.key,
              set: { value, updatedAt: new Date() },
            })
            .returning();
          return updated;
        }),
      );

      const signingEnabled = settingsToUpdate.find(
        (s) => s.key === SettingKey.MEDIA_SIGNING_ENABLED && s.value === "true",
      );
      if (signingEnabled) {
        await ensureSigningSecret();
      }

      await invalidateSettingsCache();

      const hasSigningChanges = settingsToUpdate.some((s) =>
        isSigningSetting(s.key),
      );
      if (hasSigningChanges) {
        await notifySigningConfigChanged();
      }

      return c.json(results);
    },
  )

  .delete(
    "/:key",
    requireRole("admin"),
    zValidator("param", settingKeyParam),
    async (c) => {
      const { key } = c.req.valid("param");

      await db.delete(settings).where(eq(settings.key, key));
      await invalidateSettingsCache();

      return c.json({ success: true });
    },
  )

  .post("/signing/regenerate", requireRole("admin"), async (c) => {
    const secret = generateSigningSecret();

    await db
      .insert(settings)
      .values({
        key: SettingKey.MEDIA_SIGNING_SECRET,
        value: secret,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: secret, updatedAt: new Date() },
      });

    await invalidateSettingsCache();
    await notifySigningConfigChanged();

    return c.json({ success: true, regenerated: true });
  });
