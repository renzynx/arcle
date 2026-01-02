import { ofetch } from "ofetch";
import type { TokenGetter } from "../client";
import type { MediaFilesResponse, MediaStats } from "../schemas";

export type MediaDomainConfig = {
  baseURL: string;
  credentials: RequestCredentials;
  getToken?: TokenGetter;
};

export function createMediaDomain(config: MediaDomainConfig) {
  const { baseURL, credentials, getToken } = config;

  const $fetch = ofetch.create({
    baseURL: `${baseURL}/api/media`,
    credentials,
    async onRequest({ options }) {
      if (getToken) {
        const token = await getToken();
        if (token) {
          options.headers = new Headers(options.headers);
          options.headers.set("Authorization", `Bearer ${token}`);
        }
      }
    },
  });

  return {
    getStats() {
      return $fetch<MediaStats>("/stats");
    },

    getCovers(query?: { limit?: number; offset?: number }) {
      return $fetch<MediaFilesResponse>("/stats/covers", { query });
    },

    getPages(query?: { limit?: number; offset?: number }) {
      return $fetch<MediaFilesResponse>("/stats/pages", { query });
    },

    clearTemp() {
      return $fetch<{ cleared: boolean }>("/stats/temp", { method: "DELETE" });
    },

    deleteCover(filename: string) {
      return $fetch<{ deleted: boolean }>(`/images/covers/${filename}`, {
        method: "DELETE",
      });
    },

    uploadAvatar(file: File) {
      const formData = new FormData();
      formData.append("file", file);

      return $fetch<{ url: string; filename: string; status: string }>(
        "/images/avatars",
        {
          method: "POST",
          body: formData,
        },
      );
    },

    deleteAvatar(filename: string) {
      return $fetch<{ deleted: boolean }>(`/images/avatars/${filename}`, {
        method: "DELETE",
      });
    },
  };
}

export type MediaDomain = ReturnType<typeof createMediaDomain>;
