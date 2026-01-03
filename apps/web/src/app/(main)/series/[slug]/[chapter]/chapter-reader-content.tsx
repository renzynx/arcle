"use client";

import type { ChapterWithPages, Series } from "@arcle/api-client";
import { useApiClient } from "@arcle/auth-client";
import { useInfiniteQuery, useQuery } from "@arcle/query";
import { Button } from "@arcle/ui/components/button";
import type { Route } from "next";
import Link from "next/link";
import { useRef, useState } from "react";
import { usePrivacySettings } from "@/hooks/use-privacy-settings";
import { useTrackReadingHistory } from "@/hooks/use-reading-history";
import { useTrackChapterView } from "@/hooks/use-track-view";
import { ChapterNavFooter } from "./_components/chapter-nav-footer";
import { PageGallery } from "./_components/page-gallery";
import { ReaderHeader } from "./_components/reader-header";
import { ScrollToTopButton } from "./_components/scroll-to-top";
import { useReaderNavigation } from "./_hooks/use-reader-navigation";

interface ChapterReaderContentProps {
  slug: string;
  chapterNumber: number;
}

interface Page {
  id: string;
  chapterId: string;
  number: number;
  imageUrl: string;
}

type ChapterWithSeriesData = ChapterWithPages & { series: Series };

export function ChapterReaderContent({
  slug,
  chapterNumber,
}: ChapterReaderContentProps) {
  const apiClient = useApiClient();
  const { data: privacySettings } = usePrivacySettings();
  const [open, setOpen] = useState(false);
  const chapterListRef = useRef<HTMLDivElement>(null);

  useTrackChapterView(slug, chapterNumber, {
    enabled: privacySettings?.trackViews ?? true,
  });

  const {
    data: chapterData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chapter", slug, chapterNumber],
    queryFn: () => apiClient.catalog.getChapterBySlug(slug, chapterNumber),
    select: (response) => response as unknown as ChapterWithSeriesData,
  });

  const {
    data: chaptersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chapters", chapterData?.series?.id] as const,
    queryFn: ({ pageParam }) =>
      apiClient.catalog.getSeriesChapters(chapterData!.series!.id, {
        limit: 50,
        offset: pageParam,
        sort: "oldest",
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialPageParam: 0,
    enabled: !!chapterData?.series?.id,
  });

  const allChapters = [
    ...new Map(
      (chaptersData?.pages.flatMap((page) => page.data) ?? []).map((ch) => [
        ch.id,
        ch,
      ]),
    ).values(),
  ];
  const totalChapters = chapterData?.series?.chapterCount ?? 0;

  const {
    headerVisible,
    showScrollTop,
    scrollToTop,
    navigateToChapter,
    hasPrev,
    hasNext,
  } = useReaderNavigation({
    slug,
    chapterNumber,
    totalChapters,
    onChapterChange: () => setOpen(false),
  });

  useTrackReadingHistory(chapterData?.series?.id, chapterNumber, {
    enabled: privacySettings?.trackHistory ?? true,
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">
            Failed to load chapter
          </h1>
          <p className="text-zinc-400">
            Make sure this chapter exists and try again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button
              variant="secondary"
              render={
                <Link href={`/series/${slug}` as Route}>Back to Series</Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <ReaderHeader
        slug={slug}
        seriesTitle={chapterData?.series?.title}
        chapterNumber={chapterNumber}
        chapterTitle={chapterData?.title}
        isLoading={isLoading}
        headerVisible={headerVisible}
        hasPrev={hasPrev}
        hasNext={hasNext}
        navigateToChapter={navigateToChapter}
        open={open}
        onOpenChange={setOpen}
        chapters={allChapters}
        chapterListRef={chapterListRef}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />

      <main className="flex-1 flex flex-col items-center pt-14 sm:pt-16 pb-20 sm:pb-24 min-h-screen">
        <div className="w-full sm:max-w-3xl flex flex-col bg-zinc-900 sm:shadow-2xl min-h-[50vh]">
          <PageGallery
            pages={(chapterData?.pages ?? []) as Page[]}
            isLoading={isLoading}
          />
        </div>

        {!isLoading && (
          <ChapterNavFooter
            slug={slug}
            hasPrev={hasPrev}
            hasNext={hasNext}
            navigateToChapter={navigateToChapter}
            chapterNumber={chapterNumber}
          />
        )}
      </main>

      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </div>
  );
}
