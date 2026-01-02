import { z } from "zod";

export const ViewJobDataSchema = z.object({
  type: z.enum(["series", "chapter"]),
  id: z.string(),
  fingerprint: z.string(),
  timestamp: z.number(),
});

export type ViewJobData = z.infer<typeof ViewJobDataSchema>;

export const VIEW_JOB_NAMES = {
  RECORD_VIEW: "record-view",
} as const;

export const ViewSyncJobDataSchema = z.object({});

export type ViewSyncJobData = z.infer<typeof ViewSyncJobDataSchema>;

export const VIEW_SYNC_JOB_NAMES = {
  SYNC_TO_DB: "sync-to-db",
} as const;

export const ImageJobDataSchema = z.object({
  type: z.enum(["cover", "page", "avatar"]),
  sourcePath: z.string(),
  outputPath: z.string(),
  filename: z.string(),
  quality: z.number().default(85),
});

export type ImageJobData = z.infer<typeof ImageJobDataSchema>;

export const IMAGE_JOB_NAMES = {
  CONVERT_TO_WEBP: "convert-to-webp",
} as const;

export const VIEW_REDIS_KEYS = {
  recentViewers: (type: "series" | "chapter", id: string) =>
    `view:${type}:${id}:recent`,

  pendingCount: (type: "series" | "chapter", id: string) =>
    `view:${type}:${id}:pending`,

  pendingSeriesSet: () => "view:series:pending-ids",
  pendingChaptersSet: () => "view:chapters:pending-ids",
} as const;

export const VIEW_TTL_SECONDS = {
  RECENT_VIEWER: 60 * 60 * 24,
} as const;
