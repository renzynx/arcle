import {
  CATALOG_EVENTS,
  ChapterCreatedPayload,
  ChapterDeletedPayload,
  SeriesCreatedPayload,
  SeriesDeletedPayload,
  SeriesUpdatedPayload,
} from "@arcle/events";
import { getPubSub } from "@arcle/events/pubsub";
import { createLogger } from "@arcle/logger";
import {
  createSearchProvider,
  getSearchConfig,
  type LatestChapter,
  type SeriesDocument,
} from "@arcle/search";
import { count, desc, eq } from "drizzle-orm";
import { chapters, db, series, seriesGenres } from "../db/index.ts";

const log = createLogger({ name: "catalog:search-sync" });

const config = getSearchConfig();
const searchProvider = createSearchProvider({
  db,
  series,
  chapters,
  seriesGenres,
  config,
});

async function fetchSeriesDocument(
  seriesId: string,
): Promise<SeriesDocument | null> {
  const [seriesData] = await db
    .select({
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description,
      author: series.author,
      status: series.status,
      coverImage: series.coverImage,
      viewCount: series.viewCount,
      bookmarkCount: series.bookmarkCount,
      ratingAvg: series.ratingAvg,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    })
    .from(series)
    .where(eq(series.id, seriesId))
    .limit(1);

  if (!seriesData) return null;

  const [chapterCountResult, latestChapterResult, genresResult] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(chapters)
        .where(eq(chapters.seriesId, seriesId)),
      db
        .select({
          id: chapters.id,
          number: chapters.number,
          title: chapters.title,
          slug: chapters.slug,
          createdAt: chapters.createdAt,
        })
        .from(chapters)
        .where(eq(chapters.seriesId, seriesId))
        .orderBy(desc(chapters.number))
        .limit(1),
      db
        .select({ genreId: seriesGenres.genreId })
        .from(seriesGenres)
        .where(eq(seriesGenres.seriesId, seriesId)),
    ]);

  const chapterCount = chapterCountResult[0]?.count ?? 0;
  const latestChapter: LatestChapter | null = latestChapterResult[0]
    ? {
        id: latestChapterResult[0].id,
        number: latestChapterResult[0].number,
        title: latestChapterResult[0].title,
        slug: latestChapterResult[0].slug,
        createdAt: latestChapterResult[0].createdAt.getTime(),
      }
    : null;

  return {
    id: seriesData.id,
    slug: seriesData.slug,
    title: seriesData.title,
    description: seriesData.description,
    author: seriesData.author,
    status: seriesData.status,
    coverImage: seriesData.coverImage,
    viewCount: seriesData.viewCount,
    bookmarkCount: seriesData.bookmarkCount,
    ratingAvg: Number(seriesData.ratingAvg),
    chapterCount,
    genreIds: genresResult.map((g) => g.genreId),
    latestChapter,
    createdAt: seriesData.createdAt.getTime(),
    updatedAt: seriesData.updatedAt.getTime(),
  };
}

async function indexSeries(seriesId: string) {
  if (config.provider !== "typesense") return;

  try {
    const doc = await fetchSeriesDocument(seriesId);
    if (doc) {
      await searchProvider.index(doc);
      log.debug("Indexed series", { seriesId });
    }
  } catch (error) {
    log.error("Failed to index series", { seriesId, error });
  }
}

async function removeSeries(seriesId: string) {
  if (config.provider !== "typesense") return;

  try {
    await searchProvider.remove(seriesId);
    log.debug("Removed series from index", { seriesId });
  } catch (error) {
    log.error("Failed to remove series from index", { seriesId, error });
  }
}

export function setupSearchSyncSubscribers() {
  if (config.provider !== "typesense") {
    log.info("Search sync disabled - using PostgreSQL provider");
    return;
  }

  log.info("Setting up Typesense search sync subscribers");
  const pubsub = getPubSub();

  searchProvider.ensureCollection().catch((err) => {
    log.error("Failed to ensure Typesense collection", { error: err });
  });

  pubsub.subscribe(
    CATALOG_EVENTS.SERIES_CREATED,
    SeriesCreatedPayload,
    async (payload) => {
      log.info("Series created, indexing", { seriesId: payload.id });
      await indexSeries(payload.id);
    },
  );

  pubsub.subscribe(
    CATALOG_EVENTS.SERIES_UPDATED,
    SeriesUpdatedPayload,
    async (payload) => {
      log.info("Series updated, re-indexing", { seriesId: payload.id });
      await indexSeries(payload.id);
    },
  );

  pubsub.subscribe(
    CATALOG_EVENTS.SERIES_DELETED,
    SeriesDeletedPayload,
    async (payload) => {
      log.info("Series deleted, removing from index", { seriesId: payload.id });
      await removeSeries(payload.id);
    },
  );

  pubsub.subscribe(
    CATALOG_EVENTS.CHAPTER_CREATED,
    ChapterCreatedPayload,
    async (payload) => {
      log.info("Chapter created, updating series index", {
        seriesId: payload.seriesId,
      });
      await indexSeries(payload.seriesId);
    },
  );

  pubsub.subscribe(
    CATALOG_EVENTS.CHAPTER_DELETED,
    ChapterDeletedPayload,
    async (payload) => {
      log.info("Chapter deleted, updating series index", {
        seriesId: payload.seriesId,
      });
      await indexSeries(payload.seriesId);
    },
  );
}

export async function reindexAllSeries(): Promise<number> {
  if (config.provider !== "typesense") {
    log.warn("Reindex not needed for PostgreSQL provider");
    return 0;
  }

  log.info("Starting full reindex of all series");

  const count = await searchProvider.reindexAll(async () => {
    const allSeriesIds = await db.select({ id: series.id }).from(series);

    const docs: SeriesDocument[] = [];
    for (const { id } of allSeriesIds) {
      const doc = await fetchSeriesDocument(id);
      if (doc) docs.push(doc);
    }
    return docs;
  });

  log.info("Full reindex complete", { count });
  return count;
}
