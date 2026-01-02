"use client";

import { Button } from "@arcle/ui/components/button";
import { FloppyDisk } from "@phosphor-icons/react";

interface FloatingSaveBarProps {
  show: boolean;
  isSubmitting: boolean;
}

export function FloatingSaveBar({ show, isSubmitting }: FloatingSaveBarProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm transition-all duration-300 ${
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Unsaved changes</span>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="sm"
          className="rounded-full"
        >
          <FloppyDisk className="mr-2 size-4" />
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
