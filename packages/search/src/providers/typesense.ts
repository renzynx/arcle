import { logger } from "@arcle/logger";
import { Client } from "typesense";
import type {
  ImportResponse,
  SearchResponse,
  SearchResponseHit,
} from "typesense/lib/Typesense/Documents";
import type { SearchConfig } from "../config.ts";
import type {
  LatestChapter,
  SearchProvider,
  SearchQuery,
  SearchResult,
  SeriesDocument,
  SeriesStatus,
} from "../types.ts";

const COLLECTION_NAME = "series";

const SERIES_SCHEMA = {
  name: COLLECTION_NAME,
  fields: [
    { name: "id", type: "string" as const },
    { name: "slug", type: "string" as const },
    { name: "title", type: "string" as const },
    { name: "description", type: "string" as const, optional: true },
    { name: "author", type: "string" as const, optional: true },
    { name: "status", type: "string" as const, facet: true },
    { name: "coverImage", type: "string" as const, optional: true },
    { name: "viewCount", type: "int32" as const },
    { name: "bookmarkCount", type: "int32" as const },
    { name: "ratingAvg", type: "float" as const },
    { name: "chapterCount", type: "int32" as const },
    { name: "genreIds", type: "string[]" as const, facet: true },
    { name: "latestChapterId", type: "string" as const, optional: true },
    { name: "latestChapterNumber", type: "int32" as const, optional: true },
    { name: "latestChapterTitle", type: "string" as const, optional: true },
    { name: "latestChapterSlug", type: "string" as const, optional: true },
    { name: "latestChapterCreatedAt", type: "int64" as const, optional: true },
    { name: "createdAt", type: "int64" as const },
    { name: "updatedAt", type: "int64" as const },
  ],
  default_sorting_field: "createdAt" as const,
};

interface TypesenseDoc {
  id: string;
  slug: string;
  title: string;
  description?: string;
  author?: string;
  status: string;
  coverImage?: string;
  viewCount: number;
  bookmarkCount: number;
  ratingAvg: number;
  chapterCount: number;
  genreIds: string[];
  latestChapterId?: string;
  latestChapterNumber?: number;
  latestChapterTitle?: string;
  latestChapterSlug?: string;
  latestChapterCreatedAt?: number;
  createdAt: number;
  updatedAt: number;
}

