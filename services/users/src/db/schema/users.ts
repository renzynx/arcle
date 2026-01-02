import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const libraryStatus = pgEnum("library_status", [
  "reading",
  "completed",
  "on_hold",
  "dropped",
  "planning",
]);

export const library = pgTable(
  "library",
  {
    userId: text("user_id").notNull(),
    seriesId: text("series_id").notNull(),

    status: libraryStatus("status").notNull().default("planning"),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.seriesId],
    }),
    index("user_library_idx").on(table.userId),
  ],
);

export const history = pgTable(
  "history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    seriesId: text("series_id").notNull(),

    chapterNumber: decimal("chapter_number").notNull(),
    pageNumber: integer("page_number").default(1),

    readAt: timestamp("read_at").defaultNow().notNull(),
  },
  (table) => [unique("user_series_unique").on(table.userId, table.seriesId)],
);

export const ratings = pgTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    seriesId: text("series_id").notNull(),

    score: integer("score").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("unique_review").on(table.userId, table.seriesId)],
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  trackViews: boolean("track_views").notNull().default(true),
  trackHistory: boolean("track_history").notNull().default(true),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date())
    .defaultNow(),
});
