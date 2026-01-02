import { z } from "zod";

export const MediaStats = z.object({
  totalSize: z.number(),
  covers: z.object({
    fileCount: z.number(),
    totalSize: z.number(),
  }),
  pages: z.object({
    fileCount: z.number(),
    totalSize: z.number(),
  }),
  chapters: z.object({
    chapterCount: z.number(),
    fileCount: z.number(),
    totalSize: z.number(),
  }),
  temp: z.object({
    fileCount: z.number(),
    totalSize: z.number(),
  }),
});

export const MediaFile = z.object({
  filename: z.string(),
  size: z.number(),
  createdAt: z.coerce.date(),
  url: z.string(),
});

export const MediaFilesResponse = z.object({
  data: z.array(MediaFile),
  total: z.number(),
});

export type MediaStats = z.infer<typeof MediaStats>;
export type MediaFile = z.infer<typeof MediaFile>;
export type MediaFilesResponse = z.infer<typeof MediaFilesResponse>;
