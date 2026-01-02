import type { SeriesWithChapters } from "@arcle/api-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { serverApiClient } from "@/lib/api";
import { createAuthenticatedServerClient } from "@/lib/api.server";
import { getQueryClient } from "@/lib/get-query-client";
import { SeriesPageContent } from "../_components/series-page-content";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

const getSeriesBySlug = cache(async (slug: string) => {
  const response = await serverApiClient.catalog.getSeriesBySlug(slug);
  return response as unknown as SeriesWithChapters;
});

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const series = await getSeriesBySlug(slug);

    if (!series) {
      return { title: "Series Not Found" };
    }

    return {
      title: series.title,
      description: series.description ?? `Read ${series.title} online`,
      openGraph: {
        title: series.title,
        description: series.description ?? undefined,
        images: series.coverImage ? [series.coverImage] : [],
      },
    };
  } catch {
    return {
      title: "Series Not Found",
    };
  }
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params;
  const queryClient = getQueryClient();

  let series: SeriesWithChapters;
  try {
    series = await getSeriesBySlug(slug);
    await queryClient.prefetchQuery({
      queryKey: ["series", "slug", slug],
      queryFn: () => series,
    });
  } catch {
    notFound();
  }

  const authClient = await createAuthenticatedServerClient();
  await queryClient.prefetchQuery({
    queryKey: ["library", series.id],
    queryFn: async () => {
      try {
        return await authClient.users.getLibraryItem(series.id);
      } catch {
        return null;
      }
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SeriesPageContent slug={slug} />
    </HydrationBoundary>
  );
}
