"use client";

import { Button } from "@arcle/ui/components/button";
import { cn } from "@arcle/ui/lib/utils";
import { ArrowUp } from "@phosphor-icons/react";

interface ScrollToTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToTopButton({
  visible,
  onClick,
}: ScrollToTopButtonProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-50 transition-all duration-300 ease-in-out safe-area-inset-bottom",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full w-12 h-12 min-w-[48px] min-h-[48px] shadow-2xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95"
        onClick={onClick}
        aria-label="Scroll to top"
      >
        <ArrowUp weight="bold" className="w-6 h-6" />
      </Button>
    </div>
  );
}
