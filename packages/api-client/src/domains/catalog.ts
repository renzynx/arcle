import type { $Fetch } from "ofetch";
import type {
  Chapter,
  ChaptersListResponse,
  ChapterWithPages,
  CreateChapterInput,
  CreateGenreInput,
  CreatePageInput,
  CreatePagesInput,
  CreateSeriesInput,
  Genre,
  Page,
  Series,
  SeriesChaptersResponse,
  SeriesListResponse,
  SeriesStatus,
  SeriesWithChapters,
  SuccessResponse,
  UpdateChapterInput,
  UpdateGenreInput,
  UpdatePageInput,
  UpdateSeriesInput,
} from "../schemas";

export type SearchSeriesQuery = {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "latest" | "popular" | "alphabetical" | "rating";
  status?: SeriesStatus;
  includeGenres?: string[];
  excludeGenres?: string[];
  genreMode?: "any" | "all";
  minChapters?: number;
  maxChapters?: number;
};

export function createCatalogDomain($fetch: $Fetch) {
  return {
    getSeries(query?: {
      limit?: number;
      offset?: number;
      sort?: "latest" | "popular";
    }) {
      return $fetch<SeriesListResponse>("/catalog/series", { query });
    },

    searchSeries(params?: SearchSeriesQuery) {
      const query: Record<string, string | number | undefined> = {
        q: params?.q,
        limit: params?.limit,
        offset: params?.offset,
        sort: params?.sort,
        status: params?.status,
        includeGenres: params?.includeGenres?.join(","),
        excludeGenres: params?.excludeGenres?.join(","),
        genreMode: params?.genreMode,
        minChapters: params?.minChapters,
        maxChapters: params?.maxChapters,
      };

      Object.keys(query).forEach((key) => {
        if (query[key] === undefined || query[key] === "") {
          delete query[key];
        }
      });

      return $fetch<SeriesListResponse>("/catalog/search", { query });
    },

    getSeriesById(id: string) {
      return $fetch<SeriesWithChapters>(`/catalog/series/${id}`);
    },

    getSeriesBySlug(slug: string) {
      return $fetch<SeriesWithChapters>(`/catalog/series/by-slug/${slug}`);
    },

    createSeries(data: CreateSeriesInput) {
      return $fetch<Series>("/catalog/series", {
        method: "POST",
        body: data,
      });
    },

    updateSeries(id: string, data: UpdateSeriesInput) {
      return $fetch<Series>(`/catalog/series/${id}`, {
        method: "PUT",
        body: data,
      });
    },

    deleteSeries(id: string) {
      return $fetch<SuccessResponse>(`/catalog/series/${id}`, {
        method: "DELETE",
      });
    },

    getSeriesChapters(
      seriesId: string,
      query?: {
        limit?: number;
        offset?: number;
        sort?: "latest" | "oldest" | "number" | "-number";
        search?: string;
      },
    ) {
      return $fetch<SeriesChaptersResponse>(
        `/catalog/series/${seriesId}/chapters`,
        {
          query,
        },
      );
    },

    getChapters(query?: {
      limit?: number;
      offset?: number;
      sort?: "latest" | "oldest" | "number";
      seriesId?: string;
    }) {
      return $fetch<ChaptersListResponse>("/catalog/chapters", { query });
    },

    getChapterById(id: string) {
      return $fetch<ChapterWithPages>(`/catalog/chapters/${id}`);
    },

    getChapterBySlug(seriesSlug: string, chapterNumber: number) {
      return $fetch<ChapterWithPages & { series: Series }>(
        `/catalog/chapters/by-slug/${seriesSlug}/${chapterNumber}`,
      );
    },

    createChapter(data: CreateChapterInput) {
      return $fetch<Chapter>("/catalog/chapters", {
        method: "POST",
        body: data,
      });
    },

    updateChapter(id: string, data: UpdateChapterInput) {
      return $fetch<Chapter>(`/catalog/chapters/${id}`, {
        method: "PUT",
        body: data,
      });
    },

    deleteChapter(id: string) {
      return $fetch<SuccessResponse>(`/catalog/chapters/${id}`, {
        method: "DELETE",
      });
    },

    getChapterPages(chapterId: string) {
      return $fetch<Page[]>(`/catalog/chapters/${chapterId}/pages`);
    },

    getPage(id: string) {
      return $fetch<Page>(`/catalog/pages/${id}`);
    },

    createPage(data: CreatePageInput) {
      return $fetch<Page>("/catalog/pages", {
        method: "POST",
        body: data,
      });
    },

    createPages(data: CreatePagesInput) {
      return $fetch<Page[]>("/catalog/pages/bulk", {
        method: "POST",
        body: data,
      });
    },

    updatePage(id: string, data: UpdatePageInput) {
      return $fetch<Page>(`/catalog/pages/${id}`, {
        method: "PUT",
        body: data,
      });
    },

    deletePage(id: string) {
      return $fetch<SuccessResponse>(`/catalog/pages/${id}`, {
        method: "DELETE",
      });
    },

    deletePagesByChapter(chapterId: string) {
      return $fetch<SuccessResponse>("/catalog/pages/delete-by-chapter", {
        method: "POST",
        body: { chapterId },
      });
    },

    trackSeriesView(id: string) {
      return $fetch<SuccessResponse>(`/catalog/series/${id}/view`, {
        method: "POST",
      });
    },

    trackSeriesViewBySlug(slug: string) {
      return $fetch<SuccessResponse>(`/catalog/series/by-slug/${slug}/view`, {
        method: "POST",
      });
    },

    trackChapterView(id: string) {
      return $fetch<SuccessResponse>(`/catalog/chapters/${id}/view`, {
        method: "POST",
      });
    },

    trackChapterViewBySlug(seriesSlug: string, chapterNumber: number) {
      return $fetch<SuccessResponse>(
        `/catalog/chapters/by-slug/${seriesSlug}/${chapterNumber}/view`,
        { method: "POST" },
      );
    },

    getGenres() {
      return $fetch<Genre[]>("/catalog/genres");
    },

    getGenreById(id: string) {
      return $fetch<Genre>(`/catalog/genres/${id}`);
    },

    createGenre(data: CreateGenreInput) {
      return $fetch<Genre>("/catalog/genres", {
        method: "POST",
        body: data,
      });
    },

    updateGenre(id: string, data: UpdateGenreInput) {
      return $fetch<Genre>(`/catalog/genres/${id}`, {
        method: "PUT",
        body: data,
      });
    },

    deleteGenre(id: string) {
      return $fetch<SuccessResponse>(`/catalog/genres/${id}`, {
        method: "DELETE",
      });
    },
  };
}

export type CatalogDomain = ReturnType<typeof createCatalogDomain>;
