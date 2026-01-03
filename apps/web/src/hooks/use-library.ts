"use client";

import type { LibraryItem } from "@arcle/api-client";
import { useApiClient, useSessionQuery } from "@arcle/auth-client";
import { useMutation, useQuery, useQueryClient } from "@arcle/query";

export function useLibraryItem(seriesId: string | undefined) {
  const apiClient = useApiClient();
  const { data: session } = useSessionQuery();

  return useQuery({
    queryKey: ["library", seriesId],
    queryFn: async () => {
      try {
        return await apiClient.users.getLibraryItem(seriesId!);
      } catch {
        return null;
      }
    },
    enabled: !!seriesId && !!session?.user,
    retry: false,
  });
}

export function useAddToLibraryMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (seriesId: string) =>
      apiClient.users.addToLibrary({ seriesId, status: "reading" }),
    onSuccess: (data, seriesId) => {
      queryClient.setQueryData(["library", seriesId], data);
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useRemoveFromLibraryMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (seriesId: string) =>
      apiClient.users.removeFromLibrary(seriesId),
    onSuccess: (_, seriesId) => {
      queryClient.setQueryData(["library", seriesId], null);
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useUpdateLibraryStatusMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: ({
      seriesId,
      status,
    }: {
      seriesId: string;
      status: LibraryItem["status"];
    }) => apiClient.users.updateLibraryStatus(seriesId, { status }),
    onSuccess: (data, { seriesId }) => {
      queryClient.setQueryData(["library", seriesId], data);
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useRemoveHistoryMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (seriesId: string) => apiClient.users.removeHistory(seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useBulkRemoveFromLibraryMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: async (seriesIds: string[]) => {
      await Promise.all(
        seriesIds.map((id) => apiClient.users.removeFromLibrary(id)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useBulkRemoveHistoryMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: async (seriesIds: string[]) => {
      await Promise.all(
        seriesIds.map((id) => apiClient.users.removeHistory(id)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useClearHistoryMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: () => apiClient.users.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useRating(seriesId: string | undefined) {
  const apiClient = useApiClient();
  const { data: session } = useSessionQuery();

  return useQuery({
    queryKey: ["rating", seriesId],
    queryFn: async () => {
      try {
        return await apiClient.users.getRating(seriesId!);
      } catch {
        return null;
      }
    },
    enabled: !!seriesId && !!session?.user,
    retry: false,
  });
}

export function useAddRatingMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: ({ seriesId, score }: { seriesId: string; score: number }) =>
      apiClient.users.addRating({ seriesId, score }),
    onSuccess: (data, { seriesId }) => {
      queryClient.setQueryData(["rating", seriesId], data);
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
    },
  });
}

export function useUpdateRatingMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: ({ seriesId, score }: { seriesId: string; score: number }) =>
      apiClient.users.updateRating(seriesId, { score }),
    onSuccess: (data, { seriesId }) => {
      queryClient.setQueryData(["rating", seriesId], data);
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
    },
  });
}

export function useRemoveRatingMutation() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (seriesId: string) => apiClient.users.removeRating(seriesId),
    onSuccess: (_, seriesId) => {
      queryClient.setQueryData(["rating", seriesId], null);
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
    },
  });
}
