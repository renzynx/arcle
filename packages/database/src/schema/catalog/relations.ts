import { relations } from "drizzle-orm";
import { chapters, genres, pages, series, seriesGenres } from "./tables.ts";

export const seriesRelations = relations(series, ({ many }) => ({
  chapters: many(chapters),
  seriesGenres: many(seriesGenres),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  series: one(series, {
    fields: [chapters.seriesId],
    references: [series.id],
  }),
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  chapter: one(chapters, {
    fields: [pages.chapterId],
    references: [chapters.id],
  }),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  seriesGenres: many(seriesGenres),
}));

export const seriesGenresRelations = relations(seriesGenres, ({ one }) => ({
  series: one(series, {
    fields: [seriesGenres.seriesId],
    references: [series.id],
  }),
  genre: one(genres, {
    fields: [seriesGenres.genreId],
    references: [genres.id],
  }),
}));
