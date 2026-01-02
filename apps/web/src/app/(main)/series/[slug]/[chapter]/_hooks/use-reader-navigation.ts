"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UseReaderNavigationOptions {
  slug: string;
  chapterNumber: number;
  totalChapters: number;
  onChapterChange?: () => void;
}

export function useReaderNavigation({
  slug,
  chapterNumber,
  totalChapters,
  onChapterChange,
}: UseReaderNavigationOptions) {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      setShowScrollTop(currentScrollY > 500);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToChapter = useCallback(
    (num: number) => {
      if (num < 1) return;
      onChapterChange?.();
      router.push(`/series/${slug}/chapter-${num}` as Route);
    },
    [router, slug, onChapterChange],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && chapterNumber > 1) {
        navigateToChapter(chapterNumber - 1);
      } else if (e.key === "ArrowRight" && chapterNumber < totalChapters) {
        navigateToChapter(chapterNumber + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapterNumber, totalChapters, navigateToChapter]);

  const hasPrev = chapterNumber > 1;
  const hasNext = chapterNumber < totalChapters;

  return {
    headerVisible,
    showScrollTop,
    scrollToTop,
    navigateToChapter,
    hasPrev,
    hasNext,
  };
}
