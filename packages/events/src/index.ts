import superjson from "superjson";
import { z } from "zod";

export * from "./redis.ts";

export enum USER_EVENTS {
  CREATED = "user.created",
  UPDATED = "user.updated",
  DELETED = "user.deleted",
}

export enum CATALOG_EVENTS {
  SERIES_CREATED = "catalog.series.created",
  SERIES_UPDATED = "catalog.series.updated",
  SERIES_DELETED = "catalog.series.deleted",
  CHAPTER_CREATED = "catalog.chapter.created",
  CHAPTER_UPDATED = "catalog.chapter.updated",
  CHAPTER_DELETED = "catalog.chapter.deleted",
  PAGE_CREATED = "catalog.page.created",
  PAGE_UPDATED = "catalog.page.updated",
  PAGE_DELETED = "catalog.page.deleted",
}

export enum MEDIA_EVENTS {
  COVER_CLEANUP = "media.cover.cleanup",
}

export enum SETTINGS_EVENTS {
  SIGNING_CONFIG_CHANGED = "settings.signing.changed",
}

export const UserCreatedPayload = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const UserUpdatedPayload = z.object({
  id: z.string(),
  changes: z.record(z.string(), z.unknown()),
  updatedAt: z.coerce.date(),
});

export const UserDeletedPayload = z.object({
  id: z.string(),
  deletedAt: z.coerce.date(),
});

export type UserCreatedPayload = z.infer<typeof UserCreatedPayload>;
export type UserUpdatedPayload = z.infer<typeof UserUpdatedPayload>;
export type UserDeletedPayload = z.infer<typeof UserDeletedPayload>;

const SeriesStatus = z.enum(["ongoing", "completed", "hiatus", "cancelled"]);

export const SeriesCreatedPayload = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  status: SeriesStatus,
  createdBy: z.string(),
  createdAt: z.coerce.date(),
});

export const SeriesUpdatedPayload = z.object({
  id: z.string(),
  changes: z.record(z.string(), z.unknown()),
  updatedBy: z.string(),
  updatedAt: z.coerce.date(),
});

export const SeriesDeletedPayload = z.object({
  id: z.string(),
  deletedBy: z.string(),
  deletedAt: z.coerce.date(),
});

export const ChapterCreatedPayload = z.object({
  id: z.string(),
  seriesId: z.string(),
  number: z.number(),
  title: z.string().optional(),
  slug: z.string(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
});

export const ChapterUpdatedPayload = z.object({
  id: z.string(),
  seriesId: z.string(),
  changes: z.record(z.string(), z.unknown()),
  updatedBy: z.string(),
  updatedAt: z.coerce.date(),
});

export const ChapterDeletedPayload = z.object({
  id: z.string(),
  seriesId: z.string(),
  deletedBy: z.string(),
  deletedAt: z.coerce.date(),
});

export const PageCreatedPayload = z.object({
  id: z.string(),
  chapterId: z.string(),
  number: z.number(),
  imageUrl: z.string(),
  createdAt: z.coerce.date(),
});

export const PageUpdatedPayload = z.object({
  id: z.string(),
  chapterId: z.string(),
  changes: z.record(z.string(), z.unknown()),
  updatedAt: z.coerce.date(),
});

export const PageDeletedPayload = z.object({
  id: z.string(),
  chapterId: z.string(),
  deletedAt: z.coerce.date(),
});

export const CoverCleanupPayload = z.object({
  filename: z.string(),
});

export type SeriesCreatedPayload = z.infer<typeof SeriesCreatedPayload>;
export type SeriesUpdatedPayload = z.infer<typeof SeriesUpdatedPayload>;
export type SeriesDeletedPayload = z.infer<typeof SeriesDeletedPayload>;
export type ChapterCreatedPayload = z.infer<typeof ChapterCreatedPayload>;
export type ChapterUpdatedPayload = z.infer<typeof ChapterUpdatedPayload>;
export type ChapterDeletedPayload = z.infer<typeof ChapterDeletedPayload>;
export type PageCreatedPayload = z.infer<typeof PageCreatedPayload>;
export type PageUpdatedPayload = z.infer<typeof PageUpdatedPayload>;
export type PageDeletedPayload = z.infer<typeof PageDeletedPayload>;
export type CoverCleanupPayload = z.infer<typeof CoverCleanupPayload>;

export const SigningConfigChangedPayload = z.object({
  changedAt: z.coerce.date(),
});

export type SigningConfigChangedPayload = z.infer<
  typeof SigningConfigChangedPayload
>;

export function serialize<T>(data: T): string {
  return superjson.stringify(data);
}

export function deserialize<T>(data: string): T {
  return superjson.parse<T>(data);
}

export function parseEvent<T extends z.ZodType>(
  schema: T,
  data: string,
): z.infer<T> {
  const parsed = deserialize(data);
  return schema.parse(parsed);
}
