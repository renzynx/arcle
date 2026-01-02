"use client";

import type { ChapterWithSeries } from "@arcle/api-client";
import { Badge } from "@arcle/ui/components/badge";
import { Button } from "@arcle/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@arcle/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@arcle/ui/components/dropdown-menu";
import { DotsThree, Eye, Images, Pencil, Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useDeleteChapterMutation } from "@/lib/mutations";

function ChapterActionsCell({ chapter }: { chapter: ChapterWithSeries }) {
  const deleteMutation = useDeleteChapterMutation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: chapter.id, seriesId: chapter.seriesId },
      {
        onSuccess: () => {
          toast.success("Chapter deleted");
          setShowDeleteAlert(false);
        },
        onError: (error) => {
          toast.error("Failed to delete chapter");
          console.error(error);
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <DotsThree className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link
                href={`/series/${chapter.seriesId}/chapters/${chapter.id}`}
                className="flex w-full items-center"
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link
                href={`/chapters/${chapter.id}/pages`}
                className="flex w-full items-center"
              >
                <Images className="mr-2 size-4" />
                Manage Pages
              </Link>
            }
          />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              chapter and all its pages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAlert(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const columns: ColumnDef<ChapterWithSeries>[] = [
  {
    accessorKey: "number",
    header: "Chapter",
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="font-mono">
          #{row.original.number}
        </Badge>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      return (
        <Link
          href={`/series/${row.original.seriesId}/chapters/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.title ?? `Chapter ${row.original.number}`}
        </Link>
      );
    },
  },
  {
    accessorKey: "series",
    header: "Series",
    cell: ({ row }) => {
      return (
        <Link
          href={`/series/${row.original.series.id}`}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {row.original.series.title}
        </Link>
      );
    },
  },
  {
    accessorKey: "viewCount",
    header: "Views",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Eye className="size-4" />
          <span>{row.original.viewCount.toLocaleString()}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ChapterActionsCell chapter={row.original} />,
  },
];
