"use client";

import type { SeriesListResponse } from "@arcle/api-client";
import { useApiClient } from "@arcle/auth-client";
import { useQuery } from "@arcle/query";
import { ArrowRight } from "@phosphor-icons/react";
import type { Route } from "next";
import Link from "next/link";
import { SeriesGrid, SeriesGridSkeleton } from "@/components/series-grid";

interface SeriesSectionProps {
  title: string;
  href: Route;
  sort: "latest" | "popular";
  limit?: number;
}

function SeriesSection({ title, href, sort, limit = 6 }: SeriesSectionProps) {
  const apiClient = useApiClient();
  const {
    data: seriesData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["series", sort, limit] as const,
    queryFn: () => apiClient.catalog.getSeries({ limit, sort }),
    select: (response) => response as unknown as SeriesListResponse,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          View All
          <ArrowRight className="size-4" />
        </Link>
      </div>
      {isPending ? (
        <SeriesGridSkeleton count={limit} />
      ) : isError || !seriesData?.data ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            Failed to load {title.toLowerCase()}
          </p>
        </div>
      ) : (
        <SeriesGrid series={seriesData.data} />
      )}
    </section>
  );
}

export function PopularSeriesSection() {
  return (
    <SeriesSection
      title="Popular"
      href={"/browse?sort=popular" as Route}
      sort="popular"
      limit={6}
    />
  );
}

export function LatestSeriesSection() {
  return (
    <SeriesSection
      title="Latest Updates"
      href={"/browse" as Route}
      sort="latest"
      limit={12}
    />
  );
}
