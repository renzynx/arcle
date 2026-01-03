import { useApiClient, useAuthClient } from "@arcle/auth-client";
import { useQuery } from "@arcle/query";
import {
  type AdminUser,
  adminKeys,
  type ChaptersListParams,
  type SeriesListParams,
  type UsersListParams,
} from "./keys";

export type { AdminUser } from "./keys";

export function useSeriesListQuery(params?: SeriesListParams) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: adminKeys.seriesList(params),
    queryFn: () => apiClient.admin.getSeries(params),
    staleTime: 30_000,
  });
}

export function useSeriesQuery(id: string) {
  const apiClient = useApiClient();

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
  const apiClient = useApiClient();

  return useQuery({
    queryKey: [...adminKeys.series(), seriesId, "chapters", params],
    queryFn: () => apiClient.admin.getSeriesChapters(seriesId, params),
    enabled: !!seriesId,
  });
}

export function useChapterQuery(id: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ["chapters", id],
    queryFn: () => apiClient.catalog.getChapterById(id),
    enabled: !!id,
  });
}

export function usePagesQuery(chapterId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ["chapters", chapterId, "pages"],
    queryFn: () => apiClient.catalog.getChapterPages(chapterId),
    enabled: !!chapterId,
  });
}

export function useUsersQuery(params?: UsersListParams) {
  const authClient = useAuthClient();

  return useQuery({
    queryKey: adminKeys.usersList(params),
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
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
  const apiClient = useApiClient();
  const authClient = useAuthClient();

  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const [seriesData, usersResponse, statsData] = await Promise.all([
        apiClient.catalog.getSeries({ limit: 1 }),
        authClient.admin.listUsers({ query: { limit: 1 } }),
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
  const apiClient = useApiClient();

  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: () => apiClient.settings.getAll(),
    staleTime: 30_000,
  });
}

export function useSystemHealthQuery() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: () => apiClient.stats.health(),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMediaStatsQuery() {
  const apiClient = useApiClient();

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
  const apiClient = useApiClient();

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
  const apiClient = useApiClient();

  return useQuery({
    queryKey: adminKeys.mediaPages(params),
    queryFn: () => apiClient.media.getPages(params),
    staleTime: 30_000,
  });
}

export function useAllChaptersQuery(params?: ChaptersListParams) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: adminKeys.chaptersList(params),
    queryFn: () => apiClient.catalog.getChapters(params),
    staleTime: 30_000,
  });
}

export function useGenresQuery() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: adminKeys.genres(),
    queryFn: () => apiClient.catalog.getGenres(),
    staleTime: 30_000,
  });
}

export function useGenreQuery(id: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: [...adminKeys.genres(), id],
    queryFn: () => apiClient.catalog.getGenreById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
