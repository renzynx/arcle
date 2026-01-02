import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadPagesMutation } from "@/lib/mutations";
import type { PendingFile } from "../_components/pending-file-card";

interface UsePendingFilesOptions {
  chapterId: string;
}

export function usePendingFiles({ chapterId }: UsePendingFilesOptions) {
  const uploadMutation = useUploadPagesMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [pendingActiveId, setPendingActiveId] = useState<string | null>(null);

  useEffect(() => {
    const currentFiles = pendingFiles;
    return () => {
      for (const pf of currentFiles) {
        URL.revokeObjectURL(pf.previewUrl);
      }
    };
  }, [pendingFiles]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPending: PendingFile[] = Array.from(files).map((file) => ({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setPendingFiles((prev) => [...prev, ...newPending]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePendingDragStart = (event: DragStartEvent) => {
    setPendingActiveId(event.active.id as string);
  };

  const handlePendingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setPendingActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = pendingFiles.findIndex((item) => item.id === active.id);
      const newIndex = pendingFiles.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setPendingFiles(arrayMove(pendingFiles, oldIndex, newIndex));
      }
    }
  };

  const handleRemovePending = (id: string) => {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleClearPending = () => {
    for (const pf of pendingFiles) {
      URL.revokeObjectURL(pf.previewUrl);
    }
    setPendingFiles([]);
  };

  const handleConfirmUpload = () => {
    if (pendingFiles.length === 0) return;

    const filesToUpload = pendingFiles.map((pf) => pf.file);
    const toastId = toast.loading(
      `Uploading ${filesToUpload.length} page(s)...`,
    );

    uploadMutation.mutate(
      { chapterId, files: filesToUpload },
      {
        onSuccess: () => {
          toast.success("Pages uploaded successfully", { id: toastId });
          for (const pf of pendingFiles) {
            URL.revokeObjectURL(pf.previewUrl);
          }
          setPendingFiles([]);
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to upload pages";
          toast.error(message, { id: toastId });
        },
      },
    );
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const activePending = pendingActiveId
    ? pendingFiles.find((p) => p.id === pendingActiveId)
    : null;
  const activePendingIndex = pendingActiveId
    ? pendingFiles.findIndex((p) => p.id === pendingActiveId)
    : -1;

  const pendingIds = useMemo(
    () => pendingFiles.map((p) => p.id),
    [pendingFiles],
  );

  return {
    fileInputRef,
    pendingFiles,
    pendingActiveId,
    activePending,
    activePendingIndex,
    pendingIds,
    sensors,
    isUploading: uploadMutation.isPending,
    handleFileChange,
    handlePendingDragStart,
    handlePendingDragEnd,
    handleRemovePending,
    handleClearPending,
    handleConfirmUpload,
    openFilePicker,
  };
}
