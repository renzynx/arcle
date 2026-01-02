import { Button } from "@arcle/ui/components/button";
import { cn } from "@arcle/ui/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "@phosphor-icons/react";

export interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface PendingFileCardProps {
  item: PendingFile;
  index: number;
  onRemove?: (id: string) => void;
  isOverlay?: boolean;
}

export function PendingFileCard({
  item,
  index,
  onRemove,
  isOverlay,
}: PendingFileCardProps) {
  return (
    <div
      className={cn(
        "group relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-md transition-all duration-300 select-none ring-2 ring-primary/50",
        isOverlay
          ? "cursor-grabbing scale-105 ring-primary rotate-1 z-50 shadow-xl"
          : "cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-xl bg-muted",
      )}
    >
      <img
        src={item.previewUrl}
        alt={`Pending ${index + 1}`}
        className="h-full w-full object-cover pointer-events-none"
      />

      <div className="absolute top-2 left-2 z-10">
        <div className="bg-primary/90 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-md">
          #{index + 1}
        </div>
      </div>

      {!isOverlay && onRemove && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <Button
            variant="destructive"
            size="icon"
            className="shadow-lg"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface SortablePendingCardProps {
  item: PendingFile;
  index: number;
  onRemove: (id: string) => void;
}

export function SortablePendingCard({
  item,
  index,
  onRemove,
}: SortablePendingCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-full"
    >
      <PendingFileCard item={item} index={index} onRemove={onRemove} />
    </div>
  );
}
