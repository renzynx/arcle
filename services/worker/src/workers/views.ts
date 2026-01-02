import { getSetting } from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";
import { createLogger } from "@arcle/logger";
import {
  getConnectionOptions,
  QUEUE_NAMES,
  VIEW_REDIS_KEYS,
  type ViewJobData,
} from "@arcle/queue";
import { Worker } from "bullmq";
import { sql } from "drizzle-orm";
import type { Redis } from "ioredis";
import ms from "ms";
import { chapters, db, series } from "../db/index.ts";

const log = createLogger({ name: "worker:views" });

const DEFAULT_VIEW_TTL_MS = 86400000;

export function createViewWorker(redis: Redis): Worker<ViewJobData> {
  const worker = new Worker<ViewJobData>(
    QUEUE_NAMES.VIEWS,
    async (job) => {
      const { type, id, fingerprint } = job.data;

      const recentKey = VIEW_REDIS_KEYS.recentViewers(type, id);
      const alreadyViewed = await redis.sismember(recentKey, fingerprint);

      if (alreadyViewed) {
        return { counted: false, reason: "already-viewed" };
      }

      await redis.sadd(recentKey, fingerprint);

      const ttlSetting = await getSetting(SettingKey.VIEW_CACHE_TTL);
      const ttlMs = ttlSetting
        ? ms(ttlSetting as ms.StringValue) || DEFAULT_VIEW_TTL_MS
        : DEFAULT_VIEW_TTL_MS;
      const ttlSeconds = Math.floor(ttlMs / 1000);
      await redis.expire(recentKey, ttlSeconds);

      const pendingKey = VIEW_REDIS_KEYS.pendingCount(type, id);
      await redis.incr(pendingKey);

      const pendingSetKey =
        type === "series"
          ? VIEW_REDIS_KEYS.pendingSeriesSet()
          : VIEW_REDIS_KEYS.pendingChaptersSet();
      await redis.sadd(pendingSetKey, id);

      return { counted: true };
    },
    {
      connection: getConnectionOptions(),
      concurrency: 10,
    },
  );

  worker.on("failed", (job, err) => {
    log.error(`View job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

export async function syncViewsToDB(redis: Redis): Promise<{
  seriesSynced: number;
  chaptersSynced: number;
}> {
  let seriesSynced = 0;
  let chaptersSynced = 0;

  const pendingSeriesIds = await redis.smembers(
    VIEW_REDIS_KEYS.pendingSeriesSet(),
  );
  for (const id of pendingSeriesIds) {
    const pendingKey = VIEW_REDIS_KEYS.pendingCount("series", id);
    const countStr = await redis.getdel(pendingKey);
    const count = Number.parseInt(countStr || "0", 10);

    if (count > 0) {
      await db
        .update(series)
        .set({ viewCount: sql`${series.viewCount} + ${count}` })
        .where(sql`${series.id} = ${id}`);
      seriesSynced++;
    }

    await redis.srem(VIEW_REDIS_KEYS.pendingSeriesSet(), id);
  }

  const pendingChapterIds = await redis.smembers(
    VIEW_REDIS_KEYS.pendingChaptersSet(),
  );
  for (const id of pendingChapterIds) {
    const pendingKey = VIEW_REDIS_KEYS.pendingCount("chapter", id);
    const countStr = await redis.getdel(pendingKey);
    const count = Number.parseInt(countStr || "0", 10);

    if (count > 0) {
      await db
        .update(chapters)
        .set({ viewCount: sql`${chapters.viewCount} + ${count}` })
        .where(sql`${chapters.id} = ${id}`);
      chaptersSynced++;
    }

    await redis.srem(VIEW_REDIS_KEYS.pendingChaptersSet(), id);
  }

  return { seriesSynced, chaptersSynced };
}
