"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import { Plus, Users, Clock, Star, Download, ImageIcon, Trash2, Trash } from "lucide-react";

interface Game {
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

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadGames = useCallback(async () => {
    const res = await fetch("/api/games?include=sessions");
    if (res.ok) {
      const data = await res.json();
      setGames(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  async function handleDelete(game: Game) {
    setDeleting(true);
    const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
    if (res.ok) {
      setGames((prev) => prev.filter((g) => g.id !== game.id));
    }
    setDeleteTarget(null);
    setDeleting(false);
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
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meine Spiele</h1>
          <p className="text-muted-foreground">Verwalte deine Brettspielsammlung</p>
        </div>
        <div className="flex gap-2">
          {games.length > 0 && (
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteAllOpen(true)}
              data-testid="games-delete-all"
            >
              <Trash className="h-4 w-4 mr-2" />
              Alle entfernen
            </Button>
          )}
          <Link href="/dashboard/games/import">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Von BGG importieren
            </Button>
          </Link>
          <Link href="/dashboard/games/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Spiel hinzufügen
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-muted" />
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : games.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Du hast noch keine Spiele in deiner Sammlung.</p>
            <Link href="/dashboard/games/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Spiel hinzufügen
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
                  <div className="w-full h-48 bg-muted">
                    {game.imageUrl ? (
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
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
              className="bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
            >
              {deleting ? "Wird entfernt…" : "Entfernen"}
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
              className="bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
            >
              {deleting ? "Wird entfernt…" : `Alle ${games.length} entfernen`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
