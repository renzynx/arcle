import type {
  CreateChapterInput,
  CreateGenreInput,
  CreatePageInput,
  CreatePagesInput,
  CreateSeriesInput,
  UpdateChapterInput,
  UpdateGenreInput,
  UpdatePageInput,
  UpdateSeriesInput,
} from "@arcle/api-client";
import { admin, getAccessToken } from "@arcle/auth-client";
import { useMutation, useQueryClient } from "@arcle/query";

import { apiClient } from "./api";
import { adminKeys, type UserRole } from "./keys";

export function useCreateSeriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSeriesInput) =>
      apiClient.catalog.createSeries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.series() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useUpdateSeriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSeriesInput & { id: string }) =>
      apiClient.catalog.updateSeries(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.series() });
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.series(), variables.id],
      });
    },
  });
}

export function useDeleteSeriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.catalog.deleteSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.series() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useCreateChapterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChapterInput) =>
      apiClient.catalog.createChapter(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.series(), variables.seriesId, "chapters"],
      });
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.series(), variables.seriesId],
      });
    },
  });
}

export function useUpdateChapterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: UpdateChapterInput & { id: string; seriesId: string }) =>
      apiClient.catalog.updateChapter(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.series(), variables.seriesId, "chapters"],
      });
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.id] });
    },
  });
}

export function useDeleteChapterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; seriesId: string }) =>
      apiClient.catalog.deleteChapter(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.series(), variables.seriesId, "chapters"],
      });
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.series(), variables.seriesId],
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.chapters(),
      });
    },
  });
}

export function useCreatePageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePageInput) => apiClient.catalog.createPage(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.chapterId, "pages"],
      });
    },
  });
}

export function useCreatePagesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePagesInput) => apiClient.catalog.createPages(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.chapterId, "pages"],
      });
    },
  });
}

export function useUpdatePageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      chapterId,
      ...data
    }: UpdatePageInput & { id: string; chapterId: string }) =>
      apiClient.catalog.updatePage(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.chapterId, "pages"],
      });
    },
  });
}

export function useDeletePageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; chapterId: string }) =>
      apiClient.catalog.deletePage(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.chapterId, "pages"],
      });
    },
  });
}

export function useDeletePagesByChapterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chapterId: string) =>
      apiClient.catalog.deletePagesByChapter(chapterId),
    onSuccess: (_data, chapterId) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", chapterId, "pages"],
      });
    },
  });
}

export function useUploadPagesMutation() {
  const queryClient = useQueryClient();
  const baseUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000"
      : "http://localhost:3000";

  return useMutation({
    mutationFn: async ({
      chapterId,
      files,
    }: {
      chapterId: string;
      files: File[];
    }) => {
      const token = await getAccessToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${baseUrl}/api/media/images/pages`, {
          method: "POST",
          body: formData,
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }
        const data = await res.json();
        return { imageUrl: data.filename, number: index + 1 };
      });

      const pages = await Promise.all(uploadPromises);

      return apiClient.catalog.createPages({
        chapterId,
        pages,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.chapterId, "pages"],
      });
    },
  });
}

export function useUpdatePageOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      chapterId: string;
      number: number;
    }) =>
      apiClient.catalog.updatePage(variables.id, { number: variables.number }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.chapterId, "pages"],
      });
    },
  });
}

export function useBanUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      banReason,
      banExpiresIn,
    }: {
      userId: string;
      banReason?: string;
      banExpiresIn?: number;
    }) =>
      admin.banUser({
        userId,
        banReason,
        banExpiresIn,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useUnbanUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => admin.unbanUser({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useSetUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      admin.setRole({ userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
      role,
    }: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    }) =>
      admin.createUser({
        name,
        email,
        password,
        role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useUpdateSettingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiClient.settings.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}

export function useBulkUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Array<{ key: string; value: string }>) =>
      apiClient.settings.bulkUpdate(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}

export function useClearTempMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.media.clearTemp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.mediaStats() });
    },
  });
}

export function useRegenerateSigningSecretMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.settings.regenerateSigningSecret(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}

export function useDeleteCoverMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filename: string) => apiClient.media.deleteCover(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.mediaCovers() });
      queryClient.invalidateQueries({ queryKey: adminKeys.mediaStats() });
    },
  });
}

export function useCreateGenreMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGenreInput) => apiClient.catalog.createGenre(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.genres() });
    },
  });
}

export function useUpdateGenreMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateGenreInput & { id: string }) =>
      apiClient.catalog.updateGenre(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.genres() });
    },
  });
}

export function useDeleteGenreMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.catalog.deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.genres() });
    },
  });
}

export function useUploadOgImageMutation() {
  const queryClient = useQueryClient();
  const baseUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000"
      : "http://localhost:3000";

  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getAccessToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${baseUrl}/api/media/images/og`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload OG image");
      }

      const data = await res.json();
      return data as { url: string; filename: string; status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}
