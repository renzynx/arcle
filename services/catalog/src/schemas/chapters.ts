import { z } from "zod";

export const chaptersListQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(["latest", "oldest", "number"]).default("latest"),
  seriesId: z.string().optional(),
});

export const chapterBySlugParam = z.object({
  seriesSlug: z.string().min(1),
  chapterNumber: z.coerce.number().int().positive(),
});

export const createChapterBody = z.object({
  seriesId: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().optional(),
});

export const updateChapterBody = z.object({
  number: z.number().int().positive().optional(),
  title: z.string().optional(),
});
