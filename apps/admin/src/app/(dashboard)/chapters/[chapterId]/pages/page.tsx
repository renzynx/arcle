"use client";

import { Button } from "@arcle/ui/components/button";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { ArrowLeft, UploadSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import { useDeletePageMutation } from "@/lib/mutations";
import { useChapterQuery, usePagesQuery } from "@/lib/queries";
import { PageCard, SortablePageCard } from "./_components/page-card";
import { PagesGridSkeleton } from "./_components/pages-grid-skeleton";
import {
  PendingFileCard,
  SortablePendingCard,
} from "./_components/pending-file-card";
import { dropAnimation, usePageReorder } from "./_hooks/use-page-reorder";
import { usePendingFiles } from "./_hooks/use-pending-files";

export default function PagesPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = use(params);
  const { data: pages, isPending, isError } = usePagesQuery(chapterId);
  const { data: chapter } = useChapterQuery(chapterId);
  const deleteMutation = useDeletePageMutation();

  const pageReorder = usePageReorder({ pages, chapterId });
  const pending = usePendingFiles({ chapterId });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this page?")) {
      const toastId = toast.loading("Deleting page...");
      deleteMutation.mutate(
        { id, chapterId },
        {
          onSuccess: () => toast.success("Page deleted", { id: toastId }),
          onError: (error) => {
            const message =
              error instanceof Error ? error.message : "Failed to delete page";
            toast.error(message, { id: toastId });
          },
        },
      );
    }
  };

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
                <Link
                  href={
                    chapter ? `/series/${chapter.seriesId}/chapters` : "/series"
                  }
                >
                  <ArrowLeft className="mr-1 size-3" />
                  Back to Chapters
                </Link>
              }
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Manage Pages
          </h1>
          <p className="text-muted-foreground">
            Upload and organize pages for{" "}
            <span className="font-medium text-foreground">
              {chapter ? `Chapter ${chapter.number}` : "Chapter"}
            </span>
          </p>
        </div>
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={pending.fileInputRef}
            onChange={pending.handleFileChange}
          />
          <Button
            onClick={pending.openFilePicker}
            disabled={pending.isUploading}
          >
            <UploadSimple className="mr-2 size-4" />
            Select Pages
          </Button>
        </div>
      </div>

      {pending.pendingFiles.length > 0 && (
        <div className="space-y-4 p-4 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">
                Pending Upload ({pending.pendingFiles.length} files)
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag to reorder before uploading
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={pending.handleClearPending}
                disabled={pending.isUploading}
              >
                Clear All
              </Button>
              <Button
                onClick={pending.handleConfirmUpload}
                disabled={pending.isUploading}
              >
                {pending.isUploading ? "Uploading..." : "Upload All"}
              </Button>
            </div>
          </div>
          <DndContext
            sensors={pending.sensors}
            collisionDetection={closestCenter}
            onDragStart={pending.handlePendingDragStart}
            onDragEnd={pending.handlePendingDragEnd}
          >
            <SortableContext
              items={pending.pendingIds}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pending.pendingFiles.map((item, index) => (
                  <SortablePendingCard
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={pending.handleRemovePending}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={dropAnimation}>
              {pending.activePending ? (
                <PendingFileCard
                  item={pending.activePending}
                  index={pending.activePendingIndex}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {isError ? (
        <div className="text-center py-12 text-destructive">
          Failed to load pages
        </div>
      ) : isPending ? (
        <PagesGridSkeleton />
      ) : pageReorder.items.length === 0 &&
        pending.pendingFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
          <UploadSimple className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No pages yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload images to get started.
          </p>
          <Button variant="outline" onClick={pending.openFilePicker}>
            Select Files
          </Button>
        </div>
      ) : pageReorder.items.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-medium">
            Uploaded Pages ({pageReorder.items.length})
          </h3>
          <DndContext
            sensors={pageReorder.sensors}
            collisionDetection={closestCenter}
            onDragStart={pageReorder.handleDragStart}
            onDragEnd={pageReorder.handleDragEnd}
          >
            <SortableContext
              items={pageReorder.items}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pageReorder.items.map((page, index) => (
                  <SortablePageCard
                    key={page.id}
                    page={page}
                    index={index}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={dropAnimation}>
              {pageReorder.activePage ? (
                <PageCard
                  page={pageReorder.activePage}
                  index={pageReorder.activeIndex}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : null}
    </div>
  );
}
