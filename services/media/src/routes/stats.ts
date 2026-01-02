import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { requireRole } from "@arcle/auth-server";
import {
  CacheKey,
  CachePattern,
  delPattern,
  getOrSet,
  getSetting,
  TTL,
} from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";
import { signUrl } from "@arcle/signing";
import { Hono } from "hono";
import { getSigningConfig } from "../lib/settings";

const UPLOAD_DIR = resolve(Bun.env.UPLOAD_DIR || "./uploads");
const COVERS_DIR = join(UPLOAD_DIR, "covers");
const PAGES_DIR = join(UPLOAD_DIR, "pages");
const TEMP_DIR = join(UPLOAD_DIR, "temp");
const DEFAULT_MEDIA_BASE_URL = Bun.env.GATEWAY_URL || "http://localhost:3000";

async function getBaseUrl(): Promise<string> {
  const cdnUrl = await getSetting(SettingKey.CDN_URL);
  const baseUrl = cdnUrl || DEFAULT_MEDIA_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function buildSignedUrl(
  baseUrl: string,
  urlPath: string,
  secret: string,
  expiry: string,
  signingPath?: string,
): string {
  const params = signUrl(secret, signingPath ?? urlPath, expiry);
  return `${baseUrl}${urlPath}?ex=${params.ex}&is=${params.is}&hm=${params.hm}`;
}

interface DirectoryStats {
  fileCount: number;
  totalSize: number;
  files: Array<{
    filename: string;
    size: number;
    createdAt: Date;
  }>;
}

async function getDirectoryStats(
  dirPath: string,
  includeFiles = false,
  limit = 50,
  offset = 0,
): Promise<DirectoryStats> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile());

    let totalSize = 0;
    const fileDetails: DirectoryStats["files"] = [];

    for (const file of files) {
      const filePath = join(dirPath, file.name);
      const stats = await stat(filePath);
      totalSize += stats.size;

      if (includeFiles) {
        fileDetails.push({
          filename: file.name,
          size: stats.size,
          createdAt: stats.birthtime,
        });
      }
    }

    fileDetails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paginatedFiles = fileDetails.slice(offset, offset + limit);

    return {
      fileCount: files.length,
      totalSize,
      files: paginatedFiles,
    };
  } catch {
    return { fileCount: 0, totalSize: 0, files: [] };
  }
}

async function getChapterMediaStats(): Promise<{
  chapterCount: number;
  fileCount: number;
  totalSize: number;
}> {
  try {
    const seriesDirs = await readdir(UPLOAD_DIR, { withFileTypes: true });
    let chapterCount = 0;
    let fileCount = 0;
    let totalSize = 0;

    for (const seriesDir of seriesDirs) {
      if (
        !seriesDir.isDirectory() ||
        ["covers", "pages", "temp"].includes(seriesDir.name)
      ) {
        continue;
      }

      const seriesPath = join(UPLOAD_DIR, seriesDir.name);
      const chapterDirs = await readdir(seriesPath, { withFileTypes: true });

      for (const chapterDir of chapterDirs) {
        if (!chapterDir.isDirectory()) continue;
        chapterCount++;

        const chapterPath = join(seriesPath, chapterDir.name);
        const files = await readdir(chapterPath, { withFileTypes: true });

        for (const file of files) {
          if (!file.isFile()) continue;
          fileCount++;
          const stats = await stat(join(chapterPath, file.name));
          totalSize += stats.size;
        }
      }
    }

    return { chapterCount, fileCount, totalSize };
  } catch {
    return { chapterCount: 0, fileCount: 0, totalSize: 0 };
  }
}

export const statsRoutes = new Hono()
  .get("/", requireRole("admin"), async (c) => {
    const result = await getOrSet(
      CacheKey.mediaStats(),
      TTL.MEDIA_STATS,
      async () => {
        const [coversStats, pagesStats, chapterStats, tempStats] =
          await Promise.all([
            getDirectoryStats(COVERS_DIR),
            getDirectoryStats(PAGES_DIR),
            getChapterMediaStats(),
            getDirectoryStats(TEMP_DIR),
          ]);

        const totalSize =
          coversStats.totalSize +
          pagesStats.totalSize +
          chapterStats.totalSize +
          tempStats.totalSize;

        return {
          totalSize,
          covers: {
            fileCount: coversStats.fileCount,
            totalSize: coversStats.totalSize,
          },
          pages: {
            fileCount: pagesStats.fileCount,
            totalSize: pagesStats.totalSize,
          },
          chapters: {
            chapterCount: chapterStats.chapterCount,
            fileCount: chapterStats.fileCount,
            totalSize: chapterStats.totalSize,
          },
          temp: {
            fileCount: tempStats.fileCount,
            totalSize: tempStats.totalSize,
          },
        };
      },
    );

    return c.json(result);
  })

  .get("/covers", requireRole("admin"), async (c) => {
    const limit = Number(c.req.query("limit")) || 50;
    const offset = Number(c.req.query("offset")) || 0;

    const result = await getOrSet(
      CacheKey.mediaCovers(limit, offset),
      TTL.MEDIA_STATS,
      async () => {
        const [stats, baseUrl] = await Promise.all([
          getDirectoryStats(COVERS_DIR, true, limit, offset),
          getBaseUrl(),
        ]);

        return {
          data: stats.files.map((f) => ({
            filename: f.filename,
            size: f.size,
            createdAt: f.createdAt,
            url: `${baseUrl}/api/media/images/covers/${f.filename}`,
          })),
          total: stats.fileCount,
        };
      },
    );

    return c.json(result);
  })

  .get("/pages", requireRole("admin"), async (c) => {
    const limit = Number(c.req.query("limit")) || 50;
    const offset = Number(c.req.query("offset")) || 0;

    const result = await getOrSet(
      CacheKey.mediaPages(limit, offset),
      TTL.MEDIA_STATS,
      async () => {
        const [stats, baseUrl, signingConfig] = await Promise.all([
          getDirectoryStats(PAGES_DIR, true, limit, offset),
          getBaseUrl(),
          getSigningConfig(),
        ]);

        return {
          data: stats.files.map((f) => {
            const signingPath = `/images/pages/${f.filename}`;
            const urlPath = `/api/media/images/pages/${f.filename}`;

            const url = signingConfig.enabled
              ? buildSignedUrl(
                  baseUrl,
                  urlPath,
                  signingConfig.secret,
                  signingConfig.expiry,
                  signingPath,
                )
              : `${baseUrl}${urlPath}`;

            return {
              filename: f.filename,
              size: f.size,
              createdAt: f.createdAt,
              url,
            };
          }),
          total: stats.fileCount,
        };
      },
    );

    return c.json(result);
  })

  .delete("/temp", requireRole("admin"), async (c) => {
    try {
      const { rm, mkdir } = await import("node:fs/promises");
      await rm(TEMP_DIR, { recursive: true, force: true });
      await mkdir(TEMP_DIR, { recursive: true });
      await delPattern(CachePattern.allMediaStats());
      return c.json({ cleared: true });
    } catch {
      return c.json({ cleared: false, error: "Failed to clear temp" }, 500);
    }
  });
