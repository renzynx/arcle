"use client";

import type { Chapter } from "@arcle/api-client";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@arcle/ui/components/dropdown-menu";
import { DotsThree, Files, Pencil, Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteChapterMutation } from "@/lib/mutations";

function ChapterActionsCell({ chapter }: { chapter: Chapter }) {
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
          <DropdownMenuItem
            render={
              <Link
                href={`/series/${chapter.seriesId}/chapters/${chapter.id}`}
                className="flex w-full items-center"
              >
                <Pencil className="mr-2 size-4" />
                Edit Details
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link
                href={`/chapters/${chapter.id}/pages`}
                className="flex w-full items-center"
              >
                <Files className="mr-2 size-4" />
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

export const columns: ColumnDef<Chapter>[] = [
  {
    accessorKey: "number",
    header: "Number",
    cell: ({ row }) => (
      <span className="font-mono">#{row.original.number}</span>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title || "Untitled"}</span>
    ),
  },
  {
    accessorKey: "viewCount",
    header: "Views",
    cell: ({ row }) => row.original.viewCount.toLocaleString(),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => <ChapterActionsCell chapter={row.original} />,
  },
];
