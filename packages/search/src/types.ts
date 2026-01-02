export type SeriesStatus = "ongoing" | "completed" | "hiatus" | "cancelled";

export type SearchProviderType = "postgres" | "typesense";

export interface LatestChapter {
  id: string;
  number: number;
  title: string | null;
  slug: string;
  createdAt: number;
}

export interface SeriesDocument {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  author: string | null;
  status: SeriesStatus;
  coverImage: string | null;
  viewCount: number;
  bookmarkCount: number;
  ratingAvg: number;
  chapterCount: number;
  genreIds: string[];
  latestChapter: LatestChapter | null;
  createdAt: number;
  updatedAt: number;
}

export interface SearchQuery {
  q?: string;
  limit: number;
  offset: number;
  sort: "latest" | "popular" | "alphabetical" | "rating";
  status?: SeriesStatus;
  includeGenres?: string[];
  excludeGenres?: string[];
  genreMode: "any" | "all";
  minChapters?: number;
  maxChapters?: number;
}

export interface SearchResult {
  hits: SeriesDocument[];
  total: number;
}

export interface SearchProvider {
  readonly type: SearchProviderType;

  search(query: SearchQuery): Promise<SearchResult>;

  index(doc: SeriesDocument): Promise<void>;

  indexBatch(docs: SeriesDocument[]): Promise<void>;

  remove(id: string): Promise<void>;

  reindexAll(getDocs: () => Promise<SeriesDocument[]>): Promise<number>;

  ensureCollection(): Promise<void>;

  isAvailable(): Promise<boolean>;
}
