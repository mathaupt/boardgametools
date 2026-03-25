"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Users, Clock, Star, Download, ImageIcon, Trash2, Trash, ScanBarcode } from "lucide-react";
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
  _count: { sessions: number };
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
        headers: { "Content-Type": "application/json" },
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
          <h1 className="text-2xl sm:text-3xl font-bold">Meine Spiele</h1>
          <p className="text-muted-foreground">Verwalte deine Brettspielsammlung</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {games.length > 0 && (
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteAllOpen(true)}
              data-testid="games-delete-all"
            >
              <Trash className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Alle entfernen</span>
            </Button>
          )}
          <Link href="/dashboard/games/import">
            <Button variant="outline">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Von BGG importieren</span>
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setBarcodeScannerOpen(true)}>
            <ScanBarcode className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Barcode</span>
          </Button>
          <Link href="/dashboard/games/new">
            <Button>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Spiel hinzuf&uuml;gen</span>
            </Button>
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Du hast noch keine Spiele in deiner Sammlung.</p>
            <Link href="/dashboard/games/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Spiel hinzuf&uuml;gen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <div key={game.id} className="relative group">
              <Link href={`/dashboard/games/${game.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full overflow-hidden">
                  <div className="relative w-full h-48 bg-muted">
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={game.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs">Kein Bild</span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 pr-8">{game.name}</CardTitle>
                    {game.description && (
                      <CardDescription className="line-clamp-2">{game.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{game.minPlayers}-{game.maxPlayers}</span>
                      </div>
                      {game.playTimeMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{game.playTimeMinutes} Min.</span>
                        </div>
                      )}
                      {game.complexity && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{game.complexity}/5</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {game._count?.sessions ?? 0} Sessions gespielt
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); setDeleteTarget(game); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                title="Spiel entfernen"
                data-testid={`game-delete-${game.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Einzelnes Spiel loeschen */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              M&ouml;chtest du <strong>{deleteTarget?.name}</strong> wirklich aus deiner Sammlung entfernen?
              Alle zugeh&ouml;rigen Sessions werden ebenfalls gel&ouml;scht.
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

      {/* Alle Spiele loeschen */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Spiele entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              M&ouml;chtest du wirklich alle <strong>{games.length} Spiele</strong> aus deiner Sammlung entfernen?
              Diese Aktion kann nicht r&uuml;ckg&auml;ngig gemacht werden.
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
