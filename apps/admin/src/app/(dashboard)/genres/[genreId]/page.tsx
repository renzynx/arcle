"use client";

import { Skeleton } from "@arcle/ui/components/skeleton";
import { useParams } from "next/navigation";
import { GenreForm } from "@/components/genre-form";
import { useGenreQuery } from "@/lib/queries";

function EditGenreSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-8">
        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}

export default function EditGenrePage() {
  const params = useParams<{ genreId: string }>();
  const { data: genre, isPending, isError } = useGenreQuery(params.genreId);

  if (isPending) {
    return <EditGenreSkeleton />;
  }

  if (isError || !genre) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive">Genre not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Edit Genre</h3>
        <p className="text-sm text-muted-foreground">
          Update genre information.
        </p>
      </div>
      <GenreForm genre={genre} />
    </div>
  );
}
