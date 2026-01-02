"use client";

import type { Series } from "@arcle/api-client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useTransition } from "react";
import { apiClient } from "@/lib/api";
import { BrowseFilters } from "./browse-filters";
import { BrowseResults } from "./browse-results";
import { ITEMS_PER_PAGE, useBrowseFilters } from "./use-browse-filters";

export function BrowseContent() {
  const filters = useBrowseFilters();
  const [isPending, startTransition] = useTransition();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [total, setTotal] = useState(0);

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"] as const,
    queryFn: () => apiClient.catalog.getGenres(),
  });

  const fetchSeries = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await apiClient.catalog.searchSeries({
          q: filters.debouncedQuery || undefined,
          sort: filters.sort,
          status: filters.status === "all" ? undefined : filters.status,
          includeGenres:
            filters.includeGenres.length > 0
              ? filters.includeGenres
              : undefined,
          excludeGenres:
            filters.excludeGenres.length > 0
              ? filters.excludeGenres
              : undefined,
          genreMode:
            filters.includeGenres.length > 0 ? filters.genreMode : undefined,
          minChapters: filters.minChapters
            ? Number(filters.minChapters)
            : undefined,
          maxChapters: filters.maxChapters
            ? Number(filters.maxChapters)
            : undefined,
          limit: ITEMS_PER_PAGE,
          offset: filters.offset,
        });
        setSeries(result.data);
        setTotal(result.total);
        setIsInitialLoad(false);
      } catch (error) {
        console.error("Failed to fetch series:", error);
        setIsInitialLoad(false);
      }
    });
  }, [
    filters.debouncedQuery,
    filters.sort,
    filters.status,
    filters.includeGenres,
    filters.excludeGenres,
    filters.genreMode,
    filters.minChapters,
    filters.maxChapters,
    filters.offset,
  ]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  return (
    <div className="space-y-6">
      <BrowseFilters
        query={filters.query}
        onQueryChange={filters.setQuery}
        sort={filters.sort}
        onSortChange={filters.setSort}
        status={filters.status}
        onStatusChange={filters.setStatus}
        showAdvanced={filters.showAdvanced}
        onShowAdvancedChange={filters.setShowAdvanced}
        hasActiveFilters={filters.hasActiveFilters}
        onClearFilters={filters.clearFilters}
        genres={genres}
        includeGenres={filters.includeGenres}
        excludeGenres={filters.excludeGenres}
        genreMode={filters.genreMode}
        onGenreModeChange={filters.setGenreMode}
        onToggleIncludeGenre={filters.toggleIncludeGenre}
        onToggleExcludeGenre={filters.toggleExcludeGenre}
        minChapters={filters.minChapters}
        onMinChaptersChange={filters.setMinChapters}
        maxChapters={filters.maxChapters}
        onMaxChaptersChange={filters.setMaxChapters}
      />

      <BrowseResults
        series={series}
        total={total}
        page={filters.page}
        onPageChange={filters.setPage}
        isLoading={isPending}
        isInitialLoad={isInitialLoad}
      />
    </div>
  );
}
