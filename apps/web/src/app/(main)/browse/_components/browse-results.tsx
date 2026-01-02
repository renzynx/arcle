import type { Series } from "@arcle/api-client";
import { Button } from "@arcle/ui/components/button";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { SeriesCard, SeriesCardSkeleton } from "@/components/series-card";
import { ITEMS_PER_PAGE } from "./use-browse-filters";

type BrowseResultsProps = {
  series: Series[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isInitialLoad: boolean;
};

export function BrowseResults({
  series,
  total,
  page,
  onPageChange,
  isLoading,
  isInitialLoad,
}: BrowseResultsProps) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading ? (
            <Skeleton className="h-4 w-32 inline-block" />
          ) : (
            `${total.toLocaleString()} series found`
          )}
        </span>
        {totalPages > 1 && (
          <span>
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {isInitialLoad || isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <SeriesCardSkeleton key={i} />
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MagnifyingGlass className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No series found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1 || isLoading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page === totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
