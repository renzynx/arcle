"use client";

import { Button } from "@arcle/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@arcle/ui/components/dialog";
import {
  CheckSquare,
  ClockCounterClockwise,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  useBulkRemoveHistoryMutation,
  useClearHistoryMutation,
} from "@/hooks/use-library";
import { apiClient } from "@/lib/api";
import { HistoryItemCard } from "./history-item-card";

export function HistoryTab() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["history"] as const,
    queryFn: () => apiClient.users.getHistory(),
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const bulkRemove = useBulkRemoveHistoryMutation();
  const clearHistory = useClearHistoryMutation();

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
    setSelectedIds(new Set(history.map((item) => item.seriesId)));
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
          `Removed ${selectedIds.size} ${selectedIds.size === 1 ? "item" : "items"} from history`,
        );
        clearSelection();
        setShowDeleteDialog(false);
      },
      onError: () => {
        toast.error("Failed to remove from history");
      },
    });
  };

  const handleClearAll = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        toast.success("Reading history cleared");
        clearSelection();
        setShowClearAllDialog(false);
      },
      onError: () => {
        toast.error("Failed to clear history");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-lg">
            <div className="h-20 w-14 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClockCounterClockwise className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No reading history</h3>
        <p className="text-muted-foreground">
          Your reading progress will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {!isSelectMode ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectMode(true)}
            >
              <CheckSquare className="size-4 mr-1" />
              Select
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearAllDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash className="size-4 mr-1" />
              Clear All
            </Button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <HistoryItemCard
            key={item.id}
            item={item}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(item.seriesId)}
            onToggleSelect={() => toggleSelect(item.seriesId)}
          />
        ))}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove from History</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "item" : "items"} from your reading
              history? This action cannot be undone.
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

      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Clear Reading History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear your entire reading history? This
              will remove all {history.length}{" "}
              {history.length === 1 ? "entry" : "entries"}. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={clearHistory.isPending}
            >
              {clearHistory.isPending ? "Clearing..." : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
