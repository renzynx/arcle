import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { requireAuth, requireRole } from "@arcle/auth-server";
import { getSetting, getSettingNumber } from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";
import { getImagesQueue, initQueueConnection } from "@arcle/queue";
import { buildSignedUrl, signUrl, verifySignature } from "@arcle/signing";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { getSigningConfig } from "../lib/settings";

const REDIS_URL = Bun.env.REDIS_URL || "redis://localhost:6379";
initQueueConnection(REDIS_URL);

const UPLOAD_DIR = resolve(Bun.env.UPLOAD_DIR || "./uploads");
const TEMP_DIR = join(UPLOAD_DIR, "temp");
const COVERS_DIR = join(UPLOAD_DIR, "covers");
const PAGES_DIR = join(UPLOAD_DIR, "pages");
const OG_DIR = join(UPLOAD_DIR, "og");
const AVATARS_DIR = join(UPLOAD_DIR, "avatars");
const DEFAULT_MEDIA_BASE_URL = Bun.env.GATEWAY_URL || "http://localhost:3000";
const DEFAULT_MAX_SIZE_MB = 10;
const WEBP_QUALITY = 85;
const AVATAR_MAX_SIZE_MB = 2;

async function getBaseUrl(): Promise<string> {
  const cdnUrl = await getSetting(SettingKey.CDN_URL);
  const baseUrl = cdnUrl || DEFAULT_MEDIA_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function getMaxSizeBytes(): Promise<number> {
  const maxSizeMb = await getSettingNumber(
    SettingKey.UPLOAD_MAX_SIZE_MB,
    DEFAULT_MAX_SIZE_MB,
  );
  return maxSizeMb * 1024 * 1024;
}

async function validateFileSize(file: File): Promise<string | null> {
  const maxSize = await getMaxSizeBytes();
  if (file.size > maxSize) {
    const maxSizeMb = maxSize / (1024 * 1024);
    return `File size exceeds maximum allowed (${maxSizeMb}MB)`;
  }
  return null;
}

async function saveTempFile(file: File, id: string): Promise<string> {
  await mkdir(TEMP_DIR, { recursive: true });
  const ext = file.name.split(".").pop() || "bin";
  const tempPath = join(TEMP_DIR, `${id}.${ext}`);
  await Bun.write(tempPath, file);
  return tempPath;
}

async function queueImageConversion(
  type: "cover" | "page" | "avatar",
  tempPath: string,
  outputDir: string,
  filename: string,
): Promise<void> {
  const queue = getImagesQueue();
  await queue.add("convert-to-webp", {
    type,
    sourcePath: tempPath,
    outputPath: join(outputDir, filename),
    filename,
    quality: WEBP_QUALITY,
  });
}

function requireSignedUrl(): MiddlewareHandler {
  return async (c, next) => {
    const config = await getSigningConfig();

    if (!config.enabled) {
      return next();
    }

    const path = c.req.path;
    const ex = c.req.query("ex");
    const is = c.req.query("is");
    const hm = c.req.query("hm");

    const result = verifySignature(config.secret, path, { ex, is, hm });

    if (!result.valid) {
      const messages: Record<string, string> = {
        missing_params: "This content requires a signed URL",
        expired: "This content is no longer available",
        invalid_signature: "This content is no longer available",
      };
      return c.json({ error: messages[result.reason] }, 404);
    }

    return next();
  };
}

const uploadQuerySchema = z.object({
  seriesId: z.string().min(1),
  chapterId: z.string().min(1),
});

const signQuerySchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(100),
});

