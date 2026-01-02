export const TTL = {
  SETTINGS: 3600,
  SERIES_LIST: 120,
  SERIES: 300,
  CHAPTER: 300,
  CHAPTERS_LIST: 180,
  ADMIN_STATS: 60,
  GENRES: 600,
  SEARCH: 60,
  LIBRARY: 60,
  HISTORY: 60,
  PAGE: 300,
  USER_SETTINGS: 300,
  RATINGS: 120,
  MEDIA_STATS: 60,
} as const;

const PREFIX = "arcle";

export const CacheKey = {
  settings: () => `${PREFIX}:settings` as const,

  seriesList: (sort: string, limit: number, offset: number) =>
    `${PREFIX}:series:list:${sort}:${limit}:${offset}` as const,

  seriesById: (id: string) => `${PREFIX}:series:id:${id}` as const,

  seriesBySlug: (slug: string) => `${PREFIX}:series:slug:${slug}` as const,

  chapterById: (id: string) => `${PREFIX}:chapters:id:${id}` as const,

  chapterBySlug: (seriesSlug: string, chapterNumber: number) =>
    `${PREFIX}:chapters:slug:${seriesSlug}:${chapterNumber}` as const,

  chaptersList: (seriesId: string) =>
    `${PREFIX}:chapters:list:${seriesId}` as const,

  chaptersListPaginated: (params: string) =>
    `${PREFIX}:chapters:list:paginated:${params}` as const,

  adminStats: () => `${PREFIX}:admin:stats` as const,

  genresList: () => `${PREFIX}:genres:list` as const,

  genreById: (id: string) => `${PREFIX}:genres:id:${id}` as const,

  search: (hash: string) => `${PREFIX}:search:${hash}` as const,

  libraryByUser: (userId: string) =>
    `${PREFIX}:library:user:${userId}` as const,

  libraryItem: (userId: string, seriesId: string) =>
    `${PREFIX}:library:user:${userId}:series:${seriesId}` as const,

  historyByUser: (userId: string) =>
    `${PREFIX}:history:user:${userId}` as const,

  historyItem: (userId: string, seriesId: string) =>
    `${PREFIX}:history:user:${userId}:series:${seriesId}` as const,

  pageById: (id: string) => `${PREFIX}:pages:id:${id}` as const,

  userSettings: (userId: string) =>
    `${PREFIX}:user-settings:${userId}` as const,

  ratingsByUser: (userId: string) =>
    `${PREFIX}:ratings:user:${userId}` as const,

  ratingItem: (userId: string, seriesId: string) =>
    `${PREFIX}:ratings:user:${userId}:series:${seriesId}` as const,

  mediaStats: () => `${PREFIX}:media:stats` as const,

  mediaCovers: (limit: number, offset: number) =>
    `${PREFIX}:media:covers:${limit}:${offset}` as const,

  mediaPages: (limit: number, offset: number) =>
    `${PREFIX}:media:pages:${limit}:${offset}` as const,
} as const;

export const CachePattern = {
  allSeries: () => `${PREFIX}:series:*` as const,

  allChapters: () => `${PREFIX}:chapters:*` as const,

  seriesLists: () => `${PREFIX}:series:list:*` as const,

  chaptersBySeries: (seriesSlug: string) =>
    `${PREFIX}:chapters:slug:${seriesSlug}:*` as const,

  allGenres: () => `${PREFIX}:genres:*` as const,

  allSearch: () => `${PREFIX}:search:*` as const,

  libraryByUser: (userId: string) =>
    `${PREFIX}:library:user:${userId}*` as const,

  historyByUser: (userId: string) =>
    `${PREFIX}:history:user:${userId}*` as const,

  ratingsByUser: (userId: string) =>
    `${PREFIX}:ratings:user:${userId}*` as const,

  allMediaStats: () => `${PREFIX}:media:*` as const,
} as const;
