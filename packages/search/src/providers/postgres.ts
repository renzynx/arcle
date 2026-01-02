import type * as schema from "@arcle/database/schema";
import {
  and,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  notExists,
  sql,
} from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import type {
  LatestChapter,
  SearchProvider,
  SearchQuery,
  SearchResult,
  SeriesDocument,
} from "../types.ts";

type DrizzleDB = BunSQLDatabase<typeof schema>;

interface PostgresProviderOptions {
  db: DrizzleDB;
  series: typeof schema.series;
  chapters: typeof schema.chapters;
  seriesGenres: typeof schema.seriesGenres;
}

export class PostgresSearchProvider implements SearchProvider {
  readonly type = "postgres" as const;

  private db: DrizzleDB;
  private series: typeof schema.series;
  private chapters: typeof schema.chapters;
  private seriesGenres: typeof schema.seriesGenres;

  constructor(options: PostgresProviderOptions) {
    this.db = options.db;
    this.series = options.series;
    this.chapters = options.chapters;
    this.seriesGenres = options.seriesGenres;
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const {
      q,
      limit,
      offset,
      sort,
      status,
      includeGenres,
      excludeGenres,
      genreMode,
      minChapters,
      maxChapters,
    } = query;

    const conditions: ReturnType<typeof and>[] = [];

    if (q?.trim()) {
      conditions.push(ilike(this.series.title, `%${q.trim()}%`));
    }

    if (status) {
      conditions.push(eq(this.series.status, status));
    }

    if (includeGenres && includeGenres.length > 0) {
      if (genreMode === "all") {
        for (const genreId of includeGenres) {
          conditions.push(
            exists(
              this.db
                .select({ one: sql`1` })
                .from(this.seriesGenres)
                .where(
                  and(
                    eq(this.seriesGenres.seriesId, this.series.id),
                    eq(this.seriesGenres.genreId, genreId),
                  ),
                ),
            ),
          );
        }
      } else {
        conditions.push(
          exists(
            this.db
              .select({ one: sql`1` })
              .from(this.seriesGenres)
              .where(
                and(
                  eq(this.seriesGenres.seriesId, this.series.id),
                  sql`${this.seriesGenres.genreId} IN (${sql.join(
                    includeGenres.map((id) => sql`${id}`),
                    sql`, `,
                  )})`,
                ),
              ),
          ),
        );
      }
    }

    if (excludeGenres && excludeGenres.length > 0) {
      for (const genreId of excludeGenres) {
        conditions.push(
          notExists(
            this.db
              .select({ one: sql`1` })
              .from(this.seriesGenres)
              .where(
                and(
                  eq(this.seriesGenres.seriesId, this.series.id),
                  eq(this.seriesGenres.genreId, genreId),
                ),
              ),
          ),
        );
      }
    }

    const chapterCountSq = this.db
      .select({ count: count() })
      .from(this.chapters)
      .where(eq(this.chapters.seriesId, this.series.id));

    if (minChapters !== undefined) {
      conditions.push(gte(sql`(${chapterCountSq})`, minChapters));
    }

    if (maxChapters !== undefined) {
      conditions.push(lte(sql`(${chapterCountSq})`, maxChapters));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = (() => {
      switch (sort) {
        case "popular":
          return desc(this.series.viewCount);
        case "alphabetical":
          return this.series.title;
        case "rating":
          return desc(this.series.ratingAvg);
        default:
          return desc(this.series.createdAt);
      }
    })();

    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: this.series.id,
          slug: this.series.slug,
          title: this.series.title,
          description: this.series.description,
          author: this.series.author,
          status: this.series.status,
          coverImage: this.series.coverImage,
          viewCount: this.series.viewCount,
          bookmarkCount: this.series.bookmarkCount,
          ratingAvg: this.series.ratingAvg,
          createdAt: this.series.createdAt,
          updatedAt: this.series.updatedAt,
          chapterCount: sql<number>`(${chapterCountSq})`.as("chapter_count"),
        })
        .from(this.series)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(this.series).where(whereClause),
    ]);

    const seriesIds = items.map((s) => s.id);

    const [genreData, latestChapters] = await Promise.all([
      seriesIds.length > 0
        ? this.db
            .select({
              seriesId: this.seriesGenres.seriesId,
              genreId: this.seriesGenres.genreId,
            })
            .from(this.seriesGenres)
            .where(inArray(this.seriesGenres.seriesId, seriesIds))
        : Promise.resolve([]),
      seriesIds.length > 0
        ? this.db
            .select({
              id: this.chapters.id,
              seriesId: this.chapters.seriesId,
              number: this.chapters.number,
              title: this.chapters.title,
              slug: this.chapters.slug,
              createdAt: this.chapters.createdAt,
            })
            .from(this.chapters)
            .where(inArray(this.chapters.seriesId, seriesIds))
            .orderBy(desc(this.chapters.number))
        : Promise.resolve([]),
    ]);

    const genreMap = new Map<string, string[]>();
    for (const g of genreData) {
      const existing = genreMap.get(g.seriesId) || [];
      existing.push(g.genreId);
      genreMap.set(g.seriesId, existing);
    }

    const latestChapterMap = new Map<string, LatestChapter>();
    for (const ch of latestChapters) {
      if (!latestChapterMap.has(ch.seriesId)) {
        latestChapterMap.set(ch.seriesId, {
          id: ch.id,
          number: ch.number,
          title: ch.title,
          slug: ch.slug,
          createdAt: ch.createdAt.getTime(),
        });
      }
    }

    const hits: SeriesDocument[] = items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      author: item.author,
      status: item.status,
      coverImage: item.coverImage,
      viewCount: item.viewCount,
      bookmarkCount: item.bookmarkCount,
      ratingAvg: Number(item.ratingAvg),
      chapterCount: item.chapterCount,
      genreIds: genreMap.get(item.id) || [],
      latestChapter: latestChapterMap.get(item.id) || null,
      createdAt: item.createdAt.getTime(),
      updatedAt: item.updatedAt.getTime(),
    }));

    return {
      hits,
      total: countResult[0]?.total ?? 0,
    };
  }

  async index(_doc: SeriesDocument): Promise<void> {}

  async indexBatch(_docs: SeriesDocument[]): Promise<void> {}

  async remove(_id: string): Promise<void> {}

  async reindexAll(_getDocs: () => Promise<SeriesDocument[]>): Promise<number> {
    return 0;
  }

  async ensureCollection(): Promise<void> {}

  async isAvailable(): Promise<boolean> {
    try {
      await this.db.select({ one: sql`1` }).from(this.series).limit(1);
      return true;
    } catch {
      return false;
    }
  }
}
