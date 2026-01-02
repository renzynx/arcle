"use client";

import type { SeriesWithChapters } from "@arcle/api-client";
import { useSessionQuery } from "@arcle/auth-client";
import { useQuery } from "@arcle/query";
import { Badge } from "@arcle/ui/components/badge";
import { Button } from "@arcle/ui/components/button";
import { Image } from "@arcle/ui/components/image";
import { Skeleton } from "@arcle/ui/components/skeleton";
import {
  BookmarkSimple,
  BookOpen,
  CircleNotch,
  Eye,
  List,
} from "@phosphor-icons/react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { LibraryStatusDropdown } from "@/components/library-status-dropdown";
import { StarRating } from "@/components/star-rating";
import {
  useAddRatingMutation,
  useAddToLibraryMutation,
  useLibraryItem,
  useRating,
  useRemoveFromLibraryMutation,
  useUpdateRatingMutation,
} from "@/hooks/use-library";
import { usePrivacySettings } from "@/hooks/use-privacy-settings";
import { useTrackSeriesView } from "@/hooks/use-track-view";
import { apiClient } from "@/lib/api";
import { ChapterList } from "./chapter-list";

interface SeriesPageContentProps {
  slug: string;
}

export function SeriesPageContent({ slug }: SeriesPageContentProps) {
  const { data: session } = useSessionQuery();
  const { data: privacySettings } = usePrivacySettings();

  useTrackSeriesView(slug, {
    enabled: privacySettings?.trackViews ?? true,
    session,
  });

  const {
    data: series,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["series", "slug", slug] as const,
    queryFn: () => apiClient.catalog.getSeriesBySlug(slug),
    select: (response) => response as unknown as SeriesWithChapters,
  });

  const { data: libraryItem, isLoading: isLibraryLoading } = useLibraryItem(
    series?.id,
  );
  const { data: userRating } = useRating(series?.id);
  const addToLibrary = useAddToLibraryMutation();
  const removeFromLibrary = useRemoveFromLibraryMutation();
  const addRating = useAddRatingMutation();
  const updateRating = useUpdateRatingMutation();

  const isBookmarked = !!libraryItem;
  const isBookmarkLoading =
    isLibraryLoading || addToLibrary.isPending || removeFromLibrary.isPending;

  const handleBookmarkClick = () => {
    if (!series?.id) return;
    if (isBookmarked) {
      removeFromLibrary.mutate(series.id, {
        onSuccess: () => {
          toast.success("Removed from library");
        },
        onError: () => {
          toast.error("Failed to remove from library");
        },
      });
    } else {
      addToLibrary.mutate(series.id, {
        onSuccess: () => {
          toast.success("Added to library");
        },
        onError: () => {
          toast.error("Failed to add to library");
        },
      });
    }
  };

  const handleRatingChange = (score: number) => {
    if (!series?.id) return;
    const mutation = userRating ? updateRating : addRating;
    mutation.mutate(
      { seriesId: series.id, score },
      {
        onSuccess: () => {
          toast.success("Rating saved");
        },
        onError: () => {
          toast.error("Failed to save rating");
        },
      },
    );
  };

  if (isPending) {
    return <SeriesPageSkeleton />;
  }

  if (isError || !series) {
    notFound();
  }

  const firstChapter = series.chapters?.[0];
  const latestChapter =
    series.chapters && series.chapters.length > 0
      ? series.chapters.reduce((max, ch) => (ch.number > max.number ? ch : max))
      : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[240px] overflow-hidden rounded-xl bg-muted shadow-lg ring-1 ring-border/10 lg:mx-0 lg:max-w-none">
            {series.coverImage ? (
              <Image
                src={series.coverImage}
                alt={series.title}
                containerClassName="h-full w-full"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <BookOpen className="size-12" />
                <span className="text-sm">No Cover</span>
              </div>
            )}
          </div>

          {firstChapter && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="lg"
                  render={<Link href={`/series/${slug}/chapter-1` as Route} />}
                >
                  <BookOpen className="mr-2 size-5" />
                  Start Reading
                </Button>
                {session?.user &&
                  (isBookmarked && libraryItem ? (
                    <LibraryStatusDropdown
                      seriesId={series.id}
                      currentStatus={libraryItem.status}
                    />
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      className="shrink-0 px-3"
                      onClick={handleBookmarkClick}
                      disabled={isBookmarkLoading}
                    >
                      {isBookmarkLoading ? (
                        <CircleNotch className="size-5 animate-spin" />
                      ) : (
                        <BookmarkSimple className="size-5" />
                      )}
                    </Button>
                  ))}
              </div>
              {latestChapter && latestChapter.number > 1 && (
                <Button
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  render={
                    <Link
                      href={
                        `/series/${slug}/chapter-${latestChapter.number}` as Route
                      }
                    />
                  }
                >
                  Read Latest (Ch. {latestChapter.number})
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {series.status && (
                <Badge variant="secondary" className="capitalize">
                  {series.status}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {series.title}
            </h1>

            {series.author && (
              <p className="text-lg text-muted-foreground">
                By {series.author}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {series.chapterCount !== undefined && (
                <span className="flex items-center gap-1.5">
                  <List className="size-4" />
                  {series.chapterCount} Chapters
                </span>
              )}
              {series.viewCount !== undefined && series.viewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" />
                  {series.viewCount.toLocaleString()} Views
                </span>
              )}
            </div>

            {session?.user && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-muted-foreground">
                  Your rating:
                </span>
                <StarRating
                  value={userRating?.score ?? null}
                  onChange={handleRatingChange}
                  disabled={addRating.isPending || updateRating.isPending}
                  showValue
                />
              </div>
            )}
          </div>

          {series.description && (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {series.description}
              </p>
            </div>
          )}

          <ChapterList
            seriesId={series.id}
            seriesSlug={slug}
            totalChapters={series.chapterCount ?? series.chapters?.length ?? 0}
          />
        </div>
      </div>
    </div>
  );
}

function SeriesPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Skeleton className="mx-auto aspect-[2/3] w-full max-w-[240px] rounded-xl lg:mx-0 lg:max-w-none" />
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
