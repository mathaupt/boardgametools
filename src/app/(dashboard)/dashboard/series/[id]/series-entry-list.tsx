"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { FilterSortBar } from "./filter-sort-bar";
import { SeriesEntryCard } from "./series-entry-card";
import type { SeriesEntry, PlayedFilter, DifficultyFilter, EntrySortOption } from "./types";
import { DIFFICULTY_ORDER } from "./types";

interface SeriesEntryListProps {
  entries: SeriesEntry[];
  expandedEntry: string | null;
  onToggleExpanded: (id: string) => void;
  onAddClick: () => void;
  onTogglePlayed: (entry: SeriesEntry) => void;
  onMoveEntry: (entry: SeriesEntry, direction: "up" | "down") => void;
  onRatingChange: (entry: SeriesEntry, rating: number | null) => void;
  onDifficultyChange: (entry: SeriesEntry, difficulty: string | null) => void;
  onPlayDetailChange: (entry: SeriesEntry, field: string, value: unknown) => void;
  onDeleteEntry: (entry: SeriesEntry) => void;
}

export function SeriesEntryList({
  entries,
  expandedEntry,
  onToggleExpanded,
  onAddClick,
  onTogglePlayed,
  onMoveEntry,
  onRatingChange,
  onDifficultyChange,
  onPlayDetailChange,
  onDeleteEntry,
}: SeriesEntryListProps) {
  const [search, setSearch] = useState("");
  const [playedFilter, setPlayedFilter] = useState<PlayedFilter>("alle");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("alle");
  const [sortOption, setSortOption] = useState<EntrySortOption>("sortOrder");

  const hasActiveFilters = search.trim() !== "" || playedFilter !== "alle" || difficultyFilter !== "alle";
  const isCustomSort = sortOption !== "sortOrder";

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((e) => e.game.name.toLowerCase().includes(q));
    }

    if (playedFilter === "gespielt") {
      result = result.filter((e) => e.played);
    } else if (playedFilter === "offen") {
      result = result.filter((e) => !e.played);
    }

    if (difficultyFilter !== "alle") {
      result = result.filter((e) => e.difficulty === difficultyFilter);
    }

    switch (sortOption) {
      case "sortOrder":
        result.sort((a, b) => a.sortOrder - b.sortOrder);
        break;
      case "name_asc":
        result.sort((a, b) => a.game.name.localeCompare(b.game.name, "de"));
        break;
      case "name_desc":
        result.sort((a, b) => b.game.name.localeCompare(a.game.name, "de"));
        break;
      case "rating_desc":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "difficulty":
        result.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty ?? ""] ?? 99) - (DIFFICULTY_ORDER[b.difficulty ?? ""] ?? 99));
        break;
    }

    return result;
  }, [entries, search, playedFilter, difficultyFilter, sortOption]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setPlayedFilter("alle");
    setDifficultyFilter("alle");
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Spiele</h2>
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Spiel hinzufügen
        </Button>
      </div>

      {entries.length > 0 && (
        <FilterSortBar
          search={search}
          onSearchChange={setSearch}
          playedFilter={playedFilter}
          onPlayedFilterChange={setPlayedFilter}
          difficultyFilter={difficultyFilter}
          onDifficultyFilterChange={setDifficultyFilter}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          filteredCount={filteredEntries.length}
          totalCount={entries.length}
          hasActiveFilters={hasActiveFilters}
          isCustomSort={isCustomSort}
          onResetFilters={resetFilters}
        />
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Spiele</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Füge Spiele aus deiner Sammlung oder per BGG-Import hinzu.
            </p>
            <Button onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Spiel hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Treffer</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Kein Spiel entspricht deinen Filterkriterien.
            </p>
            <button
              onClick={resetFilters}
              className="text-sm text-primary hover:underline"
            >
              Filter zurücksetzen
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry, idx) => {
            const originalIdx = entries.findIndex((e) => e.id === entry.id);
            const canReorder = sortOption === "sortOrder" && !hasActiveFilters;
            return (
              <SeriesEntryCard
                key={entry.id}
                entry={entry}
                displayIndex={idx}
                originalIndex={originalIdx}
                totalEntries={entries.length}
                canReorder={canReorder}
                isExpanded={expandedEntry === entry.id}
                onToggleExpanded={() => onToggleExpanded(entry.id)}
                onTogglePlayed={onTogglePlayed}
                onMoveEntry={onMoveEntry}
                onRatingChange={onRatingChange}
                onDifficultyChange={onDifficultyChange}
                onPlayDetailChange={onPlayDetailChange}
                onDelete={onDeleteEntry}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
