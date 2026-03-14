"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
  Clock,
  Star,
  ImageIcon,
  Check,
  Library,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Filter,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AddGameDialog } from "./add-game-dialog";

interface GameData {
  id: string;
  name: string;
  description?: string | null;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
}

interface SeriesEntry {
  id: string;
  seriesId: string;
  gameId: string;
  sortOrder: number;
  played: boolean;
  playedAt: string | null;
  rating: number | null;
  difficulty: string | null;
  game: GameData;
}

interface GameSeries {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  entries: SeriesEntry[];
}

type PlayedFilter = "alle" | "gespielt" | "offen";
type DifficultyFilter = "alle" | "einsteiger" | "fortgeschritten" | "profi";
type EntrySortOption = "sortOrder" | "name_asc" | "name_desc" | "rating_desc" | "difficulty";

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
  { value: "name_asc", label: "Name (A\u2013Z)" },
  { value: "name_desc", label: "Name (Z\u2013A)" },
  { value: "rating_desc", label: "Beste Bewertung" },
  { value: "difficulty", label: "Schwierigkeit" },
];

const DIFFICULTY_ORDER: Record<string, number> = { einsteiger: 1, fortgeschritten: 2, profi: 3 };

const DIFFICULTY_CONFIG: Record<string, { label: string; className: string }> = {
  einsteiger: { label: "Einsteiger", className: "bg-success/10 text-success border-success" },
  fortgeschritten: { label: "Fortgeschritten", className: "bg-warning/10 text-warning border-warning" },
  profi: { label: "Profi", className: "bg-destructive/10 text-destructive border-destructive" },
};

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number | null;
  onChange?: (rating: number | null) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex gap-0.5" role="group" aria-label="Bewertung">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`p-0 h-5 w-5 transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(null)}
          onClick={() => {
            if (!readonly && onChange) {
              onChange(value === star ? null : star);
            }
          }}
          aria-label={`${star} Stern${star > 1 ? "e" : ""}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              (hover !== null ? star <= hover : star <= (value ?? 0))
                ? "fill-warning text-warning"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const seriesId = params.id as string;

  const [series, setSeries] = useState<GameSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSeriesOpen, setDeleteSeriesOpen] = useState(false);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<SeriesEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [playedFilter, setPlayedFilter] = useState<PlayedFilter>("alle");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("alle");
  const [sortOption, setSortOption] = useState<EntrySortOption>("sortOrder");

  const loadSeries = useCallback(async () => {
    const res = await fetch(`/api/series/${seriesId}`);
    if (res.ok) {
      setSeries(await res.json());
    }
    setLoading(false);
  }, [seriesId]);

  useEffect(() => { loadSeries(); }, [loadSeries]);

  async function handleTogglePlayed(entry: SeriesEntry) {
    const newPlayed = !entry.played;
    setSeries((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) =>
          e.id === entry.id
            ? { ...e, played: newPlayed, playedAt: newPlayed ? new Date().toISOString() : null, rating: newPlayed ? e.rating : null }
            : e
        ),
      };
    });

    const res = await fetch(`/api/series/${seriesId}/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ played: newPlayed }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Status konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleRatingChange(entry: SeriesEntry, rating: number | null) {
    setSeries((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => e.id === entry.id ? { ...e, rating } : e),
      };
    });

    const res = await fetch(`/api/series/${seriesId}/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Bewertung konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleDifficultyChange(entry: SeriesEntry, difficulty: string | null) {
    setSeries((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => e.id === entry.id ? { ...e, difficulty } : e),
      };
    });

    const res = await fetch(`/api/series/${seriesId}/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Schwierigkeit konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleMoveEntry(entry: SeriesEntry, direction: "up" | "down") {
    if (!series) return;
    const entries = [...series.entries];
    const idx = entries.findIndex((e) => e.id === entry.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= entries.length) return;

    const tempOrder = entries[idx].sortOrder;
    entries[idx] = { ...entries[idx], sortOrder: entries[swapIdx].sortOrder };
    entries[swapIdx] = { ...entries[swapIdx], sortOrder: tempOrder };
    entries.sort((a, b) => a.sortOrder - b.sortOrder);

    setSeries({ ...series, entries });

    const res = await fetch(`/api/series/${seriesId}/entries/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: entries.map((e) => ({ id: e.id, sortOrder: e.sortOrder })),
      }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Reihenfolge konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleDeleteEntry() {
    if (!deleteEntryTarget) return;
    setDeleting(true);

    const res = await fetch(`/api/series/${seriesId}/entries/${deleteEntryTarget.id}`, { method: "DELETE" });

    if (res.ok) {
      setSeries((prev) => {
        if (!prev) return prev;
        return { ...prev, entries: prev.entries.filter((e) => e.id !== deleteEntryTarget.id) };
      });
      toast({ title: "Entfernt", description: `${deleteEntryTarget.game.name} aus der Reihe entfernt.` });
    }

    setDeleteEntryTarget(null);
    setDeleting(false);
  }

  async function handleDeleteSeries() {
    setDeleting(true);
    const res = await fetch(`/api/series/${seriesId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/series");
    }
    setDeleting(false);
  }

  function handleGameAdded() {
    loadSeries();
    setAddDialogOpen(false);
  }

  const hasActiveFilters = search.trim() !== "" || playedFilter !== "alle" || difficultyFilter !== "alle";
  const isCustomSort = sortOption !== "sortOrder";

  const filteredEntries = useMemo(() => {
    if (!series) return [];
    let result = [...series.entries];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((e) => e.game.name.toLowerCase().includes(q));
    }

    // Played filter
    if (playedFilter === "gespielt") {
      result = result.filter((e) => e.played);
    } else if (playedFilter === "offen") {
      result = result.filter((e) => !e.played);
    }

    // Difficulty filter
    if (difficultyFilter !== "alle") {
      result = result.filter((e) => e.difficulty === difficultyFilter);
    }

    // Sort
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
  }, [series, search, playedFilter, difficultyFilter, sortOption]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div>
            <div className="h-7 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 mt-2 animate-pulse" />
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-3 bg-muted rounded-full w-full" />
          </CardContent>
        </Card>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="h-14 w-14 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/series">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Reihe nicht gefunden</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Die gesuchte Reihe existiert nicht oder wurde gelöscht.</p>
            <Link href="/dashboard/series">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = series.entries.length;
  const played = series.entries.filter((e) => e.played).length;
  const progress = total > 0 ? Math.round((played / total) * 100) : 0;
  const isComplete = total > 0 && played === total;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/series">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{series.name}</h1>
            {series.description && (
              <p className="text-muted-foreground mt-0.5">{series.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-11 sm:ml-0">
          <Link href={`/dashboard/series/${seriesId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteSeriesOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card className={isComplete ? "border-success bg-success/10" : ""}>
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Library className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">
                {isComplete ? "Alle Spiele durchgespielt!" : `${played} von ${total} gespielt`}
              </span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`rounded-full h-3 transition-all duration-500 ${
                isComplete ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Spiele</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Spiel hinzufügen
        </Button>
      </div>

      {/* Filter & Sort Bar - only show when there are entries */}
      {series.entries.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Spiel suchen..."
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
                  value={playedFilter}
                  onChange={(e) => setPlayedFilter(e.target.value as PlayedFilter)}
                  className="h-9 border rounded-md px-3 text-sm bg-background text-foreground min-w-[100px]"
                  aria-label="Status filtern"
                >
                  {PLAYED_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                className="h-9 border rounded-md px-3 text-sm bg-background text-foreground min-w-[130px]"
                aria-label="Schwierigkeit filtern"
              >
                <option value="alle">Schwierigkeit</option>
                {DIFFICULTY_FILTER_OPTIONS.slice(1).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as EntrySortOption)}
                  className="h-9 border rounded-md px-3 text-sm bg-background text-foreground min-w-[160px]"
                  aria-label="Sortierung"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter indicator + reset */}
            {(hasActiveFilters || isCustomSort) && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {filteredEntries.length} von {series.entries.length} Spiele
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(""); setPlayedFilter("alle"); setDifficultyFilter("alle"); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      {series.entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Spiele</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Füge Spiele aus deiner Sammlung oder per BGG-Import hinzu.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
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
              onClick={() => { setSearch(""); setPlayedFilter("alle"); setDifficultyFilter("alle"); }}
              className="text-sm text-primary hover:underline"
            >
              Filter zurücksetzen
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry, idx) => {
            const originalIdx = series.entries.findIndex((e) => e.id === entry.id);
            const canReorder = sortOption === "sortOrder" && !hasActiveFilters;
            return (
            <Card
              key={entry.id}
              className={`transition-all hover:shadow-sm ${
                entry.played
                  ? "bg-muted/30 border-muted"
                  : ""
              }`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Order number + sort controls */}
                  <div className="flex flex-col items-center gap-0 w-6 shrink-0">
                    {canReorder ? (
                      <>
                        <button
                          onClick={() => handleMoveEntry(entry, "up")}
                          disabled={originalIdx === 0}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                          aria-label="Nach oben"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-medium text-muted-foreground leading-none">{originalIdx + 1}</span>
                        <button
                          onClick={() => handleMoveEntry(entry, "down")}
                          disabled={originalIdx === series.entries.length - 1}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                          aria-label="Nach unten"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">{idx + 1}</span>
                    )}
                  </div>

                  {/* Played toggle */}
                  <button
                    onClick={() => handleTogglePlayed(entry)}
                    className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      entry.played
                        ? "bg-success border-success text-primary-foreground scale-100"
                        : "border-muted-foreground/30 hover:border-primary hover:scale-105"
                    }`}
                    aria-label={entry.played ? "Als nicht gespielt markieren" : "Als gespielt markieren"}
                  >
                    {entry.played && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* Game image */}
                  <Link
                    href={`/dashboard/games/${entry.game.id}`}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    {entry.game.imageUrl ? (
                      <img
                        src={entry.game.imageUrl}
                        alt={entry.game.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </Link>

                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/games/${entry.game.id}`}
                        className={`font-medium hover:underline truncate text-sm sm:text-base ${
                          entry.played ? "line-through decoration-1 text-muted-foreground" : ""
                        }`}
                      >
                        {entry.game.name}
                      </Link>
                      {entry.difficulty && DIFFICULTY_CONFIG[entry.difficulty] && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${DIFFICULTY_CONFIG[entry.difficulty].className}`}>
                          {DIFFICULTY_CONFIG[entry.difficulty].label}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {entry.game.minPlayers}-{entry.game.maxPlayers}
                      </span>
                      {entry.game.playTimeMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.game.playTimeMinutes} Min.
                        </span>
                      )}
                      {entry.played && entry.playedAt && (
                        <span>
                          gespielt {new Date(entry.playedAt).toLocaleDateString("de-DE")}
                        </span>
                      )}
                    </div>

                    {/* Rating (only when played) */}
                    {entry.played && (
                      <div className="mt-1.5">
                        <StarRating
                          value={entry.rating}
                          onChange={(rating) => handleRatingChange(entry, rating)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={entry.difficulty || ""}
                      onChange={(e) => handleDifficultyChange(entry, e.target.value || null)}
                      className="text-xs border rounded-md px-1.5 py-1 bg-background text-foreground hidden sm:block w-[100px]"
                      aria-label="Schwierigkeit"
                    >
                      <option value="">Schwierigkeit</option>
                      <option value="einsteiger">Einsteiger</option>
                      <option value="fortgeschritten">Fortgeschritten</option>
                      <option value="profi">Profi</option>
                    </select>

                    <button
                      onClick={() => setDeleteEntryTarget(entry)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Aus Reihe entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Add Game Dialog */}
      <AddGameDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        seriesId={seriesId}
        existingGameIds={series.entries.map((e) => e.gameId)}
        onGameAdded={handleGameAdded}
      />

      {/* Delete entry dialog */}
      <AlertDialog open={!!deleteEntryTarget} onOpenChange={(open) => { if (!open) setDeleteEntryTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel aus Reihe entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du <strong>{deleteEntryTarget?.game.name}</strong> aus dieser Reihe entfernen?
              Das Spiel bleibt in deiner Sammlung erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Wird entfernt..." : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete series dialog */}
      <AlertDialog open={deleteSeriesOpen} onOpenChange={setDeleteSeriesOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reihe löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Reihe <strong>{series.name}</strong> wirklich löschen?
              Die Spiele bleiben in deiner Sammlung, nur die Reihe und der Fortschritt werden entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeries}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Wird gelöscht..." : "Reihe löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
