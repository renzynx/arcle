import {
  CATALOG_EVENTS,
  type ChapterCreatedPayload,
  type ChapterDeletedPayload,
  type ChapterUpdatedPayload,
  type CoverCleanupPayload,
  MEDIA_EVENTS,
  type PageCreatedPayload,
  type PageDeletedPayload,
  type PageUpdatedPayload,
  SETTINGS_EVENTS,
  type SeriesCreatedPayload,
  type SeriesDeletedPayload,
  type SeriesUpdatedPayload,
  type SigningConfigChangedPayload,
} from "@arcle/events";
import { getPubSub } from "@arcle/events/pubsub";

export async function publishSeriesCreated(payload: SeriesCreatedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.SERIES_CREATED, payload);
}

export async function publishSeriesUpdated(payload: SeriesUpdatedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.SERIES_UPDATED, payload);
}

export async function publishSeriesDeleted(payload: SeriesDeletedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.SERIES_DELETED, payload);
}

export async function publishChapterCreated(payload: ChapterCreatedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.CHAPTER_CREATED, payload);
}

export async function publishChapterUpdated(payload: ChapterUpdatedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.CHAPTER_UPDATED, payload);
}

export async function publishChapterDeleted(payload: ChapterDeletedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.CHAPTER_DELETED, payload);
}

export async function publishPageCreated(payload: PageCreatedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.PAGE_CREATED, payload);
}

export async function publishPageUpdated(payload: PageUpdatedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.PAGE_UPDATED, payload);
}

export async function publishPageDeleted(payload: PageDeletedPayload) {
  await getPubSub().publish(CATALOG_EVENTS.PAGE_DELETED, payload);
}

export async function publishCoverCleanup(payload: CoverCleanupPayload) {
  await getPubSub().publish(MEDIA_EVENTS.COVER_CLEANUP, payload);
}

export async function publishSigningConfigChanged(
  payload: SigningConfigChangedPayload,
) {
  await getPubSub().publish(SETTINGS_EVENTS.SIGNING_CONFIG_CHANGED, payload);
}