export const imagesRoutes = new Hono()
  .post("/covers", requireRole("admin"), async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }

    const sizeError = await validateFileSize(file);
    if (sizeError) {
      return c.json({ error: sizeError }, 400);
    }

    const id = createId();
    const filename = `${id}.webp`;

    const tempPath = await saveTempFile(file, id);
    await queueImageConversion("cover", tempPath, COVERS_DIR, filename);

    const baseUrl = await getBaseUrl();
    return c.json(
      {
        url: `${baseUrl}/api/media/images/covers/${filename}`,
        filename,
        status: "processing",
      },
      202,
    );
  })

  .delete("/covers/:filename", requireRole("admin"), async (c) => {
    const { filename } = c.req.param();
    const filepath = join(COVERS_DIR, filename);

    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(filepath);
      return c.json({ deleted: true });
    } catch {
      return c.json({ deleted: false }, 404);
    }
  })

  .get("/covers/:filename", async (c) => {
    const { filename } = c.req.param();
    const filepath = join(COVERS_DIR, filename);

    const file = Bun.file(filepath);
    if (!(await file.exists())) {
      return c.json({ error: "Image not found" }, 404);
    }

    return new Response(file.stream(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  })

  .post("/og", requireRole("admin"), async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }

    const sizeError = await validateFileSize(file);
    if (sizeError) {
      return c.json({ error: sizeError }, 400);
    }

    await mkdir(OG_DIR, { recursive: true });

    const id = createId();
    const filename = `${id}.webp`;

    const tempPath = await saveTempFile(file, id);
    await queueImageConversion("cover", tempPath, OG_DIR, filename);

    const baseUrl = await getBaseUrl();
    return c.json(
      {
        url: `${baseUrl}/api/media/images/og/${filename}`,
        filename,
        status: "processing",
      },
      202,
    );
  })

  .delete("/og/:filename", requireRole("admin"), async (c) => {
    const { filename } = c.req.param();
    const filepath = join(OG_DIR, filename);

    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(filepath);
      return c.json({ deleted: true });
    } catch {
      return c.json({ deleted: false }, 404);
    }
  })

  .get("/og/:filename", async (c) => {
    const { filename } = c.req.param();
    const filepath = join(OG_DIR, filename);

    const file = Bun.file(filepath);
    if (!(await file.exists())) {
      return c.json({ error: "Image not found" }, 404);
    }

    return new Response(file.stream(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  })

  .post("/pages", requireRole("admin"), async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }

    const sizeError = await validateFileSize(file);
    if (sizeError) {
      return c.json({ error: sizeError }, 400);
    }

    const id = createId();
    const filename = `${id}.webp`;

    const tempPath = await saveTempFile(file, id);
    await queueImageConversion("page", tempPath, PAGES_DIR, filename);

    const baseUrl = await getBaseUrl();
    return c.json(
      {
        url: `${baseUrl}/api/media/images/pages/${filename}`,
        filename,
        status: "processing",
      },
      202,
    );
  })

  .get("/pages/:filename", requireSignedUrl(), async (c) => {
    const { filename } = c.req.param();
    const filepath = join(PAGES_DIR, filename);

    const file = Bun.file(filepath);
    if (!(await file.exists())) {
      return c.json({ error: "Image not found" }, 404);
    }

    return new Response(file.stream(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  })

  .post(
    "/upload",
    requireRole("admin"),
    zValidator("query", uploadQuerySchema),
    async (c) => {
      const { seriesId, chapterId } = c.req.valid("query");
      const formData = await c.req.formData();
      const files = formData.getAll("files") as File[];

      if (files.length === 0) {
        return c.json({ error: "No files provided" }, 400);
      }

      const maxSize = await getMaxSizeBytes();
      const queuedFiles: { id: string; filename: string; path: string }[] = [];
      const chapterDir = join(UPLOAD_DIR, seriesId, chapterId);

      await mkdir(chapterDir, { recursive: true });

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        if (file.size > maxSize) {
          continue;
        }

        const id = createId();
        const filename = `${id}.webp`;

        const tempPath = await saveTempFile(file, id);
        await queueImageConversion("page", tempPath, chapterDir, filename);

        queuedFiles.push({
          id,
          filename,
          path: `/images/${seriesId}/${chapterId}/${filename}`,
        });
      }

      return c.json({ queued: queuedFiles, status: "processing" }, 202);
    },
  )

  .get("/:seriesId/:chapterId/:filename", requireSignedUrl(), async (c) => {
    const { seriesId, chapterId, filename } = c.req.param();
    const filepath = join(UPLOAD_DIR, seriesId, chapterId, filename);

    const file = Bun.file(filepath);
    if (!(await file.exists())) {
      return c.json({ error: "Image not found" }, 404);
    }

    return new Response(file.stream(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  })

  .delete("/:seriesId/:chapterId", requireRole("admin"), async (c) => {
    const { seriesId, chapterId } = c.req.param();
    const chapterDir = join(UPLOAD_DIR, seriesId, chapterId);

    try {
      const { rm } = await import("node:fs/promises");
      await rm(chapterDir, { recursive: true, force: true });
      return c.json({ deleted: true });
    } catch {
      return c.json({ deleted: false, error: "Failed to delete" }, 500);
    }
  })

  .post("/sign", zValidator("json", signQuerySchema), async (c) => {
    const config = await getSigningConfig();

    if (!config.enabled) {
      return c.json({ error: "URL signing is not enabled" }, 400);
    }

    const { paths } = c.req.valid("json");
    const baseUrl = await getBaseUrl();

    const signedUrls = paths.map((path) => {
      const params = signUrl(config.secret, path, config.expiry);
      return {
        path,
        url: buildSignedUrl(baseUrl, path, params),
        expiresAt: Number.parseInt(params.ex, 16),
      };
    });

    return c.json({ urls: signedUrls });
  })

  .get("/signing/status", async (c) => {
    const config = await getSigningConfig();
    return c.json({
      enabled: config.enabled,
      expiry: config.expiry,
    });
  })

  .post("/avatars", requireAuth(), async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }

    const maxSize = AVATAR_MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(
        {
          error: `File size exceeds maximum allowed (${AVATAR_MAX_SIZE_MB}MB)`,
        },
        400,
      );
    }

    await mkdir(AVATARS_DIR, { recursive: true });

    const id = createId();
    const filename = `${id}.webp`;

    const tempPath = await saveTempFile(file, id);
    await queueImageConversion("avatar", tempPath, AVATARS_DIR, filename);

    const baseUrl = await getBaseUrl();
    return c.json(
      {
        url: `${baseUrl}/api/media/images/avatars/${filename}`,
        filename,
        status: "processing",
      },
      202,
    );
  })

  .get("/avatars/:filename", async (c) => {
    const { filename } = c.req.param();
    const filepath = join(AVATARS_DIR, filename);

    const file = Bun.file(filepath);
    if (!(await file.exists())) {
      return c.json({ error: "Image not found" }, 404);
    }

    return new Response(file.stream(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  })

  .delete("/avatars/:filename", requireAuth(), async (c) => {
    const { filename } = c.req.param();
    const filepath = join(AVATARS_DIR, filename);

    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(filepath);
      return c.json({ deleted: true });
    } catch {
      return c.json({ deleted: false }, 404);
    }
  });
