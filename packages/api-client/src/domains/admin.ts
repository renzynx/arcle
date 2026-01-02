import type { $Fetch } from "ofetch";
import type { Series, SeriesChaptersResponse } from "../schemas";

export type AdminSeriesListResponse = {
  data: (Series & { chapterCount: number })[];
  total: number;
};

export type AdminPaginationQuery = {
  limit?: number;
  offset?: number;
  search?: string;
};

export function createAdminDomain($fetch: $Fetch) {
  return {
    getSeries(query?: AdminPaginationQuery) {
      return $fetch<AdminSeriesListResponse>("/catalog/admin/series", {
        query,
      });
    },

    getSeriesChapters(seriesId: string, query?: AdminPaginationQuery) {
      return $fetch<SeriesChaptersResponse>(
        `/catalog/admin/series/${seriesId}/chapters`,
        { query },
      );
    },
  };
}

export type AdminDomain = ReturnType<typeof createAdminDomain>;
