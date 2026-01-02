"use client";

import type { Series } from "@arcle/api-client";
import { Badge } from "@arcle/ui/components/badge";
import { Image } from "@arcle/ui/components/image";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { BookOpen, Eye } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import type { Route } from "next";
import Link from "next/link";

interface SeriesCardProps {
  series: Series;
}

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link
      href={`/series/${series.slug}` as Route}
      className="group flex flex-col gap-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border/5 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:shadow-lg">
        {series.coverImage ? (
          <Image
            src={series.coverImage}
            alt={series.title}
            containerClassName="h-full w-full"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground/50">
            <BookOpen className="size-8 opacity-50" />
            <span className="text-xs font-medium">No Cover</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {series.status && (
          <Badge
            variant="secondary"
            className="absolute left-2.5 top-2.5 z-10 border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors group-hover:bg-black/80"
          >
            {series.status}
          </Badge>
        )}

        {series.latestChapter && (
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-6">
            <p className="text-xs font-medium text-white/90 truncate">
              Ch. {series.latestChapter.number}
              {series.latestChapter.title && ` - ${series.latestChapter.title}`}
            </p>
            <p className="text-[10px] text-white/60">
              {formatDistanceToNow(new Date(series.latestChapter.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5 px-0.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {series.title}
        </h3>

        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          {series.chapterCount !== undefined && series.chapterCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-1.5 py-0.5 text-secondary-foreground transition-colors group-hover:bg-secondary">
              <BookOpen className="size-3.5" weight="fill" />
              {series.chapterCount}
            </span>
          )}
          {series.viewCount !== undefined && series.viewCount > 0 && (
            <span className="flex items-center gap-1 transition-colors group-hover:text-foreground">
              <Eye className="size-3.5" weight="bold" />
              {series.viewCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SeriesCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[2/3] w-full rounded-xl shadow-sm" />
      <div className="space-y-2 px-0.5">
        <Skeleton className="h-4 w-11/12" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded-md" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
