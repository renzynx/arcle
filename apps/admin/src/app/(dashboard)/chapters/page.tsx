"use client";

import { Input } from "@arcle/ui/components/input";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { BookOpen, MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { useAllChaptersQuery } from "@/lib/queries";
import { columns } from "./columns";

function ChaptersTableSkeleton() {
  return (
    <div>
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex p-4 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8 ml-auto" />
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b last:border-0">
            <div className="flex items-center p-4 gap-4">
              <Skeleton className="h-5 w-12" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export default function ChaptersPage() {
  const [search, setSearch] = useState("");
  const { data, isPending, isError } = useAllChaptersQuery({ limit: 50 });

  const chapters = data?.data ?? [];
  const filteredChapters = search
    ? chapters.filter(
        (c) =>
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.series.title.toLowerCase().includes(search.toLowerCase()) ||
          String(c.number).includes(search),
      )
    : chapters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Chapters
          </h1>
          <p className="text-muted-foreground">
            View and manage all chapters across all series.
            {data && <span className="ml-1">({data.total} total)</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search chapters..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive">Failed to load chapters.</p>
        </div>
      ) : isPending ? (
        <ChaptersTableSkeleton />
      ) : filteredChapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No chapters found</h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? "No chapters match your search."
              : "No chapters have been created yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={filteredChapters} />
        </div>
      )}
    </div>
  );
}
