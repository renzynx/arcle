import type { $Fetch } from "ofetch";
import type { AdminStats, SystemHealth } from "../schemas";

export function createStatsDomain($fetch: $Fetch, baseURL: string) {
  return {
    get() {
      return $fetch<AdminStats>("/catalog/stats");
    },

    async health() {
      const res = await fetch(`${baseURL}/stats/health`);
      if (!res.ok) {
        throw new Error(`Failed to fetch health: ${res.statusText}`);
      }
      return res.json() as Promise<SystemHealth>;
    },
  };
}

export type StatsDomain = ReturnType<typeof createStatsDomain>;
