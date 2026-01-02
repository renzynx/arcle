"use client";

import { Image } from "@arcle/ui/components/image";

interface Page {
  id: string;
  chapterId: string;
  number: number;
  imageUrl: string;
}

interface PageGalleryProps {
  pages: Page[];
  isLoading: boolean;
}

export function PageGallery({ pages, isLoading }: PageGalleryProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm animate-pulse">
            Loading Pages...
          </p>
        </div>
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-zinc-500 px-4 text-center">
        No pages found for this chapter.
      </div>
    );
  }

  const sortedPages = [...pages].sort((a, b) => a.number - b.number);

  return (
    <>
      {sortedPages.map((page, index) => (
        <div key={page.id} className="relative w-full">
          <Image
            src={page.imageUrl}
            alt={`Page ${page.number}`}
            className="w-full h-auto block select-none"
            loading={index < 3 ? "eager" : "lazy"}
            draggable={false}
          />
        </div>
      ))}
    </>
  );
}
