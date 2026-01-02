import {
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUpdatePageOrderMutation } from "@/lib/mutations";
import type { Page } from "../_components/page-card";

export const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.3",
      },
    },
  }),
};

interface UsePageReorderOptions {
  pages: Page[] | undefined;
  chapterId: string;
}

export function usePageReorder({ pages, chapterId }: UsePageReorderOptions) {
  const updateOrderMutation = useUpdatePageOrderMutation();
  const [items, setItems] = useState<Page[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (pages) {
      setItems([...pages].sort((a, b) => a.number - b.number));
    }
  }, [pages]);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);

        const updates = newItems
          .map((page, index) => ({ page, newNumber: index + 1 }))
          .filter(({ page, newNumber }) => page.number !== newNumber);

        if (updates.length > 0) {
          let completed = 0;
          let failed = 0;

          for (const { page, newNumber } of updates) {
            updateOrderMutation.mutate(
              { id: page.id, chapterId, number: newNumber },
              {
                onSuccess: () => {
                  completed++;
                  if (completed + failed === updates.length && failed > 0) {
                    toast.error(`Failed to reorder ${failed} page(s)`);
                  }
                },
                onError: () => {
                  failed++;
                  if (completed + failed === updates.length) {
                    toast.error(`Failed to reorder ${failed} page(s)`);
                  }
                },
              },
            );
          }
        }
      }
    }
  };

  const activePage = activeId ? items.find((p) => p.id === activeId) : null;
  const activeIndex = activeId ? items.findIndex((p) => p.id === activeId) : -1;

  return {
    items,
    activeId,
    activePage,
    activeIndex,
    sensors,
    handleDragStart,
    handleDragEnd,
  };
}
