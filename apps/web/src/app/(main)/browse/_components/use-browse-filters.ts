"use client";

import type { SeriesStatus } from "@arcle/api-client";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type SortOption = "latest" | "popular" | "alphabetical" | "rating";
export type GenreMode = "any" | "all";

export type BrowseFilters = {
  q?: string;
  sort?: SortOption;
  status?: SeriesStatus | "all";
  includeGenres?: string[];
  excludeGenres?: string[];
  genreMode?: GenreMode;
  minChapters?: number;
  maxChapters?: number;
  page?: number;
};

const DEFAULT_FILTERS: BrowseFilters = {
  sort: "latest",
  status: "all",
  genreMode: "any",
  page: 1,
};

function parseFiltersFromUrl(searchParams: URLSearchParams): BrowseFilters {
  const filterParam = searchParams.get("filter");
  if (!filterParam) return DEFAULT_FILTERS;

  try {
    const parsed = JSON.parse(filterParam) as BrowseFilters;
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function filtersToUrl(filters: BrowseFilters): string {
  const cleanFilters: BrowseFilters = {};

  if (filters.q) cleanFilters.q = filters.q;
  if (filters.sort && filters.sort !== "latest")
    cleanFilters.sort = filters.sort;
  if (filters.status && filters.status !== "all")
    cleanFilters.status = filters.status;
  if (filters.includeGenres?.length)
    cleanFilters.includeGenres = filters.includeGenres;
  if (filters.excludeGenres?.length)
    cleanFilters.excludeGenres = filters.excludeGenres;
  if (filters.genreMode && filters.genreMode !== "any")
    cleanFilters.genreMode = filters.genreMode;
  if (filters.minChapters) cleanFilters.minChapters = filters.minChapters;
  if (filters.maxChapters) cleanFilters.maxChapters = filters.maxChapters;
  if (filters.page && filters.page > 1) cleanFilters.page = filters.page;

  if (Object.keys(cleanFilters).length === 0) {
    return "/browse";
  }

  return `/browse?filter=${encodeURIComponent(JSON.stringify(cleanFilters))}`;
}

export const ITEMS_PER_PAGE = 24;

export function useBrowseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilters = useMemo(
    () => parseFiltersFromUrl(searchParams),
    [searchParams],
  );

  const [query, setQuery] = useState(initialFilters.q ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(initialFilters.q ?? "");
  const [sort, setSort] = useState<SortOption>(initialFilters.sort ?? "latest");
  const [status, setStatus] = useState<SeriesStatus | "all">(
    initialFilters.status ?? "all",
  );
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      initialFilters.includeGenres?.length ||
        initialFilters.excludeGenres?.length ||
        initialFilters.minChapters ||
        initialFilters.maxChapters,
    ),
  );
  const [includeGenres, setIncludeGenres] = useState<string[]>(
    initialFilters.includeGenres ?? [],
  );
  const [excludeGenres, setExcludeGenres] = useState<string[]>(
    initialFilters.excludeGenres ?? [],
  );
  const [genreMode, setGenreMode] = useState<GenreMode>(
    initialFilters.genreMode ?? "any",
  );
  const [minChapters, setMinChapters] = useState<string>(
    initialFilters.minChapters?.toString() ?? "",
  );
  const [maxChapters, setMaxChapters] = useState<string>(
    initialFilters.maxChapters?.toString() ?? "",
  );
  const [page, setPage] = useState(initialFilters.page ?? 1);

  const offset = (page - 1) * ITEMS_PER_PAGE;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const updateUrl = useCallback(
    (newFilters: BrowseFilters) => {
      const url = filtersToUrl(newFilters);
      router.replace(url as Route, { scroll: false });
    },
    [router],
  );

  const currentFilters: BrowseFilters = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      sort,
      status,
      includeGenres: includeGenres.length > 0 ? includeGenres : undefined,
      excludeGenres: excludeGenres.length > 0 ? excludeGenres : undefined,
      genreMode,
      minChapters: minChapters ? Number(minChapters) : undefined,
      maxChapters: maxChapters ? Number(maxChapters) : undefined,
      page,
    }),
    [
      debouncedQuery,
      sort,
      status,
      includeGenres,
      excludeGenres,
      genreMode,
      minChapters,
      maxChapters,
      page,
    ],
  );

  useEffect(() => {
    updateUrl(currentFilters);
  }, [currentFilters, updateUrl]);

  const includeGenresKey = includeGenres.join(",");
  const excludeGenresKey = excludeGenres.join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [
    debouncedQuery,
    sort,
    status,
    includeGenresKey,
    excludeGenresKey,
    genreMode,
    minChapters,
    maxChapters,
  ]);

  const toggleIncludeGenre = useCallback((genreId: string) => {
    setExcludeGenres((prev) => prev.filter((id) => id !== genreId));
    setIncludeGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId],
    );
  }, []);

  const toggleExcludeGenre = useCallback((genreId: string) => {
    setIncludeGenres((prev) => prev.filter((id) => id !== genreId));
    setExcludeGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setSort("latest");
    setStatus("all");
    setIncludeGenres([]);
    setExcludeGenres([]);
    setGenreMode("any");
    setMinChapters("");
    setMaxChapters("");
    setPage(1);
  }, []);

  const hasActiveFilters = Boolean(
    query ||
      sort !== "latest" ||
      status !== "all" ||
      includeGenres.length > 0 ||
      excludeGenres.length > 0 ||
      minChapters ||
      maxChapters,
  );

  return {
    query,
    setQuery,
    debouncedQuery,
    sort,
    setSort,
    status,
    setStatus,
    showAdvanced,
    setShowAdvanced,
    includeGenres,
    excludeGenres,
    genreMode,
    setGenreMode,
    minChapters,
    setMinChapters,
    maxChapters,
    setMaxChapters,
    page,
    setPage,
    offset,
    toggleIncludeGenre,
    toggleExcludeGenre,
    clearFilters,
    hasActiveFilters,
  };
}
