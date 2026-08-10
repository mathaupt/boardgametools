"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowUpDown,
  Filter,
  X,
} from "lucide-react";
import type { PlayedFilter, DifficultyFilter, EntrySortOption } from "./types";

const PLAYED_OPTIONS: { value: PlayedFilter; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "gespielt", label: "Gespielt" },
  { value: "offen", label: "Offen" },
];

const DIFFICULTY_FILTER_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "einsteiger", label: "Einsteiger" },
  { value: "fortgeschritten", label: "Fortgeschritten" },
  { value: "profi", label: "Profi" },
];

const SORT_OPTIONS: { value: EntrySortOption; label: string }[] = [
  { value: "sortOrder", label: "Reihenfolge" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "rating_desc", label: "Beste Bewertung" },
  { value: "difficulty", label: "Schwierigkeit" },
];

interface FilterSortBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  playedFilter: PlayedFilter;
  onPlayedFilterChange: (value: PlayedFilter) => void;
  difficultyFilter: DifficultyFilter;
  onDifficultyFilterChange: (value: DifficultyFilter) => void;
  sortOption: EntrySortOption;
  onSortOptionChange: (value: EntrySortOption) => void;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  isCustomSort: boolean;
  onResetFilters: () => void;
}

export function FilterSortBar({
  search,
  onSearchChange,
  playedFilter,
  onPlayedFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  sortOption,
  onSortOptionChange,
  filteredCount,
  totalCount,
  hasActiveFilters,
  isCustomSort,
  onResetFilters,
}: FilterSortBarProps) {
  return (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Spiel suchen…"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 h-9"
                  aria-label="Spiel suchen"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onSearchChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Suche leeren"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" aria-hidden="true" />
                <Select value={playedFilter} onValueChange={(v) => onPlayedFilterChange(v as PlayedFilter)}>
                  <SelectTrigger className="h-9 w-full sm:min-w-[100px] sm:w-auto" aria-label="Status filtern">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYED_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <Select value={difficultyFilter} onValueChange={(v) => onDifficultyFilterChange(v as DifficultyFilter)}>
                <SelectTrigger className="h-9 w-full sm:min-w-[130px] sm:w-auto" aria-label="Schwierigkeit filtern">
                  <SelectValue placeholder="Schwierigkeit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Schwierigkeit</SelectItem>
                  {DIFFICULTY_FILTER_OPTIONS.slice(1).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" aria-hidden="true" />
                <Select value={sortOption} onValueChange={(v) => onSortOptionChange(v as EntrySortOption)}>
                  <SelectTrigger className="h-9 w-full sm:min-w-[160px] sm:w-auto" aria-label="Sortierung">
                    <SelectValue placeholder="Sortierung" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter indicator + reset */}
            {(hasActiveFilters || isCustomSort) && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {filteredCount} von {totalCount} Spiele
                </span>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    size="xs"
                    onClick={onResetFilters}
                    className="text-xs text-primary h-auto p-0"
                  >
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
  );
}
