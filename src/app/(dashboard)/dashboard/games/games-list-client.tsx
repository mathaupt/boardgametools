"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
import { Plus, Download, Trash2, Trash, ScanBarcode } from "lucide-react";
import { CollectionFilters } from "./collection-filters";
import { CollectionGameCard } from "./collection-game-card";
import { BarcodeScanner } from "@/components/barcode-scanner";

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
}

export default function GamesListClient({ games: initialGames }: GamesListClientProps) {
  const router = useRouter();
  const [games, setGames] = useState<GameItem[]>(initialGames);
  const [deleteTarget, setDeleteTarget] = useState<GameItem | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<string>("all");
  const [minComplexity, setMinComplexity] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<string>("name_asc");

  // Extract unique tags from all games
  const allTags = Array.from(
    new Map(
      games.flatMap((g) => (g.tags ?? []).map((t) => [t.tag.id, t.tag.name]))
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  // Filter and sort games
  const filteredGames = useMemo(() => {
    const selectedPlayers = playerCount === "all" ? null : Number(playerCount);

    const filtered = games.filter((game) => {
      const matchesSearch = !searchText || game.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesTag = !activeTag || (game.tags ?? []).some((t) => t.tag.id === activeTag);
      const matchesPlayers =
        selectedPlayers == null || (game.minPlayers <= selectedPlayers && game.maxPlayers >= selectedPlayers);
      const matchesComplexity = minComplexity == null || (game.complexity ?? 0) >= minComplexity;
      return matchesSearch && matchesTag && matchesPlayers && matchesComplexity;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name, "de");
        case "name_desc":
          return b.name.localeCompare(a.name, "de");
        case "complexity_asc":
          return (a.complexity ?? 0) - (b.complexity ?? 0);
        case "complexity_desc":
          return (b.complexity ?? 0) - (a.complexity ?? 0);
        case "players_asc":
          return a.minPlayers - b.minPlayers;
        case "players_desc":
          return b.maxPlayers - a.maxPlayers;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [games, searchText, activeTag, playerCount, minComplexity, sortOption]);

  async function handleDelete(game: GameItem) {
    setDeleting(true);
    const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
    if (res.ok) {
      setGames((prev) => prev.filter((g) => g.id !== game.id));
    }
    setDeleteTarget(null);
    setDeleting(false);
    router.refresh();
  }

  async function handleDeleteAll() {
    setDeleting(true);
    const ids = games.map((g) => g.id);
    const res = await fetch("/api/games/bulk-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setGames([]);
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
          {games.length > 0 && (
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

      {games.length > 0 && (
        <CollectionFilters searchText={searchText} setSearchText={setSearchText} playerCount={playerCount} setPlayerCount={setPlayerCount} sortOption={sortOption} setSortOption={setSortOption} minComplexity={minComplexity} setMinComplexity={setMinComplexity} activeTag={activeTag} setActiveTag={setActiveTag} allTags={allTags} />
      )}

      {games.length === 0 ? (
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
      ) : filteredGames.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Keine Spiele gefunden für diesen Filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGames.map((game) => (
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

      {/* Einzelnes Spiel löschen */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du <strong>{deleteTarget?.name}</strong> wirklich aus deiner Sammlung entfernen?
              Alle zugehörigen Sessions werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="bg-card text-card-foreground hover:bg-muted border border-border"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Wird entfernt\u2026" : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alle Spiele löschen */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Spiele entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du wirklich alle <strong>{games.length} Spiele</strong> aus deiner Sammlung entfernen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="bg-card text-card-foreground hover:bg-muted border border-border"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Wird entfernt\u2026" : `Alle ${games.length} entfernen`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BarcodeScanner
        open={barcodeScannerOpen}
        onOpenChange={setBarcodeScannerOpen}
        onGameSelected={handleBarcodeGameSelected}
        onLocalGameFound={handleLocalGameFound}
      />
    </>
  );
}
