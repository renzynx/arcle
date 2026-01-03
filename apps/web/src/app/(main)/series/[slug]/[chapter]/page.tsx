import type { ChapterWithPages, Series } from "@arcle/api-client";
import { dehydrate, getQueryClient, HydrationBoundary } from "@arcle/query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getServerApiClient } from "@/lib/api";
import { ChapterReaderContent } from "./chapter-reader-content";

interface ChapterPageProps {
  params: Promise<{
    slug: string;
    chapter: string;
  }>;
}

type ChapterWithSeriesData = ChapterWithPages & { series: Series };

function parseChapterNumber(chapter: string): number | null {
  const num = parseInt(chapter.replace("chapter-", ""), 10);
  return Number.isNaN(num) ? null : num;
}

const getChapterBySlug = cache(async (slug: string, chapterNumber: number) => {
  const response = await getServerApiClient().catalog.getChapterBySlug(
    slug,
    chapterNumber,
  );
  return response as unknown as ChapterWithSeriesData;
});

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const { slug, chapter } = await params;
  const chapterNumber = parseChapterNumber(chapter);

  if (!chapterNumber) {
    return { title: "Invalid Chapter" };
  }

  try {
    const chapterData = await getChapterBySlug(slug, chapterNumber);
    if (!chapterData) {
      return { title: "Chapter Not Found" };
    }
    const title = chapterData.title
      ? `Chapter ${chapterData.number}: ${chapterData.title}`
      : `Chapter ${chapterData.number}`;

    return {
      title: `${title} - ${chapterData.series?.title ?? "Reading"}`,
      description: `Read ${chapterData.series?.title ?? "manga"} chapter ${chapterData.number} online`,
    };
  } catch {
    return { title: "Chapter Not Found" };
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, chapter } = await params;
  const chapterNumber = parseChapterNumber(chapter);

  if (!chapterNumber) {
    notFound();
  }

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["chapter", slug, chapterNumber],
      queryFn: () => getChapterBySlug(slug, chapterNumber),
    });
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChapterReaderContent slug={slug} chapterNumber={chapterNumber} />
    </HydrationBoundary>
  );
}
