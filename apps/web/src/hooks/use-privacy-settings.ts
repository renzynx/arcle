"use client";

import type { UpdateUserSettingsInput, UserSettings } from "@arcle/api-client";
import { useSessionQuery } from "@arcle/auth-client";
import { useMutation, useQuery, useQueryClient } from "@arcle/query";
import { apiClient } from "@/lib/api";

export function usePrivacySettings() {
  const { data: session } = useSessionQuery();

  return useQuery({
    queryKey: ["user-settings"],
    queryFn: () => apiClient.users.getSettings(),
    enabled: !!session?.user,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdatePrivacySettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSettingsInput) =>
      apiClient.users.updateSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserSettings>(["user-settings"], updated);
    },
  });
}
