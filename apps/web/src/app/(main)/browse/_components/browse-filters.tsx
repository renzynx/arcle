import type { Genre, SeriesStatus } from "@arcle/api-client";
import { Badge } from "@arcle/ui/components/badge";
import { Button } from "@arcle/ui/components/button";
import { Input } from "@arcle/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@arcle/ui/components/select";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { Switch } from "@arcle/ui/components/switch";
import { cn } from "@arcle/ui/lib/utils";
import { CaretDown, Faders, MagnifyingGlass, X } from "@phosphor-icons/react";
import type { GenreMode, SortOption } from "./use-browse-filters";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "alphabetical", label: "A-Z" },
  { value: "rating", label: "Rating" },
];

const STATUS_OPTIONS: { value: SeriesStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
  { value: "cancelled", label: "Cancelled" },
];

type BrowseFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  status: SeriesStatus | "all";
  onStatusChange: (value: SeriesStatus | "all") => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (value: boolean) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  genres: Genre[];
  includeGenres: string[];
  excludeGenres: string[];
  genreMode: GenreMode;
  onGenreModeChange: (value: GenreMode) => void;
  onToggleIncludeGenre: (genreId: string) => void;
  onToggleExcludeGenre: (genreId: string) => void;
  minChapters: string;
  onMinChaptersChange: (value: string) => void;
  maxChapters: string;
  onMaxChaptersChange: (value: string) => void;
};

export function BrowseFilters({
  query,
  onQueryChange,
  sort,
  onSortChange,
  status,
  onStatusChange,
  showAdvanced,
  onShowAdvancedChange,
  hasActiveFilters,
  onClearFilters,
  genres,
  includeGenres,
  excludeGenres,
  genreMode,
  onGenreModeChange,
  onToggleIncludeGenre,
  onToggleExcludeGenre,
  minChapters,
  onMinChaptersChange,
  maxChapters,
  onMaxChaptersChange,
}: BrowseFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search series..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={sort}
            onValueChange={(v) => onSortChange(v as SortOption)}
            items={SORT_OPTIONS}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as SeriesStatus | "all")}
            items={STATUS_OPTIONS}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            onClick={() => onShowAdvancedChange(!showAdvanced)}
            className="gap-2"
          >
            <Faders className="h-4 w-4" />
            Advanced
            <CaretDown
              className={cn(
                "h-3 w-3 transition-transform",
                showAdvanced && "rotate-180",
              )}
            />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={onClearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <AdvancedFilters
          genres={genres}
          includeGenres={includeGenres}
          excludeGenres={excludeGenres}
          genreMode={genreMode}
          onGenreModeChange={onGenreModeChange}
          onToggleIncludeGenre={onToggleIncludeGenre}
          onToggleExcludeGenre={onToggleExcludeGenre}
          minChapters={minChapters}
          onMinChaptersChange={onMinChaptersChange}
          maxChapters={maxChapters}
          onMaxChaptersChange={onMaxChaptersChange}
        />
      )}

      <ActiveFiltersBadges
        genres={genres}
        includeGenres={includeGenres}
        excludeGenres={excludeGenres}
        genreMode={genreMode}
        onToggleIncludeGenre={onToggleIncludeGenre}
        onToggleExcludeGenre={onToggleExcludeGenre}
      />
    </div>
  );
}

type AdvancedFiltersProps = {
  genres: Genre[];
  includeGenres: string[];
  excludeGenres: string[];
  genreMode: GenreMode;
  onGenreModeChange: (value: GenreMode) => void;
  onToggleIncludeGenre: (genreId: string) => void;
  onToggleExcludeGenre: (genreId: string) => void;
  minChapters: string;
  onMinChaptersChange: (value: string) => void;
  maxChapters: string;
  onMaxChaptersChange: (value: string) => void;
};

function AdvancedFilters({
  genres,
  includeGenres,
  excludeGenres,
  genreMode,
  onGenreModeChange,
  onToggleIncludeGenre,
  onToggleExcludeGenre,
  minChapters,
  onMinChaptersChange,
  maxChapters,
  onMaxChaptersChange,
}: AdvancedFiltersProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Include Genres</h3>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "text-muted-foreground",
                genreMode === "any" && "text-foreground font-medium",
              )}
            >
              Match Any
            </span>
            <Switch
              checked={genreMode === "all"}
              onCheckedChange={(checked) =>
                onGenreModeChange(checked ? "all" : "any")
              }
            />
            <span
              className={cn(
                "text-muted-foreground",
                genreMode === "all" && "text-foreground font-medium",
              )}
            >
              Match All
            </span>
          </div>
        </div>
        <GenreBadges
          genres={genres}
          selectedGenres={includeGenres}
          variant="include"
          onToggle={onToggleIncludeGenre}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Exclude Genres</h3>
        <GenreBadges
          genres={genres}
          selectedGenres={excludeGenres}
          variant="exclude"
          onToggle={onToggleExcludeGenre}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Chapter Count</h3>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            placeholder="Min"
            value={minChapters}
            onChange={(e) => onMinChaptersChange(e.target.value)}
            className="w-24"
            min={0}
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxChapters}
            onChange={(e) => onMaxChaptersChange(e.target.value)}
            className="w-24"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}

type GenreBadgesProps = {
  genres: Genre[];
  selectedGenres: string[];
  variant: "include" | "exclude";
  onToggle: (genreId: string) => void;
};

function GenreBadges({
  genres,
  selectedGenres,
  variant,
  onToggle,
}: GenreBadgesProps) {
  if (genres.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => {
        const isSelected = selectedGenres.includes(genre.id);
        const badgeVariant =
          variant === "include"
            ? isSelected
              ? "default"
              : "outline"
            : isSelected
              ? "destructive"
              : "outline";

        return (
          <Badge
            key={genre.id}
            variant={badgeVariant}
            className={cn(
              "cursor-pointer transition-colors",
              variant === "include" && "hover:bg-primary/80",
            )}
            onClick={() => onToggle(genre.id)}
          >
            {genre.name}
          </Badge>
        );
      })}
    </div>
  );
}

type ActiveFiltersBadgesProps = {
  genres: Genre[];
  includeGenres: string[];
  excludeGenres: string[];
  genreMode: GenreMode;
  onToggleIncludeGenre: (genreId: string) => void;
  onToggleExcludeGenre: (genreId: string) => void;
};

function ActiveFiltersBadges({
  genres,
  includeGenres,
  excludeGenres,
  genreMode,
  onToggleIncludeGenre,
  onToggleExcludeGenre,
}: ActiveFiltersBadgesProps) {
  if (includeGenres.length === 0 && excludeGenres.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {includeGenres.map((id) => {
        const genre = genres.find((g) => g.id === id);
        return genre ? (
          <Badge key={id} variant="secondary" className="gap-1">
            +{genre.name}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onToggleIncludeGenre(id)}
            />
          </Badge>
        ) : null;
      })}
      {excludeGenres.map((id) => {
        const genre = genres.find((g) => g.id === id);
        return genre ? (
          <Badge key={id} variant="destructive" className="gap-1">
            -{genre.name}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onToggleExcludeGenre(id)}
            />
          </Badge>
        ) : null;
      })}
      {genreMode === "all" && includeGenres.length > 1 && (
        <Badge variant="outline">Must have all</Badge>
      )}
    </div>
  );
}
