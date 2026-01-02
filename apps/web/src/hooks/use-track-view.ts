"use client";

import type { Session } from "@arcle/auth-client";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";

const VIEW_CACHE_PREFIX = "arcle_view_";
const VIEW_TTL_MS = 24 * 60 * 60 * 1000;

function getViewCacheKey(type: "series" | "chapter", id: string): string {
  return `${VIEW_CACHE_PREFIX}${type}:${id}`;
}

function isViewCached(type: "series" | "chapter", id: string): boolean {
  if (typeof window === "undefined") return false;

  const key = getViewCacheKey(type, id);
  const cached = localStorage.getItem(key);
  if (!cached) return false;

  const expiry = Number.parseInt(cached, 10);
  if (Date.now() > expiry) {
    localStorage.removeItem(key);
    return false;
  }

  return true;
}

function cacheView(type: "series" | "chapter", id: string): void {
  if (typeof window === "undefined") return;

  const key = getViewCacheKey(type, id);
  const expiry = Date.now() + VIEW_TTL_MS;
  localStorage.setItem(key, expiry.toString());
}

interface TrackViewOptions {
  enabled?: boolean;
  session?: Session | null;
}

export function useTrackSeriesView(
  slug: string,
  options: TrackViewOptions = {},
) {
  const { enabled = true, session } = options;
  const tracked = useRef(false);

  useEffect(() => {
    if (!enabled || tracked.current || !slug) return;
    tracked.current = true;

    if (isViewCached("series", slug)) return;

    // Only track if user has an active session
    // Skip tracking for unauthenticated users to avoid session issues
    if (!session) return;

    cacheView("series", slug);
    apiClient.catalog.trackSeriesViewBySlug(slug).catch(() => {});
  }, [slug, session, enabled]);
}

export function useTrackChapterView(
  seriesSlug: string,
  chapterNumber: number,
  options: TrackViewOptions = {},
) {
  const { enabled = true, session } = options;
  const tracked = useRef(false);
  const chapterId = `${seriesSlug}:${chapterNumber}`;

  useEffect(() => {
    if (!enabled || tracked.current || !seriesSlug || !chapterNumber) return;
    tracked.current = true;

    if (isViewCached("chapter", chapterId)) return;

    // Only track if user has an active session
    if (!session) return;

    cacheView("chapter", chapterId);
    apiClient.catalog
      .trackChapterViewBySlug(seriesSlug, chapterNumber)
      .catch(() => {});
  }, [seriesSlug, chapterNumber, chapterId, session, enabled]);
}
