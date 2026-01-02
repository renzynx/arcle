"use client";

import type { Series } from "@arcle/api-client";
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
import { Image } from "@arcle/ui/components/image";
import { DotsThree, Pencil, Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useDeleteSeriesMutation } from "@/lib/mutations";

function SeriesActionsCell({ series }: { series: Series }) {
  const deleteMutation = useDeleteSeriesMutation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate(series.id, {
      onSuccess: () => {
        toast.success("Series deleted");
        setShowDeleteAlert(false);
      },
      onError: (error) => {
        toast.error("Failed to delete series");
        console.error(error);
      },
    });
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
                href={`/series/${series.id}`}
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
                href={`/series/${series.id}/chapters`}
                className="flex w-full items-center"
              >
                <Pencil className="mr-2 size-4" />
                Manage Chapters
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
              series and all its chapters.
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

export const columns: ColumnDef<Series>[] = [
  {
    accessorKey: "coverImage",
    header: "Cover",
    cell: ({ row }) => {
      return (
        <div className="relative aspect-[2/3] w-12 overflow-hidden rounded-md bg-muted">
          {row.original.coverImage ? (
            <Image
              src={row.original.coverImage}
              alt={row.original.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No Cover
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      return (
        <Link
          href={`/series/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.title}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={
            status === "ongoing"
              ? "default"
              : status === "completed"
                ? "secondary"
                : "outline"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "chapterCount",
    header: "Chapters",
    cell: ({ row }) => {
      return row.original.chapterCount ?? 0;
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
    cell: ({ row }) => <SeriesActionsCell series={row.original} />,
  },
];
