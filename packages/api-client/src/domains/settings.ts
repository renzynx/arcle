import type { $Fetch } from "ofetch";
import type { Setting, SettingsMap, SuccessResponse } from "../schemas";

export function createSettingsDomain($fetch: $Fetch) {
  return {
    getAll() {
      return $fetch<SettingsMap>("/catalog/settings");
    },

    get(key: string) {
      return $fetch<Setting>(`/catalog/settings/${key}`);
    },

    update(key: string, value: string) {
      return $fetch<Setting>(`/catalog/settings/${key}`, {
        method: "PUT",
        body: { value },
      });
    },

    bulkUpdate(settings: Array<{ key: string; value: string }>) {
      return $fetch<SuccessResponse>("/catalog/settings/bulk", {
        method: "POST",
        body: { settings },
      });
    },

    delete(key: string) {
      return $fetch<SuccessResponse>(`/catalog/settings/${key}`, {
        method: "DELETE",
      });
    },

    regenerateSigningSecret() {
      return $fetch<SuccessResponse>("/catalog/settings/signing/regenerate", {
        method: "POST",
      });
    },
  };
}

export type SettingsDomain = ReturnType<typeof createSettingsDomain>;
