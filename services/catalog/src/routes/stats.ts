import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { requireAdmin } from "@arcle/auth-server";
import { CacheKey, getOrSet, TTL } from "@arcle/cache";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { chapters, db, series } from "../db";

const UPLOAD_DIR = Bun.env.UPLOAD_DIR || "./uploads";

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else {
        const stats = await stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch {
    return 0;
  }

  return totalSize;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

type RecentActivity = {
  type: "chapter" | "series";
  id: string;
  title: string;
  seriesId?: string;
  createdAt: Date;
};

type AdminStats = {
  totalViews: number;
  storageUsed: string;
  storageBytes: number;
  recentActivity: RecentActivity[];
};

async function fetchStats(): Promise<AdminStats> {
  const [viewsResult, storageBytes, recentSeries, recentChapters] =
    await Promise.all([
      db
        .select({
          totalSeriesViews: sql<number>`COALESCE(SUM(${series.viewCount}), 0)`,
          totalChapterViews: sql<number>`COALESCE(SUM(${chapters.viewCount}), 0)`,
        })
        .from(series)
        .leftJoin(chapters, sql`${chapters.seriesId} = ${series.id}`),

      getDirectorySize(UPLOAD_DIR),

      db
        .select({
          id: series.id,
          title: series.title,
          createdAt: series.createdAt,
        })
        .from(series)
        .orderBy(sql`${series.createdAt} DESC`)
        .limit(5),

      db
        .select({
          id: chapters.id,
          seriesId: chapters.seriesId,
          number: chapters.number,
          title: chapters.title,
          createdAt: chapters.createdAt,
        })
        .from(chapters)
        .orderBy(sql`${chapters.createdAt} DESC`)
        .limit(5),
    ]);

  const totalViews =
    Number(viewsResult[0]?.totalSeriesViews ?? 0) +
    Number(viewsResult[0]?.totalChapterViews ?? 0);

  const recentActivity: RecentActivity[] = [
    ...recentChapters.map((ch) => ({
      type: "chapter" as const,
      id: ch.id,
      title: ch.title || `Chapter ${ch.number}`,
      seriesId: ch.seriesId,
      createdAt: ch.createdAt,
    })),
    ...recentSeries.map((s) => ({
      type: "series" as const,
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return {
    totalViews,
    storageUsed: formatBytes(storageBytes),
    storageBytes,
    recentActivity,
  };
}

export const statsRoutes = new Hono()
  .use("*", requireAdmin())
  .get("/", async (c) => {
    const stats = await getOrSet(
      CacheKey.adminStats(),
      TTL.ADMIN_STATS,
      fetchStats,
    );

    return c.json(stats);
  });
