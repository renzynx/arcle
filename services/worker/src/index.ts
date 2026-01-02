import { closeRedisClient, createRedisClient } from "@arcle/events/redis";
import { createLogger } from "@arcle/logger";
import { initQueueConnection } from "@arcle/queue";
import { createImageWorker } from "./workers/images.ts";
import { cleanupOrphanedImages } from "./workers/media-cleanup.ts";
import { createViewWorker, syncViewsToDB } from "./workers/views.ts";

const log = createLogger({ name: "worker" });

const REDIS_URL = Bun.env.REDIS_URL || "redis://localhost:6379";
const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const MEDIA_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

initQueueConnection(REDIS_URL);

const redis = createRedisClient(REDIS_URL);

const viewWorker = createViewWorker(redis);
const imageWorker = createImageWorker();

log.success("Worker service started");
log.info("View worker: listening");
log.info("Image worker: listening");
log.info("Media cleanup: enabled");

const syncInterval = setInterval(async () => {
  try {
    const result = await syncViewsToDB(redis);
    if (result.seriesSynced > 0 || result.chaptersSynced > 0) {
      log.info(
        `Synced views to DB: ${result.seriesSynced} series, ${result.chaptersSynced} chapters`,
      );
    }
  } catch (err) {
    log.error("Failed to sync views to DB:", err);
  }
}, SYNC_INTERVAL_MS);

const mediaCleanupInterval = setInterval(async () => {
  try {
    const result = await cleanupOrphanedImages();
    const total =
      result.orphanedCovers + result.orphanedPages + result.tempFiles;
    if (total > 0) {
      log.info(
        `Media cleanup: ${result.orphanedCovers} covers, ${result.orphanedPages} pages, ${result.tempFiles} temp files`,
      );
    }
  } catch (err) {
    log.error("Failed to cleanup orphaned images:", err);
  }
}, MEDIA_CLEANUP_INTERVAL_MS);

async function shutdown() {
  log.warn("Shutting down worker service...");
  clearInterval(syncInterval);
  clearInterval(mediaCleanupInterval);

  try {
    await syncViewsToDB(redis);
    log.success("Final view sync completed");
  } catch (err) {
    log.error("Failed final view sync:", err);
  }

  await Promise.all([viewWorker.close(), imageWorker.close()]);
  await closeRedisClient();
  log.success("Worker service stopped");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

setInterval(() => {}, 1000);
