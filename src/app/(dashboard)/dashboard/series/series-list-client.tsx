"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Library, ImageIcon, CheckCircle2, Circle, Search, ArrowUpDown, Filter, X } from "lucide-react";

export interface SeriesEntry {
  id: string;
  played: boolean;
  difficulty: string | null;
  game: { imageUrl: string | null };
}

export interface GameSeriesItem {
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
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "progress_desc", label: "Fortschritt (hoch → niedrig)" },
  { value: "progress_asc", label: "Fortschritt (niedrig → hoch)" },
  { value: "entries_desc", label: "Meiste Spiele" },
  { value: "newest", label: "Neueste zuerst" },
  { value: "oldest", label: "Älteste zuerst" },
];

function getProgress(series: GameSeriesItem) {
  const total = series._count.entries;
  const played = series._count.played;
  return total > 0 ? played / total : 0;
}

interface SeriesListClientProps {
  seriesList: GameSeriesItem[];
}

export default function SeriesListClient({ seriesList }: SeriesListClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alle");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");

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
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Spielereihen</h1>
          <p className="text-muted-foreground">
            Tracke deinen Fortschritt in Spielereihen wie EXIT oder Adventure Games
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/series/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Neue Reihe
          </Link>
        </Button>
      </div>

      {/* Filter & Sort Bar - only show when there are series */}
      {seriesList.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Reihe suchen…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                  aria-label="Reihe suchen"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSearch("")}
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
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="h-9 w-full sm:min-w-[130px] sm:w-auto" aria-label="Status filtern">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" aria-hidden="true" />
                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  <SelectTrigger className="h-9 w-full sm:min-w-[200px] sm:w-auto" aria-label="Sortierung">
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
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {filteredAndSorted.length} von {seriesList.length} Reihen
                </span>
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => { setSearch(""); setStatusFilter("alle"); }}
                  className="text-xs text-primary h-auto p-0"
                >
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {seriesList.length === 0 ? (
        /* Empty State - no series at all */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Library className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Noch keine Spielereihen</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Lege eine Reihe an, um Einmal-Spiele wie EXIT, Adventure Games oder Murder Mystery zu tracken.
            </p>
            <Button asChild>
              <Link href="/dashboard/series/new">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Erste Reihe anlegen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredAndSorted.length === 0 ? (
        /* No results after filter */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold mb-2">Keine Treffer</h2>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Keine Reihen gefunden, die deinen Filterkriterien entsprechen.
            </p>
            <Button
              variant="link"
              size="xs"
              onClick={() => { setSearch(""); setStatusFilter("alle"); }}
              className="text-sm text-primary h-auto p-0"
            >
              Filter zurücksetzen
            </Button>
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
              <Link
                key={series.id}
                href={`/dashboard/series/${series.id}`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="hover:shadow-md transition-shadow h-full overflow-hidden">
                  {/* Cover Image / Collage */}
                  <div className="w-full h-40 bg-muted relative">
                    {series.imageUrl ? (
                      <Image
                        src={series.imageUrl}
                        alt={series.name}
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : series.entries.length > 0 ? (
                      <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-px bg-border">
                        {series.entries.slice(0, 4).map((entry, idx) => (
                          <div key={entry.id || idx} className="relative bg-muted overflow-hidden">
                            {entry.game.imageUrl ? (
                              <Image
                                src={entry.game.imageUrl}
                                alt=""
                                className="object-cover"
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 17vw"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-4 w-4" aria-hidden="true" />
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
                        <Library className="h-8 w-8" aria-hidden="true" />
                        <span className="text-xs">Noch keine Spiele</span>
                      </div>
                    )}

                    {/* Completion Badge */}
                    {isComplete && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-success text-success-foreground hover:bg-success shadow-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                          Komplett
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <CardHeader className="pb-2">
                    <CardTitle as="h2" className="line-clamp-1 text-lg">{series.name}</CardTitle>
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
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {played} von {total} gespielt
                        </span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`rounded-full h-2 transition-[width] duration-500 ${
                            isComplete ? "bg-success" : "bg-primary"
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
    </>
  );
}
