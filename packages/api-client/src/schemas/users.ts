import { z } from "zod";

export const LibraryStatus = z.enum([
  "reading",
  "completed",
  "on_hold",
  "dropped",
  "planning",
]);

export const LibraryItem = z.object({
  userId: z.string(),
  seriesId: z.string(),
  status: LibraryStatus,
  updatedAt: z.coerce.date(),
});

export const HistoryItem = z.object({
  id: z.string(),
  userId: z.string(),
  seriesId: z.string(),
  chapterNumber: z.string(),
  pageNumber: z.number().nullable(),
  readAt: z.coerce.date(),
});

export const RatingItem = z.object({
  id: z.string(),
  userId: z.string(),
  seriesId: z.string(),
  score: z.number(),
  createdAt: z.coerce.date(),
});

export const AddToLibraryInput = z.object({
  seriesId: z.string().min(1),
  status: LibraryStatus.default("planning"),
});

export const UpdateLibraryInput = z.object({
  status: LibraryStatus,
});

export const TrackHistoryInput = z.object({
  seriesId: z.string().min(1),
  chapterNumber: z.number().positive(),
  pageNumber: z.number().int().positive().optional(),
});

export const UpdateHistoryInput = z.object({
  chapterNumber: z.number().positive().optional(),
  pageNumber: z.number().int().positive().optional(),
});

export const AddRatingInput = z.object({
  seriesId: z.string().min(1),
  score: z.number().int().min(1).max(10),
});

export const UpdateRatingInput = z.object({
  score: z.number().int().min(1).max(10),
});

export type LibraryStatus = z.infer<typeof LibraryStatus>;
export type LibraryItem = z.infer<typeof LibraryItem>;
export type HistoryItem = z.infer<typeof HistoryItem>;
export type RatingItem = z.infer<typeof RatingItem>;
export type AddToLibraryInput = z.infer<typeof AddToLibraryInput>;
export type UpdateLibraryInput = z.infer<typeof UpdateLibraryInput>;
export type TrackHistoryInput = z.infer<typeof TrackHistoryInput>;
export type UpdateHistoryInput = z.infer<typeof UpdateHistoryInput>;
export type AddRatingInput = z.infer<typeof AddRatingInput>;
export type UpdateRatingInput = z.infer<typeof UpdateRatingInput>;

export type LibraryResponse = LibraryItem[];
export type HistoryResponse = HistoryItem[];
export type RatingsResponse = RatingItem[];

export const UserSettings = z.object({
  userId: z.string(),
  trackViews: z.boolean(),
  trackHistory: z.boolean(),
  updatedAt: z.coerce.date().optional(),
});

export const UpdateUserSettingsInput = z.object({
  trackViews: z.boolean().optional(),
  trackHistory: z.boolean().optional(),
});

export type UserSettings = z.infer<typeof UserSettings>;
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsInput>;
