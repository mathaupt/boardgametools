"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Loader2, Users, Clock, Star, Library, CheckSquare } from "lucide-react";

interface BGGCollectionItem {
  bggId: string;
  name: string;
  yearPublished: number | null;
  thumbnailUrl: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  rating: number | null;
  numPlays: number;
}

interface CollectionImportDialogProps {
  existingBggIds: Set<string>;
  onImported: (newIds: string[]) => void;
}

export function CollectionImportDialog({ existingBggIds, onImported }: CollectionImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bggUsername, setBggUsername] = useState("");
  const [collection, setCollection] = useState<BGGCollectionItem[]>([]);
  const [selectedBggIds, setSelectedBggIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function handleLoadCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!bggUsername.trim()) return;

    setIsLoading(true);
    setError(null);
    setCollection([]);
    setSelectedBggIds(new Set());
    setResult(null);

    try {
      const response = await fetch(`/api/bgg/collection?username=${encodeURIComponent(bggUsername.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sammlung konnte nicht geladen werden");
        return;
      }

      const items: BGGCollectionItem[] = data.collection;
      setCollection(items);
      const selectableIds = items
        .map((g) => g.bggId)
        .filter((id): id is string => Boolean(id) && !existingBggIds.has(id));
      setSelectedBggIds(new Set(selectableIds));
    } catch {
      setError("Verbindungsfehler – bitte erneut versuchen");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelectAll() {
    const selectableIds = collection
      .map((g) => g.bggId)
      .filter((id): id is string => Boolean(id) && !existingBggIds.has(id));
    setSelectedBggIds(selectedBggIds.size === selectableIds.length ? new Set() : new Set(selectableIds));
  }

  function toggleGame(bggId: string) {
    if (!bggId || existingBggIds.has(bggId)) return;
    setSelectedBggIds((prev) => {
      const next = new Set(prev);
      if (next.has(bggId)) next.delete(bggId);
      else next.add(bggId);
      return next;
    });
  }

  async function handleBulkImport() {
    if (selectedBggIds.size === 0) return;

    setIsImporting(true);
    setError(null);
    setResult(null);

    let imported = 0;
    let skipped = 0;
    const newlyImportedIds: string[] = [];

    for (const bggId of Array.from(selectedBggIds)) {
      if (!bggId || existingBggIds.has(bggId)) { skipped++; continue; }

      try {
        const response = await fetch("/api/games/import-bgg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bggId }),
        });
        if (response.ok) {
          imported++;
          newlyImportedIds.push(bggId);
        } else if (response.status === 409) {
          skipped++;
          newlyImportedIds.push(bggId);
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    setIsImporting(false);
    setResult({ imported, skipped });
    if (newlyImportedIds.length > 0) onImported(newlyImportedIds);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) { setResult(null); setError(null); }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Library className="h-4 w-4 sm:mr-0" />
          <span className="hidden sm:inline">Gesamte Sammlung importieren</span>
          <span className="sm:hidden">Sammlung</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>BGG-Sammlung importieren</DialogTitle>
          <DialogDescription>
            Gib deinen BGG-Benutzernamen ein, um deine gesamte Sammlung zu laden und auszuwählen, welche Spiele du importieren möchtest.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <form onSubmit={handleLoadCollection} className="flex gap-2">
            <Input
              placeholder="BGG-Benutzername (z.B. Moritz42)"
              value={bggUsername}
              onChange={(e) => setBggUsername(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !bggUsername.trim()}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Laden...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" />Laden</>
              )}
            </Button>
          </form>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          {result && (
            <div className="p-3 text-sm bg-success/10 border border-success/20 rounded-md text-success">
              ✓ {result.imported} Spiel{result.imported !== 1 ? "e" : ""} importiert
              {result.skipped > 0 && `, ${result.skipped} bereits vorhanden / übersprungen`}
            </div>
          )}

          {collection.length > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckSquare className="h-4 w-4" />
                  {selectedBggIds.size === collection.length ? "Alle abwählen" : "Alle auswählen"}
                </button>
                <span className="text-muted-foreground">
                  {selectedBggIds.size} / {collection.length} ausgewählt
                </span>
              </div>

              <div className="overflow-y-auto flex-1 border rounded-md divide-y">
                {collection.map((game) => (
                  <label
                    key={game.bggId}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={game.bggId ? selectedBggIds.has(game.bggId) : false}
                      onChange={() => game.bggId && toggleGame(game.bggId)}
                      disabled={!game.bggId || existingBggIds.has(game.bggId)}
                    />
                    {game.thumbnailUrl ? (
                      <Image src={game.thumbnailUrl} alt={game.name} width={40} height={40}
                        className="object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded flex-shrink-0 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        🎲
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        <span>{game.name}</span>
                        {game.bggId && existingBggIds.has(game.bggId) && (
                          <span className="text-xs text-muted-foreground">(bereits importiert)</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {game.yearPublished && <span>{game.yearPublished}</span>}
                        {game.minPlayers && game.maxPlayers && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />{game.minPlayers}–{game.maxPlayers}
                          </span>
                        )}
                        {game.playTimeMinutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{game.playTimeMinutes} Min.
                          </span>
                        ) : null}
                        {game.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />{game.rating}
                          </span>
                        )}
                        {game.numPlays > 0 && <span>{game.numPlays}× gespielt</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Schließen</Button>
          {collection.length > 0 && (
            <Button onClick={handleBulkImport} disabled={isImporting || selectedBggIds.size === 0}>
              {isImporting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importiere...</>
              ) : (
                <><Library className="h-4 w-4 mr-2" />{selectedBggIds.size} Spiel{selectedBggIds.size !== 1 ? "e" : ""} importieren</>
              )}
            </Button>
          )}
          {result && (
            <Button onClick={() => { setOpen(false); router.push("/dashboard/games"); router.refresh(); }}>
              Zur Spielesammlung
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
