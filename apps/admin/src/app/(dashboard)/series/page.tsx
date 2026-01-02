"use client";

import type { Series } from "@arcle/api-client";
import { Button } from "@arcle/ui/components/button";
import { Card } from "@arcle/ui/components/card";
import { Input } from "@arcle/ui/components/input";
import { Skeleton } from "@arcle/ui/components/skeleton";
import {
  BookOpen,
  Eye,
  List,
  MagnifyingGlass,
  Plus,
  SquaresFour,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { useSeriesListQuery } from "@/lib/queries";
import { columns } from "./columns";

function SeriesGridSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card
          key={i}
          className="aspect-[2/3] w-full relative overflow-hidden rounded-xl border-0 p-0 gap-0"
        >
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4 bg-white/20" />
              <Skeleton className="h-4 w-1/2 bg-white/20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12 bg-white/20" />
              <Skeleton className="h-4 w-12 bg-white/20" />
            </div>
            <Skeleton className="h-9 w-full bg-white/20 mt-2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function SeriesTableSkeleton() {
  return (
    <div>
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex p-4 gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8 ml-auto" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b last:border-0">
            <div className="flex items-center p-4 gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-8" />
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

function SeriesGrid({ series }: { series: Series[] }) {
  if (series.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="size-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium">No series found</h3>
        <p className="text-sm text-muted-foreground">
          Get started by adding your first series.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {series.map((s) => (
        <Card
          key={s.id}
          className="group relative aspect-[2/3] w-full overflow-hidden rounded-xl border-0 bg-muted shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl p-0 gap-0"
        >
          {s.coverImage ? (
            <img
              src={s.coverImage}
              alt={s.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground/20">
              <BookOpen className="size-16" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute right-3 top-3 z-10">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white uppercase tracking-wider text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
              {s.status}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col p-4">
            <Link
              href={`/series/${s.id}`}
              className="group/title focus:outline-none"
            >
              <h3 className="line-clamp-1 text-lg font-bold text-white transition-colors group-hover/title:text-primary">
                {s.title}
              </h3>
            </Link>
            <p className="mt-1 line-clamp-1 text-xs font-medium text-gray-300">
              {s.author ?? "Unknown Author"}
            </p>

            <div className="mt-3 flex items-center gap-4 text-xs font-medium text-gray-400">
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-4" />
                <span>{s.chapterCount ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="size-4" />
                <span>{s.viewCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="secondary"
                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/10 text-white h-9 font-medium"
                render={<Link href={`/series/${s.id}`}>Manage</Link>}
              >
                Manage
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function SeriesPage() {
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const { data, isPending, isError } = useSeriesListQuery({ limit: 50 });

  const series = data?.data ?? [];
  const filteredSeries = search
    ? series.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.author?.toLowerCase().includes(search.toLowerCase()),
      )
    : series;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Series
          </h1>
          <p className="text-muted-foreground">
            Manage your manga and comic series.
            {data && <span className="ml-1">({data.total} total)</span>}
          </p>
        </div>
        <Button render={<Link href="/series/new">Add Series</Link>}>
          <Plus className="mr-2 size-4" />
          Add Series
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search series..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border p-1 self-end">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
          >
            <SquaresFour className="size-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive">Failed to load series.</p>
        </div>
      ) : isPending ? (
        view === "grid" ? (
          <SeriesGridSkeleton />
        ) : (
          <SeriesTableSkeleton />
        )
      ) : filteredSeries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No series found</h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? "No series match your search."
              : "Get started by adding your first series."}
          </p>
        </div>
      ) : view === "list" ? (
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={filteredSeries} />
        </div>
      ) : (
        <SeriesGrid series={filteredSeries} />
      )}
    </div>
  );
}
