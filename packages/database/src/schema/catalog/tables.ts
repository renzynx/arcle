import { createId } from "@paralleldrive/cuid2";
import {
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", [
  "ongoing",
  "completed",
  "hiatus",
  "cancelled",
]);

export const series = pgTable(
  "series",
  {
    id: text("id")
      .primaryKey()
      .$default(() => createId()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    author: text("author"),
    status: statusEnum("status").notNull().default("ongoing"),
    coverImage: text("cover_image"),

    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),

    viewCount: integer("view_count").default(0).notNull(),
    bookmarkCount: integer("bookmark_count").default(0).notNull(),
    ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 })
      .default("0.00")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("search_idx").on(table.title),
    index("slug_idx").on(table.slug),
  ],
);

export const chapters = pgTable(
  "chapters",
  {
    id: text("id")
      .primaryKey()
      .$default(() => createId()),
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title"),
    slug: text("slug").notNull(),

    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),

    viewCount: integer("view_count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("chapters_series_idx").on(table.seriesId),
    index("chapters_number_idx").on(table.seriesId, table.number),
    index("chapters_slug_idx").on(table.seriesId, table.slug),
  ],
);

export const pages = pgTable(
  "pages",
  {
    id: text("id")
      .primaryKey()
      .$default(() => createId()),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    imageUrl: text("image_url").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("pages_chapter_idx").on(table.chapterId),
    index("pages_order_idx").on(table.chapterId, table.number),
  ],
);

export const genres = pgTable(
  "genres",
  {
    id: text("id")
      .primaryKey()
      .$default(() => createId()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("genres_name_idx").on(table.name),
    index("genres_slug_idx").on(table.slug),
  ],
);

export const seriesGenres = pgTable(
  "series_genres",
  {
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    genreId: text("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.seriesId, table.genreId] }),
    index("series_genres_series_idx").on(table.seriesId),
    index("series_genres_genre_idx").on(table.genreId),
  ],
);

export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Genre = typeof genres.$inferSelect;
export type NewGenre = typeof genres.$inferInsert;
export type SeriesGenre = typeof seriesGenres.$inferSelect;
export type NewSeriesGenre = typeof seriesGenres.$inferInsert;
