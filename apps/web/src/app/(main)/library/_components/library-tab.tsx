"use client";

import type {
  LibraryItem,
  LibraryStatus,
  SeriesWithChapters,
} from "@arcle/api-client";
import { Button } from "@arcle/ui/components/button";
import { Checkbox } from "@arcle/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@arcle/ui/components/dialog";
import { Books, CheckSquare, Trash, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LibraryStatusDropdown } from "@/components/library-status-dropdown";
import { SeriesCard, SeriesCardSkeleton } from "@/components/series-card";
import { useBulkRemoveFromLibraryMutation } from "@/hooks/use-library";
import { apiClient } from "@/lib/api";

const STATUS_LABELS: Record<LibraryStatus, string> = {
  reading: "Reading",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  planning: "Plan to Read",
};

const STATUS_ORDER: LibraryStatus[] = [
  "reading",
  "planning",
  "completed",
  "on_hold",
  "dropped",
];

type LibraryItemWithSeries = LibraryItem & { series?: SeriesWithChapters };

function useLibraryWithSeries() {
  const { data: libraryItems = [], isLoading: isLoadingLibrary } = useQuery({
    queryKey: ["library"] as const,
    queryFn: () => apiClient.users.getLibrary(),
  });

  const seriesIds = libraryItems.map((item) => item.seriesId);

  const { data: allSeries = [], isLoading: isLoadingSeries } = useQuery({
    queryKey: ["series", "batch", seriesIds] as const,
    queryFn: async () => {
      if (seriesIds.length === 0) return [];
      const results = await Promise.all(
        seriesIds.map((id) =>
          apiClient.catalog.getSeriesById(id).catch(() => null),
        ),
      );
      return results.filter((s): s is SeriesWithChapters => s !== null);
    },
    enabled: seriesIds.length > 0,
  });

  const seriesMap = new Map(allSeries.map((s) => [s.id, s]));

  const enrichedItems: LibraryItemWithSeries[] = libraryItems.map((item) => ({
    ...item,
    series: seriesMap.get(item.seriesId),
  }));

  return {
    items: enrichedItems,
    isLoading: isLoadingLibrary || (seriesIds.length > 0 && isLoadingSeries),
  };
}

export function LibraryTab() {
  const { items, isLoading } = useLibraryWithSeries();
  const [statusFilter, setStatusFilter] = useState<LibraryStatus | "all">(
    "all",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const bulkRemove = useBulkRemoveFromLibraryMutation();

  const filteredItems =
    statusFilter === "all"
      ? items
      : items.filter((item) => item.status === statusFilter);

  const statusCounts = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<LibraryStatus, number>,
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map((item) => item.seriesId)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkRemove.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        toast.success(
          `Removed ${selectedIds.size} ${selectedIds.size === 1 ? "series" : "series"} from library`,
        );
        clearSelection();
        setShowDeleteDialog(false);
      },
      onError: () => {
        toast.error("Failed to remove series from library");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 bg-muted rounded-md animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <SeriesCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Books className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">Your library is empty</h3>
        <p className="text-muted-foreground">
          Start adding series to your library while browsing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All ({items.length})
          </Button>
          {STATUS_ORDER.map((status) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            return (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {STATUS_LABELS[status]} ({count})
              </Button>
            );
          })}
        </div>
        {!isSelectMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSelectMode(true)}
          >
            <CheckSquare className="size-4 mr-1" />
            Select
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={selectedIds.size === 0}
            >
              <Trash className="size-4 mr-1" />
              Delete ({selectedIds.size})
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No series with this status
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredItems.map((item) =>
            item.series ? (
              <div key={item.seriesId} className="flex flex-col gap-2 relative">
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedIds.has(item.seriesId)}
                      onCheckedChange={() => toggleSelect(item.seriesId)}
                      className="bg-background/80 backdrop-blur-sm"
                    />
                  </div>
                )}
                <div
                  className={
                    isSelectMode && selectedIds.has(item.seriesId)
                      ? "ring-2 ring-primary rounded-xl"
                      : ""
                  }
                  onClick={
                    isSelectMode ? () => toggleSelect(item.seriesId) : undefined
                  }
                >
                  <SeriesCard series={item.series} />
                </div>
                {!isSelectMode && (
                  <LibraryStatusDropdown
                    seriesId={item.seriesId}
                    currentStatus={item.status}
                    variant="compact"
                  />
                )}
              </div>
            ) : null,
          )}
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove from Library</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "series" : "series"} from your library?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkRemove.isPending}
            >
              {bulkRemove.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
