"use client";

import { Skeleton } from "@arcle/ui/components/skeleton";
import { use } from "react";
import { SeriesForm } from "@/components/series-form";
import { useSeriesQuery } from "@/lib/queries";

export default function EditSeriesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = use(params);
  const { data, isPending, isError } = useSeriesQuery(seriesId);

  if (isPending) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <div>Failed to load series</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Edit Series</h3>
        <p className="text-sm text-muted-foreground">Update series details.</p>
      </div>
      <SeriesForm series={data} />
    </div>
  );
}
