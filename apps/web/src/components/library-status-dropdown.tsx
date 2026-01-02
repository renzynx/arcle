"use client";

import type { LibraryStatus } from "@arcle/api-client";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@arcle/ui/components/dropdown-menu";
import {
  BookOpen,
  CaretDown,
  Check,
  CircleNotch,
  Clock,
  Pause,
  Trash,
  X,
} from "@phosphor-icons/react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  useRemoveFromLibraryMutation,
  useUpdateLibraryStatusMutation,
} from "@/hooks/use-library";

const STATUS_CONFIG: Record<LibraryStatus, { label: string; icon: ReactNode }> =
  {
    reading: { label: "Reading", icon: <BookOpen className="size-4" /> },
    planning: { label: "Plan to Read", icon: <Clock className="size-4" /> },
    completed: { label: "Completed", icon: <Check className="size-4" /> },
    on_hold: { label: "On Hold", icon: <Pause className="size-4" /> },
    dropped: { label: "Dropped", icon: <X className="size-4" /> },
  };

const STATUS_ORDER: LibraryStatus[] = [
  "reading",
  "planning",
  "completed",
  "on_hold",
  "dropped",
];

interface LibraryStatusDropdownProps {
  seriesId: string;
  currentStatus: LibraryStatus;
  variant?: "default" | "compact";
}

export function LibraryStatusDropdown({
  seriesId,
  currentStatus,
  variant = "default",
}: LibraryStatusDropdownProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const updateStatus = useUpdateLibraryStatusMutation();
  const removeFromLibrary = useRemoveFromLibraryMutation();

  const isPending = updateStatus.isPending || removeFromLibrary.isPending;

  const handleStatusChange = (status: string) => {
    if (status === currentStatus) return;
    updateStatus.mutate(
      { seriesId, status: status as LibraryStatus },
      {
        onSuccess: () => {
          toast.success(
            `Status updated to ${STATUS_CONFIG[status as LibraryStatus].label}`,
          );
        },
        onError: () => {
          toast.error("Failed to update status");
        },
      },
    );
  };

  const handleRemove = () => {
    removeFromLibrary.mutate(seriesId, {
      onSuccess: () => {
        toast.success("Removed from library");
        setShowRemoveDialog(false);
      },
      onError: () => {
        toast.error("Failed to remove from library");
      },
    });
  };

  const safeStatus = STATUS_CONFIG[currentStatus] ? currentStatus : "reading";
  const config = STATUS_CONFIG[safeStatus];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size={variant === "compact" ? "sm" : "default"}
              disabled={isPending}
              className="gap-1.5"
            />
          }
        >
          {isPending ? (
            <CircleNotch className="size-4 animate-spin" />
          ) : (
            config.icon
          )}
          {variant === "default" && (
            <>
              <span>{config.label}</span>
              <CaretDown className="size-3 opacity-50" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={safeStatus}
            onValueChange={handleStatusChange}
          >
            {STATUS_ORDER.map((status) => {
              const statusConfig = STATUS_CONFIG[status];
              return (
                <DropdownMenuRadioItem key={status} value={status}>
                  <span className="mr-2">{statusConfig.icon}</span>
                  {statusConfig.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowRemoveDialog(true)}
          >
            <Trash className="size-4 mr-2" />
            Remove from Library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove from Library</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this series from your library?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeFromLibrary.isPending}
            >
              {removeFromLibrary.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
