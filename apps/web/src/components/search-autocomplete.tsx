"use client";

import type { Series } from "@arcle/api-client";
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompletePortal,
  AutocompletePositioner,
} from "@arcle/ui/components/autocomplete";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api";

interface SearchAutocompleteProps {
  className?: string;
  placeholder?: string;
  onSelect?: () => void;
}

export function SearchAutocomplete({
  className,
  placeholder = "Search series...",
  onSelect,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!inputValue.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const response = await apiClient.catalog.searchSeries({
          q: inputValue.trim(),
          limit: 6,
        });
        setResults(response.data);
      } catch {
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [inputValue]);

  const handleSelect = useCallback(
    (series: Series) => {
      router.push(`/series/${series.slug}`);
      setInputValue("");
      setResults([]);
      onSelect?.();
    },
    [router, onSelect],
  );

  return (
    <Autocomplete
      value={inputValue}
      onValueChange={(val) => setInputValue(val)}
      items={results}
      itemToStringValue={(series: Series) => series.title}
      mode="none"
    >
      <div className={className}>
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <AutocompleteInput
            placeholder={placeholder}
            className="pl-8 pr-8 h-9 w-full"
          />
          {isLoading && (
            <Spinner className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      <AutocompletePortal>
        <AutocompletePositioner sideOffset={4} align="start">
          <AutocompletePopup className="w-[var(--anchor-width)] min-w-[280px]">
            {results.length === 0 && (
              <AutocompleteEmpty>
                {inputValue.trim() ? "No series found" : "Type to search..."}
              </AutocompleteEmpty>
            )}
            <AutocompleteList>
              {(series: Series) => (
                <AutocompleteItem
                  key={series.id}
                  value={series}
                  onClick={() => handleSelect(series)}
                  className="flex items-center gap-3 p-2 cursor-pointer"
                >
                  {series.coverImage ? (
                    <img
                      src={series.coverImage}
                      alt=""
                      className="h-12 w-9 object-cover rounded-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-9 bg-muted rounded-sm flex-shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm truncate">
                      {series.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {series.chapterCount ?? 0} chapters • {series.status}
                    </span>
                  </div>
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompletePopup>
        </AutocompletePositioner>
      </AutocompletePortal>
    </Autocomplete>
  );
}