function toTypesenseDoc(doc: SeriesDocument): TypesenseDoc {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? undefined,
    author: doc.author ?? undefined,
    status: doc.status,
    coverImage: doc.coverImage ?? undefined,
    viewCount: doc.viewCount,
    bookmarkCount: doc.bookmarkCount,
    ratingAvg: doc.ratingAvg,
    chapterCount: doc.chapterCount,
    genreIds: doc.genreIds,
    latestChapterId: doc.latestChapter?.id,
    latestChapterNumber: doc.latestChapter?.number,
    latestChapterTitle: doc.latestChapter?.title ?? undefined,
    latestChapterSlug: doc.latestChapter?.slug,
    latestChapterCreatedAt: doc.latestChapter?.createdAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function fromTypesenseDoc(doc: TypesenseDoc): SeriesDocument {
  let latestChapter: LatestChapter | null = null;
  if (doc.latestChapterId && doc.latestChapterNumber !== undefined) {
    latestChapter = {
      id: doc.latestChapterId,
      number: doc.latestChapterNumber,
      title: doc.latestChapterTitle ?? null,
      slug: doc.latestChapterSlug ?? "",
      createdAt: doc.latestChapterCreatedAt ?? 0,
    };
  }

  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? null,
    author: doc.author ?? null,
    status: doc.status as SeriesStatus,
    coverImage: doc.coverImage ?? null,
    viewCount: doc.viewCount,
    bookmarkCount: doc.bookmarkCount,
    ratingAvg: doc.ratingAvg,
    chapterCount: doc.chapterCount,
    genreIds: doc.genreIds,
    latestChapter,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class TypesenseSearchProvider implements SearchProvider {
  readonly type = "typesense" as const;
  private client: Client;

  constructor(config: NonNullable<SearchConfig["typesense"]>) {
    this.client = new Client({
      nodes: [
        {
          host: config.host,
          port: config.port,
          protocol: config.protocol,
        },
      ],
      apiKey: config.apiKey,
      connectionTimeoutSeconds: 5,
    });
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

    const filterParts: string[] = [];

    if (status) {
      filterParts.push(`status:=${status}`);
    }

    if (includeGenres && includeGenres.length > 0) {
      if (genreMode === "all") {
        for (const genreId of includeGenres) {
          filterParts.push(`genreIds:=${genreId}`);
        }
      } else {
        filterParts.push(`genreIds:=[${includeGenres.join(",")}]`);
      }
    }

    if (excludeGenres && excludeGenres.length > 0) {
      for (const genreId of excludeGenres) {
        filterParts.push(`genreIds:!=${genreId}`);
      }
    }

    if (minChapters !== undefined) {
      filterParts.push(`chapterCount:>=${minChapters}`);
    }

    if (maxChapters !== undefined) {
      filterParts.push(`chapterCount:<=${maxChapters}`);
    }

    const sortBy = (() => {
      switch (sort) {
        case "popular":
          return "viewCount:desc";
        case "alphabetical":
          return "title:asc";
        case "rating":
          return "ratingAvg:desc";
        default:
          return "createdAt:desc";
      }
    })();

    try {
      const result: SearchResponse<TypesenseDoc> = await this.client
        .collections<TypesenseDoc>(COLLECTION_NAME)
        .documents()
        .search({
          q: q?.trim() || "*",
          query_by: "title,author,description",
          filter_by:
            filterParts.length > 0 ? filterParts.join(" && ") : undefined,
          sort_by: sortBy,
          per_page: limit,
          page: Math.floor(offset / limit) + 1,
        });

      const hits: SeriesDocument[] = (result.hits || []).map(
        (hit: SearchResponseHit<TypesenseDoc>) =>
          fromTypesenseDoc(hit.document),
      );

      return {
        hits,
        total: result.found,
      };
    } catch (error) {
      logger.error("Typesense search failed", { error });
      throw error;
    }
  }

  async index(doc: SeriesDocument): Promise<void> {
    try {
      await this.client
        .collections<TypesenseDoc>(COLLECTION_NAME)
        .documents()
        .upsert(toTypesenseDoc(doc));
    } catch (error) {
      logger.error("Typesense index failed", { error, docId: doc.id });
      throw error;
    }
  }

  async indexBatch(docs: SeriesDocument[]): Promise<void> {
    if (docs.length === 0) return;

    try {
      const results: ImportResponse<TypesenseDoc>[] = await this.client
        .collections<TypesenseDoc>(COLLECTION_NAME)
        .documents()
        .import(docs.map(toTypesenseDoc), { action: "upsert" });

      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        logger.warn("Some documents failed to index", {
          failedCount: failures.length,
          totalCount: docs.length,
        });
      }
    } catch (error) {
      logger.error("Typesense batch index failed", { error });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.client.collections(COLLECTION_NAME).documents(id).delete();
    } catch (error) {
      logger.error("Typesense remove failed", { error, id });
      throw error;
    }
  }

  async reindexAll(getDocs: () => Promise<SeriesDocument[]>): Promise<number> {
    const docs = await getDocs();

    await this.client
      .collections(COLLECTION_NAME)
      .delete()
      .catch(() => {});

    await this.ensureCollection();
    await this.indexBatch(docs);

    return docs.length;
  }

  async ensureCollection(): Promise<void> {
    try {
      await this.client.collections(COLLECTION_NAME).retrieve();
    } catch {
      await this.client.collections().create(SERIES_SCHEMA);
      logger.info("Created Typesense collection", { name: COLLECTION_NAME });
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.health.retrieve();
      return true;
    } catch {
      return false;
    }
  }
}
