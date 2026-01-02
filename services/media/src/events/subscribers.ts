import { rm, unlink } from "node:fs/promises";
import { join } from "node:path";
import {
  CATALOG_EVENTS,
  ChapterDeletedPayload,
  CoverCleanupPayload,
  MEDIA_EVENTS,
  SeriesDeletedPayload,
} from "@arcle/events";
import { getPubSub } from "@arcle/events/pubsub";
import { createLogger } from "@arcle/logger";

const log = createLogger({ name: "media:events" });

const UPLOAD_DIR = Bun.env.UPLOAD_DIR || "./uploads";

export function setupSubscribers() {
  const pubsub = getPubSub();

  pubsub.subscribe(
    CATALOG_EVENTS.CHAPTER_DELETED,
    ChapterDeletedPayload,
    async (payload) => {
      const chapterDir = join(UPLOAD_DIR, payload.seriesId, payload.id);

      try {
        await rm(chapterDir, { recursive: true, force: true });
        log.info(`Cleaned up images for chapter ${payload.id}`);
      } catch (error) {
        log.error(
          `Failed to clean up images for chapter ${payload.id}:`,
          error,
        );
      }
    },
  );

  pubsub.subscribe(
    CATALOG_EVENTS.SERIES_DELETED,
    SeriesDeletedPayload,
    async (payload) => {
      const seriesDir = join(UPLOAD_DIR, payload.id);

      try {
        await rm(seriesDir, { recursive: true, force: true });
        log.info(`Cleaned up images for series ${payload.id}`);
      } catch (error) {
        log.error(`Failed to clean up images for series ${payload.id}:`, error);
      }
    },
  );

  pubsub.subscribe(
    MEDIA_EVENTS.COVER_CLEANUP,
    CoverCleanupPayload,
    async (payload) => {
      const coverPath = join(UPLOAD_DIR, "covers", payload.filename);

      try {
        await unlink(coverPath);
        log.info(`Cleaned up orphaned cover: ${payload.filename}`);
      } catch (error) {
        log.error(`Failed to clean up cover ${payload.filename}:`, error);
      }
    },
  );
}
