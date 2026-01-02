"use client";

import { Button } from "@arcle/ui/components/button";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { ArrowLeft, Files, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { use } from "react";
import { DataTable } from "@/components/data-table";
import { useSeriesQuery } from "@/lib/queries";
import { columns } from "./columns";

function ChaptersTableSkeleton() {
  return (
    <div>
      <div className="flex items-center py-4">
        <Skeleton className="h-10 max-w-sm w-full" />
      </div>
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex p-4 gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8 ml-auto" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b last:border-0">
            <div className="flex items-center p-4 gap-4">
              <Skeleton className="h-5 w-8" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SeriesChaptersPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = use(params);
  const { data: series, isPending, isError } = useSeriesQuery(seriesId);

  const chapters = series?.chapters ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 -ml-2 text-muted-foreground"
              render={
                <Link href="/series">
                  <ArrowLeft className="mr-1 size-3" />
                  Back to Series
                </Link>
              }
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isPending ? <Skeleton className="h-8 w-64" /> : series?.title}
            <span className="text-muted-foreground font-normal ml-2">
              Chapters
            </span>
          </h1>
          <p className="text-muted-foreground">
            Manage chapters for this series.
          </p>
        </div>
        <Button
          render={
            <Link href={`/series/${seriesId}/chapters/new`}>Add Chapter</Link>
          }
        >
          <Plus className="mr-2 size-4" />
          Add Chapter
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive">Failed to load chapters.</p>
        </div>
      ) : isPending ? (
        <ChaptersTableSkeleton />
      ) : chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Files className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No chapters found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding the first chapter.
          </p>
          <Button
            render={
              <Link href={`/series/${seriesId}/chapters/new`}>
                Create Chapter
              </Link>
            }
          >
            <Plus className="mr-2 size-4" />
            Create Chapter
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={chapters} searchKey="title" />
        </div>
      )}
    </div>
  );
}
