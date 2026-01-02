import type { SettingsMap } from "@arcle/cache";
import {
  CacheKey,
  CachePattern,
  del,
  delPattern,
  set,
  TTL,
} from "@arcle/cache";

let refreshSettingsCallback: (() => Promise<SettingsMap>) | null = null;

export function setSettingsRefreshCallback(
  callback: () => Promise<SettingsMap>,
): void {
  refreshSettingsCallback = callback;
}

export async function invalidateSettingsCache(): Promise<void> {
  await del(CacheKey.settings());

  if (refreshSettingsCallback) {
    const freshSettings = await refreshSettingsCallback();
    await set(CacheKey.settings(), freshSettings, TTL.SETTINGS);
  }
}

export async function invalidateSeriesCaches(
  id: string,
  slug?: string,
): Promise<void> {
  const deletions: Promise<unknown>[] = [
    del(CacheKey.seriesById(id)),
    delPattern(CachePattern.seriesLists()),
  ];

  if (slug) {
    deletions.push(del(CacheKey.seriesBySlug(slug)));
  }

  await Promise.all(deletions);
}

export async function invalidateChapterCaches(
  chapterId: string,
  seriesId: string,
  seriesSlug?: string,
  chapterNumber?: number,
): Promise<void> {
  const deletions: Promise<unknown>[] = [
    del(CacheKey.chapterById(chapterId)),
    del(CacheKey.chaptersList(seriesId)),
    del(CacheKey.seriesById(seriesId)),
  ];

  if (seriesSlug) {
    deletions.push(del(CacheKey.seriesBySlug(seriesSlug)));
    if (chapterNumber !== undefined) {
      deletions.push(del(CacheKey.chapterBySlug(seriesSlug, chapterNumber)));
    }
  }

  await Promise.all(deletions);
}
