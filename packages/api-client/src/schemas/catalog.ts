import { z } from "zod";

export const SeriesStatus = z.enum([
  "ongoing",
  "completed",
  "hiatus",
  "cancelled",
]);

export const Genre = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const Chapter = z.object({
  id: z.string(),
  seriesId: z.string(),
  number: z.number(),
  title: z.string().nullable(),
  slug: z.string(),
  createdBy: z.string(),
  updatedBy: z.string().nullable(),
  viewCount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const Series = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  author: z.string().nullable(),
  status: SeriesStatus,
  coverImage: z.string().nullable(),
  createdBy: z.string(),
  updatedBy: z.string().nullable(),
  viewCount: z.number(),
  chapterCount: z.number().optional(),
  bookmarkCount: z.number(),
  ratingAvg: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  latestChapter: Chapter.nullable().optional(),
});

export const Page = z.object({
  id: z.string(),
  chapterId: z.string(),
  number: z.number(),
  imageUrl: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const SeriesWithChapters = Series.extend({
  chapters: z.array(Chapter),
  genres: z.array(Genre).optional(),
});

export const ChapterWithPages = Chapter.extend({
  pages: z.array(Page),
});

export const ChapterWithSeries = Chapter.extend({
  series: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
  }),
});

export const CreateSeriesInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  author: z.string().optional(),
  status: SeriesStatus.default("ongoing"),
  coverImage: z.string().optional(),
  genreIds: z.array(z.string()).optional(),
});

export const UpdateSeriesInput = CreateSeriesInput.partial();

export const CreateChapterInput = z.object({
  seriesId: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().optional(),
});

export const UpdateChapterInput = z.object({
  number: z.number().int().positive().optional(),
  title: z.string().optional(),
});

export const CreatePageInput = z.object({
  chapterId: z.string().min(1),
  number: z.number().int().positive(),
  imageUrl: z.string(),
});

export const CreatePagesInput = z.object({
  chapterId: z.string().min(1),
  pages: z.array(
    z.object({
      number: z.number().int().positive(),
      imageUrl: z.string(),
    }),
  ),
});

export const UpdatePageInput = z.object({
  number: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
});

export const DeleteByChapterInput = z.object({
  chapterId: z.string().min(1),
});

export const CreateGenreInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const UpdateGenreInput = CreateGenreInput.partial();

export type SeriesStatus = z.infer<typeof SeriesStatus>;
export type Genre = z.infer<typeof Genre>;
export type Series = z.infer<typeof Series>;
export type Chapter = z.infer<typeof Chapter>;
export type Page = z.infer<typeof Page>;
export type SeriesWithChapters = z.infer<typeof SeriesWithChapters>;
export type ChapterWithPages = z.infer<typeof ChapterWithPages>;
export type ChapterWithSeries = z.infer<typeof ChapterWithSeries>;
export type CreateSeriesInput = z.infer<typeof CreateSeriesInput>;
export type UpdateSeriesInput = z.infer<typeof UpdateSeriesInput>;
export type CreateChapterInput = z.infer<typeof CreateChapterInput>;
export type UpdateChapterInput = z.infer<typeof UpdateChapterInput>;
export type CreatePageInput = z.infer<typeof CreatePageInput>;
export type CreatePagesInput = z.infer<typeof CreatePagesInput>;
export type UpdatePageInput = z.infer<typeof UpdatePageInput>;
export type DeleteByChapterInput = z.infer<typeof DeleteByChapterInput>;
export type CreateGenreInput = z.infer<typeof CreateGenreInput>;
export type UpdateGenreInput = z.infer<typeof UpdateGenreInput>;

export type SeriesListResponse = { data: Series[]; total: number };
export type ChaptersListResponse = { data: ChapterWithSeries[]; total: number };
export type SeriesChaptersResponse = { data: Chapter[]; total: number };
export type SeriesResponse = SeriesWithChapters;
export type ChaptersResponse = Chapter[];
export type ChapterResponse = ChapterWithPages;
export type PagesResponse = Page[];
export type GenresResponse = Genre[];
