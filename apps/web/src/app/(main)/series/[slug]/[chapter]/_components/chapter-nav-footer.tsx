"use client";

import { Button } from "@arcle/ui/components/button";
import { ArrowLeft, ArrowRight, List } from "@phosphor-icons/react";
import type { Route } from "next";
import Link from "next/link";

interface ChapterNavFooterProps {
  slug: string;
  hasPrev: boolean;
  hasNext: boolean;
  navigateToChapter: (direction: number) => void;
  chapterNumber: number;
}

export function ChapterNavFooter({
  slug,
  hasPrev,
  hasNext,
  navigateToChapter,
  chapterNumber,
}: ChapterNavFooterProps) {
  return (
    <div className="w-full sm:max-w-3xl mt-8 sm:mt-12 px-3 sm:px-4 space-y-6 sm:space-y-8">
      <div className="flex flex-row items-stretch gap-3 sm:gap-4">
        <Button
          variant="outline"
          className="flex-1 h-14 sm:h-12 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors active:scale-[0.98] text-sm sm:text-base"
          disabled={!hasPrev}
          onClick={() => navigateToChapter(chapterNumber - 1)}
        >
          <ArrowLeft className="w-5 h-5 mr-2 shrink-0" />
          <span className="hidden sm:inline">Previous Chapter</span>
          <span className="sm:hidden">Prev</span>
        </Button>

        <Button
          variant="default"
          className="flex-1 h-14 sm:h-12 bg-white text-black hover:bg-zinc-200 transition-colors font-medium active:scale-[0.98] text-sm sm:text-base"
          disabled={!hasNext}
          onClick={() => navigateToChapter(chapterNumber + 1)}
        >
          <span className="hidden sm:inline">Next Chapter</span>
          <span className="sm:hidden">Next</span>
          <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
        </Button>
      </div>

      <div className="text-center pb-6 sm:pb-8">
        <Link
          href={`/series/${slug}` as Route}
          className="inline-flex items-center text-zinc-500 hover:text-indigo-400 transition-colors text-sm min-h-[44px] px-4"
        >
          <List className="w-4 h-4 mr-2" />
          Return to Series Overview
        </Link>
      </div>
    </div>
  );
}
