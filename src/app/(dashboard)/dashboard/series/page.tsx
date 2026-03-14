"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Library, ImageIcon, CheckCircle2, Circle, Search, ArrowUpDown, Filter, X } from "lucide-react";

interface SeriesEntry {
  id: string;
  played: boolean;
  difficulty: string | null;
  game: { imageUrl: string | null };
}

interface GameSeries {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  entries: SeriesEntry[];
  _count: { entries: number; played: number };
}

type StatusFilter = "alle" | "in_progress" | "komplett" | "leer";
type SortOption = "name_asc" | "name_desc" | "progress_asc" | "progress_desc" | "entries_desc" | "newest" | "oldest";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "in_progress", label: "In Arbeit" },
  { value: "komplett", label: "Komplett" },
  { value: "leer", label: "Noch leer" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name_asc", label: "Name (A\u2013Z)" },
  { value: "name_desc", label: "Name (Z\u2013A)" },
  { value: "progress_desc", label: "Fortschritt (hoch \u2192 niedrig)" },
  { value: "progress_asc", label: "Fortschritt (niedrig \u2192 hoch)" },
  { value: "entries_desc", label: "Meiste Spiele" },
  { value: "newest", label: "Neueste zuerst" },
  { value: "oldest", label: "\u00c4lteste zuerst" },
];

function getProgress(series: GameSeries) {
  const total = series._count.entries;
  const played = series._count.played;
  return total > 0 ? played / total : 0;
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<GameSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alle");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");

  const loadSeries = useCallback(async () => {
    const res = await fetch("/api/series");
    if (res.ok) {
      setSeriesList(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSeries(); }, [loadSeries]);

  const filteredAndSorted = useMemo(() => {
    let result = [...seriesList];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "alle") {
      result = result.filter((s) => {
        const total = s._count.entries;
        const played = s._count.played;
        switch (statusFilter) {
          case "komplett":
            return total > 0 && played === total;
          case "in_progress":
            return total > 0 && played < total && played > 0;
          case "leer":
            return total === 0;
          default:
            return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name, "de");
        case "name_desc":
          return b.name.localeCompare(a.name, "de");
        case "progress_asc":
          return getProgress(a) - getProgress(b);
        case "progress_desc":
          return getProgress(b) - getProgress(a);
        case "entries_desc":
          return b._count.entries - a._count.entries;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [seriesList, search, statusFilter, sortOption]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "alle";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Spielereihen</h1>
          <p className="text-muted-foreground">
            Tracke deinen Fortschritt in Spielereihen wie EXIT oder Adventure Games
          </p>
        </div>
        <Link href="/dashboard/series/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Reihe
          </Button>
        </Link>
      </div>

      {/* Filter & Sort Bar - only show when there are series */}
      {!loading && seriesList.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Reihe suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Suche leeren"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="h-9 border rounded-md px-3 text-sm bg-background text-foreground min-w-[130px]"
                  aria-label="Status filtern"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="h-9 border rounded-md px-3 text-sm bg-background text-foreground min-w-[200px]"
                  aria-label="Sortierung"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter indicator + reset */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {filteredAndSorted.length} von {seriesList.length} Reihen
                </span>
                <button
                  onClick={() => { setSearch(""); setStatusFilter("alle"); }}
                  className="text-xs text-primary hover:underline"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-full overflow-hidden animate-pulse">
              <div className="w-full h-40 bg-muted" />
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-muted rounded-full w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        /* Empty State - no series at all */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Library className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Spielereihen</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Lege eine Reihe an, um Einmal-Spiele wie EXIT, Adventure Games oder Murder Mystery zu tracken.
            </p>
            <Link href="/dashboard/series/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Reihe anlegen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredAndSorted.length === 0 ? (
        /* No results after filter */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Treffer</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Keine Reihen gefunden, die deinen Filterkriterien entsprechen.
            </p>
            <button
              onClick={() => { setSearch(""); setStatusFilter("alle"); }}
              className="text-sm text-primary hover:underline"
            >
              Filter zurücksetzen
            </button>
          </CardContent>
        </Card>
      ) : (
        /* Series Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map((series) => {
            const total = series._count.entries;
            const played = series._count.played;
            const progress = total > 0 ? Math.round((played / total) * 100) : 0;
            const isComplete = total > 0 && played === total;

            return (
              <Link key={series.id} href={`/dashboard/series/${series.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer h-full overflow-hidden group">
                  {/* Cover Image / Collage */}
                  <div className="w-full h-40 bg-muted relative">
                    {series.imageUrl ? (
                      <img
                        src={series.imageUrl}
                        alt={series.name}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : series.entries.length > 0 ? (
                      <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-px bg-border">
                        {series.entries.slice(0, 4).map((entry, idx) => (
                          <div key={entry.id || idx} className="bg-muted overflow-hidden">
                            {entry.game.imageUrl ? (
                              <img
                                src={entry.game.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - series.entries.length) }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="bg-muted" />
                        ))}
                      </div>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Library className="h-8 w-8" />
                        <span className="text-xs">Noch keine Spiele</span>
                      </div>
                    )}

                    {/* Completion Badge */}
                    {isComplete && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-600 text-white hover:bg-green-600 shadow-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Komplett
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-lg">{series.name}</CardTitle>
                    {series.description && (
                      <CardDescription className="line-clamp-2">{series.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          {played > 0 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          {played} von {total} gespielt
                        </span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`rounded-full h-2 transition-all duration-500 ${
                            isComplete ? "bg-green-600" : "bg-primary"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
