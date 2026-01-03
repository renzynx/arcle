"use client";

import { useApiClient } from "@arcle/auth-client";
import { Button } from "@arcle/ui/components/button";
import { Checkbox } from "@arcle/ui/components/checkbox";
import { Trash } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRemoveHistoryMutation } from "@/hooks/use-library";

interface HistoryItemCardProps {
  item: { id: string; seriesId: string; chapterNumber: string; readAt: Date };
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function HistoryItemCard({
  item,
  isSelectMode,
  isSelected,
  onToggleSelect,
}: HistoryItemCardProps) {
  const apiClient = useApiClient();
  const { data: series } = useQuery({
    queryKey: ["series", item.seriesId] as const,
    queryFn: () => apiClient.catalog.getSeriesById(item.seriesId),
  });
  const removeHistory = useRemoveHistoryMutation();

  const readAtFormatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(item.readAt));

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeHistory.mutate(item.seriesId);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectMode) {
      e.preventDefault();
      onToggleSelect();
    }
  };

  return (
    <a
      href={series ? `/series/${series.slug}/${item.chapterNumber}` : "#"}
      className={`flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={handleClick}
    >
      {isSelectMode && (
        <div className="flex items-center">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        </div>
      )}
      {series?.coverImage ? (
        <img
          src={series.coverImage}
          alt=""
          className="h-20 w-14 object-cover rounded"
        />
      ) : (
        <div className="h-20 w-14 bg-muted rounded" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">
          {series?.title || "Loading..."}
        </h4>
        <p className="text-sm text-muted-foreground">
          Chapter {item.chapterNumber}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{readAtFormatted}</p>
      </div>
      {!isSelectMode && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          disabled={removeHistory.isPending}
        >
          <Trash className="size-4" />
        </Button>
      )}
    </a>
  );
}
