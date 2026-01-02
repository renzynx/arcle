"use client";

import type { Series, SeriesListResponse } from "@arcle/api-client";
import { useQuery } from "@arcle/query";
import { Badge } from "@arcle/ui/components/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@arcle/ui/components/carousel";
import { Image } from "@arcle/ui/components/image";
import { Skeleton } from "@arcle/ui/components/skeleton";
import Autoplay from "embla-carousel-autoplay";
import type { Route } from "next";
import Link from "next/link";
import { useRef } from "react";
import { apiClient } from "@/lib/api";

export function FeaturedCarousel() {
  const {
    data: seriesData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["series", "popular", 6] as const,
    queryFn: () => apiClient.catalog.getSeries({ limit: 6, sort: "popular" }),
    select: (response): SeriesListResponse | null => {
      const res = response as unknown as SeriesListResponse;
      if (!res?.data) return null;
      return { data: res.data.slice(0, 5), total: res.total };
    },
  });

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  );

  if (isPending) {
    return <FeaturedCarouselSkeleton />;
  }

  if (isError || !seriesData?.data?.length) {
    return null;
  }

  return (
    <section className="relative group">
      <Carousel
        opts={{ loop: true, align: "start" }}
        plugins={[autoplayPlugin.current]}
        className="w-full"
      >
        <CarouselContent>
          {seriesData.data.map((series) => (
            <CarouselItem key={series.id}>
              <FeaturedSlide series={series} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 opacity-0 transition-opacity group-hover:opacity-100" />
        <CarouselNext className="right-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </Carousel>
    </section>
  );
}

function FeaturedSlide({ series }: { series: Series }) {
  return (
    <Link
      href={`/series/${series.slug}` as Route}
      className="group/slide relative block w-full overflow-hidden rounded-xl"
    >
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        {series.coverImage && (
          <Image
            src={series.coverImage}
            alt={series.title}
            containerClassName="absolute inset-0 w-full h-full"
            className="w-full h-full object-cover opacity-30 blur-sm scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center">
        <div className="flex gap-6 p-6 md:p-10 lg:p-12">
          <div className="relative hidden sm:block flex-shrink-0 w-32 md:w-40 lg:w-48 aspect-[2/3] overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10">
            {series.coverImage ? (
              <Image
                src={series.coverImage}
                alt={series.title}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/slide:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">No Cover</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-3 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
              {series.status && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {series.status}
                </Badge>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight line-clamp-2 group-hover/slide:text-primary transition-colors">
              {series.title}
            </h2>

            {series.description && (
              <p className="text-sm md:text-base text-muted-foreground line-clamp-2 md:line-clamp-3">
                {series.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {series.author && <span>By {series.author}</span>}
              {series.chapterCount !== undefined && series.chapterCount > 0 && (
                <span>{series.chapterCount} Chapters</span>
              )}
              {series.viewCount !== undefined && series.viewCount > 0 && (
                <span>{series.viewCount.toLocaleString()} Views</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCarouselSkeleton() {
  return (
    <section>
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-muted">
        <div className="absolute inset-0 flex items-center">
          <div className="flex gap-6 p-6 md:p-10 lg:p-12">
            <Skeleton className="hidden sm:block w-32 md:w-40 lg:w-48 aspect-[2/3] rounded-lg" />
            <div className="flex flex-col justify-center gap-3 max-w-xl">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
