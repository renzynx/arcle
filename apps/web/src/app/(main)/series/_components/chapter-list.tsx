"use client";

import type { Chapter } from "@arcle/api-client";
import { useApiClient } from "@arcle/auth-client";
import { useInfiniteQuery } from "@arcle/query";
import { Input } from "@arcle/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@arcle/ui/components/select";
import { Skeleton } from "@arcle/ui/components/skeleton";
import {
  CircleNotch,
  List,
  MagnifyingGlass,
  SortAscending,
  SortDescending,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CHAPTERS_PER_PAGE = 50;

interface ChapterListProps {
  seriesId: string;
  seriesSlug: string;
  totalChapters: number;
}

export function ChapterList({
  seriesId,
  seriesSlug,
  totalChapters,
}: ChapterListProps) {
  const apiClient = useApiClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"number" | "-number">("number");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: ["chapters", seriesId, debouncedSearch, sortOrder] as const,
      queryFn: ({ pageParam }) =>
        apiClient.catalog.getSeriesChapters(seriesId, {
          limit: CHAPTERS_PER_PAGE,
          offset: pageParam,
          sort: sortOrder,
          search: debouncedSearch || undefined,
        }),
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
        return loaded < lastPage.total ? loaded : undefined;
      },
      initialPageParam: 0,
    });

  const chapters = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <List className="size-5" />
          Chapters
        </h2>
        <div className="flex items-center gap-2">
          <Select
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as "number" | "-number")}
          >
            <SelectTrigger size="sm" className="w-[160px]">
              {sortOrder === "number" ? (
                <SortAscending className="size-4" />
              ) : (
                <SortDescending className="size-4" />
              )}
              <SelectValue>
                {sortOrder === "number" ? "Chapter 1 first" : "Latest first"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Chapter 1 first</SelectItem>
              <SelectItem value="-number">Latest first</SelectItem>
            </SelectContent>
          </Select>
          {totalChapters > 20 && (
            <div className="relative w-48">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Search chapter #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {totalChapters === 0
            ? "No chapters available yet."
            : "No chapters match your search."}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {chapters.map((chapter) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              seriesSlug={seriesSlug}
            />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <CircleNotch className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {chapters.length > 0 &&
        chapters.length < total &&
        !isFetchingNextPage && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {chapters.length} of {total} chapters
          </div>
        )}
    </div>
  );
}

function ChapterRow({
  chapter,
  seriesSlug,
}: {
  chapter: Chapter;
  seriesSlug: string;
}) {
  return (
    <Link
      href={`/series/${seriesSlug}/chapter-${chapter.number}` as Route}
      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="font-medium">Chapter {chapter.number}</span>
        {chapter.title && (
          <span className="text-muted-foreground">{chapter.title}</span>
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(chapter.createdAt), { addSuffix: true })}
      </span>
    </Link>
  );
}
