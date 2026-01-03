"use client";

import { useApiClient } from "@arcle/auth-client";
import { Button } from "@arcle/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@arcle/ui/components/popover";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchAutocomplete } from "./search-autocomplete";
import { useSiteConfig } from "./site-config-provider";
import { UserButton } from "./user-button";

function genreFilterUrl(genreId: string): string {
  const filter = JSON.stringify({ includeGenres: [genreId] });
  return `/browse?filter=${encodeURIComponent(filter)}`;
}

function GenresList({
  genres,
  isLoading,
}: {
  genres: { id: string; name: string }[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (genres.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No genres found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {genres.map((genre) => (
        <Button
          key={genre.id}
          variant="ghost"
          size="sm"
          className="justify-start h-8 px-2 text-sm font-normal"
          render={<Link href={genreFilterUrl(genre.id) as Route} />}
        >
          {genre.name}
        </Button>
      ))}
    </div>
  );
}

function MobileSearchOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-background border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchAutocomplete
              className="w-full"
              placeholder="Search series..."
              onSelect={onClose}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const apiClient = useApiClient();
  const { siteName } = useSiteConfig();
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: genres = [], isLoading } = useQuery({
    queryKey: ["genres"] as const,
    queryFn: () => apiClient.catalog.getGenres(),
  });

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="text-xl font-bold tracking-tight">
              {siteName}
            </Link>

            <div className="hidden md:flex items-center">
              <Popover>
                <PopoverTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer">
                  Genres
                  <CaretDown className="h-3 w-3" />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-80 max-h-72 overflow-y-auto p-3"
                >
                  <GenresList genres={genres} isLoading={isLoading} />
                </PopoverContent>
              </Popover>
            </div>

            <Popover>
              <PopoverTrigger className="md:hidden flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer text-sm">
                Genres
                <CaretDown className="h-3 w-3" />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-72 max-h-72 overflow-y-auto p-3"
              >
                <GenresList genres={genres} isLoading={isLoading} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 max-w-md hidden sm:block">
            <SearchAutocomplete className="w-full" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <MagnifyingGlass className="h-5 w-5" />
            </Button>

            <UserButton />
          </div>
        </div>
      </nav>

      <MobileSearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
