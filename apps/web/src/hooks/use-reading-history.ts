"use client";

import { useMutation, useQueryClient } from "@arcle/query";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";

const HISTORY_CACHE_PREFIX = "arcle_history_";
const HISTORY_TTL_MS = 5 * 60 * 1000;

function getHistoryCacheKey(seriesId: string, chapterNumber: number): string {
  return `${HISTORY_CACHE_PREFIX}${seriesId}:${chapterNumber}`;
}

function isHistoryCached(seriesId: string, chapterNumber: number): boolean {
  if (typeof window === "undefined") return false;

  const key = getHistoryCacheKey(seriesId, chapterNumber);
  const cached = localStorage.getItem(key);
  if (!cached) return false;

  const expiry = Number.parseInt(cached, 10);
  if (Date.now() > expiry) {
    localStorage.removeItem(key);
    return false;
  }

  return true;
}

function cacheHistory(seriesId: string, chapterNumber: number): void {
  if (typeof window === "undefined") return;

  const key = getHistoryCacheKey(seriesId, chapterNumber);
  const expiry = Date.now() + HISTORY_TTL_MS;
  localStorage.setItem(key, expiry.toString());
}

export function useTrackReadingHistoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seriesId,
      chapterNumber,
      pageNumber,
    }: {
      seriesId: string;
      chapterNumber: number;
      pageNumber?: number;
    }) => apiClient.users.trackHistory({ seriesId, chapterNumber, pageNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

interface TrackHistoryOptions {
  enabled?: boolean;
}

export function useTrackReadingHistory(
  seriesId: string | undefined,
  chapterNumber: number,
  options: TrackHistoryOptions = {},
) {
  const { enabled = true } = options;
  const tracked = useRef(false);
  const { mutate } = useTrackReadingHistoryMutation();

  useEffect(() => {
    if (!enabled || tracked.current || !seriesId || !chapterNumber) return;

    if (isHistoryCached(seriesId, chapterNumber)) {
      tracked.current = true;
      return;
    }

    tracked.current = true;
    cacheHistory(seriesId, chapterNumber);
    mutate({ seriesId, chapterNumber });
  }, [seriesId, chapterNumber, mutate, enabled]);
}
