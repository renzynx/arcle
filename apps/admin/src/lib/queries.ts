import { admin } from "@arcle/auth-client";
import { useQuery } from "@arcle/query";
import { apiClient } from "./api";
import {
  type AdminUser,
  adminKeys,
  type ChaptersListParams,
  type SeriesListParams,
  type UsersListParams,
} from "./keys";

export type { AdminUser } from "./keys";

export function useSeriesListQuery(params?: SeriesListParams) {
  return useQuery({
    queryKey: adminKeys.seriesList(params),
    queryFn: () => apiClient.admin.getSeries(params),
    staleTime: 30_000,
  });
}

export function useSeriesQuery(id: string) {
  return useQuery({
    queryKey: [...adminKeys.series(), id],
    queryFn: () => apiClient.catalog.getSeriesById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useChaptersQuery(
  seriesId: string,
  params?: ChaptersListParams,
) {
  return useQuery({
    queryKey: [...adminKeys.series(), seriesId, "chapters", params],
    queryFn: () => apiClient.admin.getSeriesChapters(seriesId, params),
    enabled: !!seriesId,
  });
}

export function useChapterQuery(id: string) {
  return useQuery({
    queryKey: ["chapters", id],
    queryFn: () => apiClient.catalog.getChapterById(id),
    enabled: !!id,
  });
}

export function usePagesQuery(chapterId: string) {
  return useQuery({
    queryKey: ["chapters", chapterId, "pages"],
    queryFn: () => apiClient.catalog.getChapterPages(chapterId),
    enabled: !!chapterId,
  });
}

export function useUsersQuery(params?: UsersListParams) {
  return useQuery({
    queryKey: adminKeys.usersList(params),
    queryFn: async () => {
      const { data, error } = await admin.listUsers({
        query: {
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
          searchValue: params?.searchValue,
          searchField: params?.searchField,
          sortBy: params?.sortBy,
          sortDirection: params?.sortDirection,
        },
      });

      if (error) throw error;
      return data as { users: AdminUser[]; total: number };
    },
    staleTime: 30_000,
  });
}

export function useStatsQuery() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const [seriesData, usersResponse, statsData] = await Promise.all([
        apiClient.catalog.getSeries({ limit: 1 }),
        admin.listUsers({ query: { limit: 1 } }),
        apiClient.stats.get(),
      ]);

      return {
        totalSeries: seriesData.total,
        totalUsers: usersResponse.data?.total ?? 0,
        totalViews: statsData.totalViews,
        storageUsed: statsData.storageUsed,
        recentActivity: statsData.recentActivity,
      };
    },
    staleTime: 60_000,
  });
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: () => apiClient.settings.getAll(),
    staleTime: 30_000,
  });
}

export function useSystemHealthQuery() {
  return useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: () => apiClient.stats.health(),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMediaStatsQuery() {
  return useQuery({
    queryKey: adminKeys.mediaStats(),
    queryFn: () => apiClient.media.getStats(),
    staleTime: 60_000,
  });
}

export function useMediaCoversQuery(params?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: adminKeys.mediaCovers(params),
    queryFn: () => apiClient.media.getCovers(params),
    staleTime: 30_000,
  });
}

export function useMediaPagesQuery(params?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: adminKeys.mediaPages(params),
    queryFn: () => apiClient.media.getPages(params),
    staleTime: 30_000,
  });
}

export function useAllChaptersQuery(params?: ChaptersListParams) {
  return useQuery({
    queryKey: adminKeys.chaptersList(params),
    queryFn: () => apiClient.catalog.getChapters(params),
    staleTime: 30_000,
  });
}

export function useGenresQuery() {
  return useQuery({
    queryKey: adminKeys.genres(),
    queryFn: () => apiClient.catalog.getGenres(),
    staleTime: 30_000,
  });
}

export function useGenreQuery(id: string) {
  return useQuery({
    queryKey: [...adminKeys.genres(), id],
    queryFn: () => apiClient.catalog.getGenreById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
