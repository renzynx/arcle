"use client";

import type { Chapter } from "@arcle/api-client";
import { Button, buttonVariants } from "@arcle/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@arcle/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@arcle/ui/components/popover";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { cn } from "@arcle/ui/lib/utils";
import {
  ArrowLeft,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  CircleNotch,
} from "@phosphor-icons/react";
import type { Route } from "next";
import Link from "next/link";
import type { RefObject } from "react";

interface ReaderHeaderProps {
  slug: string;
  seriesTitle?: string;
  chapterNumber: number;
  chapterTitle?: string | null;
  isLoading: boolean;
  headerVisible: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  navigateToChapter: (num: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapters: Chapter[];
  chapterListRef: RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function ReaderHeader({
  slug,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  isLoading,
  headerVisible,
  hasPrev,
  hasNext,
  navigateToChapter,
  open,
  onOpenChange,
  chapters,
  chapterListRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: ReaderHeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out border-b border-white/5 bg-zinc-950/90 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/70 safe-area-inset-top",
        headerVisible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 min-w-[44px] min-h-[44px] text-zinc-400 hover:text-white hover:bg-white/10"
            render={
              <Link href={`/series/${slug}` as Route} title="Back to Series">
                <ArrowLeft weight="bold" className="w-5 h-5" />
              </Link>
            }
          />
          <div className="flex flex-col items-start min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-medium text-zinc-200 line-clamp-1 max-w-full">
              {isLoading ? (
                <Skeleton className="h-4 w-24 sm:w-32 bg-zinc-800" />
              ) : (
                seriesTitle || "Loading..."
              )}
            </h1>
            {isLoading ? (
              <Skeleton className="h-3 w-16 mt-1 bg-zinc-800" />
            ) : (
              <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-auto p-0 hover:bg-transparent hover:text-white text-zinc-500 font-mono text-[10px] sm:text-xs gap-1 max-w-full",
                  )}
                >
                  <span className="truncate">
                    Ch. {chapterNumber}
                    <span className="hidden xs:inline">
                      {chapterTitle ? ` - ${chapterTitle}` : ""}
                    </span>
                  </span>
                  <CaretDown className="w-3 h-3 shrink-0" />
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-2rem)] max-w-[320px] p-0 bg-zinc-950 border-white/10 text-zinc-100"
                  align="start"
                  sideOffset={8}
                >
                  <Command className="bg-transparent">
                    <CommandInput
                      placeholder="Search chapter..."
                      className="text-zinc-100 placeholder:text-zinc-500 h-12"
                    />
                    <CommandList
                      className="max-h-[50vh]"
                      ref={chapterListRef}
                      onScroll={(e) => {
                        const target = e.currentTarget;
                        const nearBottom =
                          target.scrollHeight - target.scrollTop <=
                          target.clientHeight + 100;
                        if (nearBottom && hasNextPage && !isFetchingNextPage) {
                          fetchNextPage();
                        }
                      }}
                    >
                      <CommandEmpty>No chapter found.</CommandEmpty>
                      <CommandGroup>
                        {chapters.map((chapter) => (
                          <CommandItem
                            key={chapter.id}
                            onSelect={() => navigateToChapter(chapter.number)}
                            className="text-zinc-300 data-[selected=true]:bg-white/10 data-[selected=true]:text-white cursor-pointer min-h-[44px] py-3"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate">
                                Chapter {chapter.number}
                                {chapter.title ? ` - ${chapter.title}` : ""}
                              </span>
                              {chapter.number === chapterNumber && (
                                <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                        {isFetchingNextPage && (
                          <div className="flex justify-center py-3">
                            <CircleNotch className="w-5 h-5 animate-spin text-zinc-500" />
                          </div>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            disabled={!hasPrev || isLoading}
            onClick={() => navigateToChapter(chapterNumber - 1)}
            className="min-w-[44px] min-h-[44px] text-zinc-400 hover:text-white hover:bg-white/10 sm:hidden"
            aria-label="Previous chapter"
          >
            <CaretLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!hasNext || isLoading}
            onClick={() => navigateToChapter(chapterNumber + 1)}
            className="min-w-[44px] min-h-[44px] text-zinc-400 hover:text-white hover:bg-white/10 sm:hidden"
            aria-label="Next chapter"
          >
            <CaretRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasPrev || isLoading}
            onClick={() => navigateToChapter(chapterNumber - 1)}
            className="hidden sm:flex text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <CaretLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasNext || isLoading}
            onClick={() => navigateToChapter(chapterNumber + 1)}
            className="hidden sm:flex text-zinc-400 hover:text-white hover:bg-white/10"
          >
            Next <CaretRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </header>
  );
}
