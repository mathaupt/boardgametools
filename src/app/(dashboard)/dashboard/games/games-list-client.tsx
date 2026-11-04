"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Plus, Download, Trash2, Trash, ScanBarcode } from "lucide-react";
import { CollectionFilters } from "./collection-filters";
import { CollectionGameCard } from "./collection-game-card";
import { gameListQueryToSearchParams, type GameListQuery } from "@/lib/game-list-query";
import { GamesPagination } from "./games-pagination";
import { GamesListOverlays } from "./games-list-overlays";

export interface GameItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { sessions: number };
  tags?: Array<{ tag: { id: string; name: string } }>;
}

interface GamesListClientProps {
  games: GameItem[];
  tags?: Array<{ id: string; name: string }>;
  query?: GameListQuery;
  collectionTotal?: number;
  pageInfo?: { page: number; total: number; limit: number; totalPages: number };
}

const DEFAULT_QUERY: GameListQuery = { page: 1, limit: 24, search: "", tagId: null, players: null, minComplexity: null, sort: "name_asc" };

export default function GamesListClient({ games: initialGames, tags = [], query = DEFAULT_QUERY, collectionTotal = initialGames.length, pageInfo = { page: 1, total: initialGames.length, limit: 24, totalPages: Math.ceil(initialGames.length / 24) } }: GamesListClientProps) {
  const router = useRouter();
  const [games, setGames] = useState<GameItem[]>(initialGames);
  const [totalCount, setTotalCount] = useState(pageInfo.total);
  const [allGamesCount, setAllGamesCount] = useState(collectionTotal);
  const [deleteTarget, setDeleteTarget] = useState<GameItem | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [queryState, setQueryState] = useState(query);
  const [searchText, setSearchText] = useState(query.search);

  useEffect(() => {
    setGames(initialGames);
    setTotalCount(pageInfo.total);
    setAllGamesCount(collectionTotal);
    setQueryState(query);
    setSearchText(query.search);
  }, [initialGames, pageInfo.total, collectionTotal, query]);

  function navigateWithQuery(update: Partial<GameListQuery>) {
    const next = { ...queryState, ...update, page: 1, search: update.search ?? searchText.trim().slice(0, 100) };
    setQueryState(next);
    const params = gameListQueryToSearchParams(next).toString();
    router.push(params ? `/dashboard/games?${params}` : "/dashboard/games");
  }

  useEffect(() => {
    const trimmed = searchText.trim().slice(0, 100);
    if (trimmed === queryState.search) return;
    const timer = window.setTimeout(() => {
      const next = { ...queryState, page: 1, search: trimmed };
      setQueryState(next);
      const params = gameListQueryToSearchParams(next).toString();
      router.push(params ? `/dashboard/games?${params}` : "/dashboard/games");
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchText, queryState, router]);

  const allTags: [string, string][] = tags.map((tag) => [tag.id, tag.name]);
  const hasFilters = Boolean(queryState.search || queryState.tagId || queryState.players || queryState.minComplexity);
  const totalPages = Math.ceil(totalCount / pageInfo.limit);
  const displayedPage = Math.min(pageInfo.page, Math.max(totalPages, 1));

  async function handleDelete(game: GameItem) {
    setDeleting(true);
    const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
    if (res.ok) {
      setGames((prev) => prev.filter((g) => g.id !== game.id));
      setTotalCount((count) => Math.max(0, count - 1));
      setAllGamesCount((count) => Math.max(0, count - 1));
    }
    setDeleteTarget(null);
    setDeleting(false);
    router.refresh();
  }

  async function handleDeleteAll() {
    setDeleting(true);
    const res = await fetch("/api/games/bulk-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setGames([]);
      setTotalCount(0);
      setAllGamesCount(0);
    }
    setDeleteAllOpen(false);
    setDeleting(false);
    router.refresh();
  }

  async function handleBarcodeGameSelected(bggId: string, ean: string) {
    setBarcodeScannerOpen(false);
    try {
      const res = await fetch("/api/games/import-bgg", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Origin": window.location.origin 
        },
        body: JSON.stringify({ bggId, ean }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  function handleLocalGameFound(gameId: string) {
    setBarcodeScannerOpen(false);
    router.push(`/dashboard/games/${gameId}`);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-bold">Meine Spiele</h1>
          <p className="text-muted-foreground">Finde das passende Spiel für eure nächste Runde.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allGamesCount > 0 && (
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteAllOpen(true)}
              data-testid="games-delete-all"
              aria-label="Alle Spiele entfernen"
            >
              <Trash className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Alle entfernen</span>
            </Button>
          )}
          <Button asChild variant="outline" aria-label="Von BGG importieren">
            <Link href="/dashboard/games/import">
              <Download className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Von BGG importieren</span>
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setBarcodeScannerOpen(true)}>
            <ScanBarcode className="h-4 w-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Barcode scannen</span>
            <span className="sm:hidden">Barcode</span>
          </Button>
          <Button asChild aria-label="Spiel hinzufügen">
            <Link href="/dashboard/games/new">
              <Plus className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Spiel hinzufügen</span>
            </Link>
          </Button>
        </div>
      </div>

      {(totalCount > 0 || hasFilters) && (
        <CollectionFilters
          searchText={searchText}
          setSearchText={setSearchText}
          playerCount={queryState.players == null ? "all" : String(queryState.players)}
          setPlayerCount={(value) => navigateWithQuery({ players: value === "all" ? null : Number(value) })}
          sortOption={queryState.sort}
          setSortOption={(value) => navigateWithQuery({ sort: value as GameListQuery["sort"] })}
          minComplexity={queryState.minComplexity}
          setMinComplexity={(value) => navigateWithQuery({ minComplexity: value })}
          activeTag={queryState.tagId}
          setActiveTag={(value) => navigateWithQuery({ tagId: value })}
          allTags={allTags}
          onReset={() => {
            setSearchText("");
            navigateWithQuery({ search: "", tagId: null, players: null, minComplexity: null, sort: "name_asc" });
          }}
        />
      )}

      {totalCount === 0 && hasFilters ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">Keine Spiele gefunden für diesen Filter.</p>
            <Button type="button" variant="outline" onClick={() => {
              setSearchText("");
              navigateWithQuery({ search: "", tagId: null, players: null, minComplexity: null, sort: "name_asc" });
            }}>Filter zurücksetzen</Button>
          </CardContent>
        </Card>
      ) : totalCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Du hast noch keine Spiele in deiner Sammlung.</p>
            <Button asChild>
              <Link href="/dashboard/games/new">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Erstes Spiel hinzufügen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <div key={game.id} className="relative group">
              <Link
                href={`/dashboard/games/${game.id}`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CollectionGameCard game={game} />
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.preventDefault(); setDeleteTarget(game); }}
                className="absolute top-2 right-2 bg-card text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md"
                aria-label="Spiel entfernen"
                title="Spiel entfernen"
                data-testid={`game-delete-${game.id}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {totalCount > 0 && <GamesPagination page={displayedPage} totalPages={totalPages} total={totalCount} query={{ ...queryState, page: displayedPage }} />}

      <GamesListOverlays
        deleteTarget={deleteTarget}
        deleteAllOpen={deleteAllOpen}
              totalCount={allGamesCount}
        deleting={deleting}
        barcodeScannerOpen={barcodeScannerOpen}
        onDeleteOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onDeleteAllOpenChange={setDeleteAllOpen}
        onDelete={() => { if (deleteTarget) void handleDelete(deleteTarget); }}
        onDeleteAll={() => void handleDeleteAll()}
        onBarcodeScannerOpenChange={setBarcodeScannerOpen}
        onBarcodeGameSelected={(bggId, ean) => void handleBarcodeGameSelected(bggId, ean)}
        onLocalGameFound={handleLocalGameFound}
      />
    </>
  );
}
