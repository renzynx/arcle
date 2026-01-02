"use client";

import { Button } from "@arcle/ui/components/button";
import { Input } from "@arcle/ui/components/input";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { MagnifyingGlass, Plus, Tag } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { useGenresQuery } from "@/lib/queries";
import { columns } from "./columns";

function GenresTableSkeleton() {
  return (
    <div>
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex p-4 gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8 ml-auto" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b last:border-0">
            <div className="flex items-center p-4 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GenresPage() {
  const [search, setSearch] = useState("");
  const { data, isPending, isError } = useGenresQuery();

  const genres = data ?? [];
  const filteredGenres = search
    ? genres.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : genres;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Genres
          </h1>
          <p className="text-muted-foreground">
            Manage genres for your manga and comic series.
            {data && <span className="ml-1">({data.length} total)</span>}
          </p>
        </div>
        <Button render={<Link href="/genres/new">Add Genre</Link>}>
          <Plus className="mr-2 size-4" />
          Add Genre
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search genres..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive">Failed to load genres.</p>
        </div>
      ) : isPending ? (
        <GenresTableSkeleton />
      ) : filteredGenres.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No genres found</h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? "No genres match your search."
              : "Get started by adding your first genre."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={filteredGenres} />
        </div>
      )}
    </div>
  );
}
