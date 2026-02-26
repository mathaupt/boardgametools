"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Search, Loader2, Users, Clock, Star, ExternalLink, Library, CheckSquare } from "lucide-react";

interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}

interface BGGGameData {
  bggId: string;
  name: string;
  description: string;
  yearPublished: number | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  imageUrl: string | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  rating: number | null;
}

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

export default function ImportBGGPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [bggIdInput, setBggIdInput] = useState("");
  const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<BGGGameData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collection import state
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [bggUsername, setBggUsername] = useState("");
  const [collection, setCollection] = useState<BGGCollectionItem[]>([]);
  const [selectedBggIds, setSelectedBggIds] = useState<Set<string>>(new Set());
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/window.svg";
  };

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 2) return;

    setIsSearching(true);
    setError(null);
    setSelectedGame(null);

    try {
      const response = await fetch(`/api/bgg/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        setError("Suche fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsSearching(false);
    }
  }

  async function loadGameDetails(bggId: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bgg/${bggId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedGame(data);
      } else {
        setError("Spiel konnte nicht geladen werden");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDirectLoad(e: React.FormEvent) {
    e.preventDefault();
    if (!bggIdInput) return;
    await loadGameDetails(bggIdInput);
  }

  async function handleImport() {
    if (!selectedGame) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/games/import-bgg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bggId: selectedGame.bggId }),
      });

      if (response.ok) {
        router.push("/dashboard/games");
        router.refresh();
      } else if (response.status === 409) {
        setError("Dieses Spiel ist bereits in deiner Sammlung");
      } else {
        setError("Import fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleLoadCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!bggUsername.trim()) return;

    setIsLoadingCollection(true);
    setCollectionError(null);
    setCollection([]);
    setSelectedBggIds(new Set());
    setBulkImportResult(null);

    try {
      const response = await fetch(`/api/bgg/collection?username=${encodeURIComponent(bggUsername.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setCollectionError(data.error || "Sammlung konnte nicht geladen werden");
        return;
      }

      const items: BGGCollectionItem[] = data.collection;
      setCollection(items);
      // Pre-select all games
      setSelectedBggIds(new Set(items.map((g) => g.bggId)));
    } catch {
      setCollectionError("Verbindungsfehler – bitte erneut versuchen");
    } finally {
      setIsLoadingCollection(false);
    }
  }

  function toggleSelectAll() {
    if (selectedBggIds.size === collection.length) {
      setSelectedBggIds(new Set());
    } else {
      setSelectedBggIds(new Set(collection.map((g) => g.bggId)));
    }
  }

  function toggleGame(bggId: string) {
    setSelectedBggIds((prev) => {
      const next = new Set(prev);
      if (next.has(bggId)) {
        next.delete(bggId);
      } else {
        next.add(bggId);
      }
      return next;
    });
  }

  async function handleBulkImport() {
    if (selectedBggIds.size === 0) return;

    setIsBulkImporting(true);
    setCollectionError(null);
    setBulkImportResult(null);

    let imported = 0;
    let skipped = 0;

    for (const bggId of Array.from(selectedBggIds)) {
      try {
        const response = await fetch("/api/games/import-bgg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bggId }),
        });
        if (response.ok) {
          imported++;
        } else if (response.status === 409) {
          skipped++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    setIsBulkImporting(false);
    setBulkImportResult({ imported, skipped });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/games">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Von BGG importieren</h1>
            <p className="text-muted-foreground">Importiere Spiele direkt von BoardGameGeek</p>
          </div>
        </div>

        {/* Collection Import Dialog */}
        <Dialog open={collectionDialogOpen} onOpenChange={(open) => {
          setCollectionDialogOpen(open);
          if (!open) {
            setBulkImportResult(null);
            setCollectionError(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Gesamte Sammlung importieren
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
              {/* Username form */}
              <form onSubmit={handleLoadCollection} className="flex gap-2">
                <Input
                  placeholder="BGG-Benutzername (z.B. Moritz42)"
                  value={bggUsername}
                  onChange={(e) => setBggUsername(e.target.value)}
                  disabled={isLoadingCollection}
                />
                <Button type="submit" disabled={isLoadingCollection || !bggUsername.trim()}>
                  {isLoadingCollection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Laden
                    </>
                  )}
                </Button>
              </form>

              {collectionError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {collectionError}
                </div>
              )}

              {bulkImportResult && (
                <div className="p-3 text-sm bg-green-50 border border-green-200 rounded-md text-green-800">
                  ✓ {bulkImportResult.imported} Spiel{bulkImportResult.imported !== 1 ? "e" : ""} importiert
                  {bulkImportResult.skipped > 0 && `, ${bulkImportResult.skipped} bereits vorhanden / übersprungen`}
                </div>
              )}

              {collection.length > 0 && (
                <>
                  {/* Select all / count bar */}
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

                  {/* Game list */}
                  <div className="overflow-y-auto flex-1 border rounded-md divide-y">
                    {collection.map((game) => (
                      <label
                        key={game.bggId}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedBggIds.has(game.bggId)}
                          onChange={() => toggleGame(game.bggId)}
                        />
                        {game.thumbnailUrl ? (
                          <img
                            src={game.thumbnailUrl}
                            alt={game.name}
                            className="w-10 h-10 object-cover rounded flex-shrink-0"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded flex-shrink-0 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            🎲
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{game.name}</div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {game.yearPublished && <span>{game.yearPublished}</span>}
                            {game.minPlayers && game.maxPlayers && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {game.minPlayers}–{game.maxPlayers}
                              </span>
                            )}
                            {game.playTimeMinutes ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {game.playTimeMinutes} Min.
                              </span>
                            ) : null}
                            {game.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {game.rating}
                              </span>
                            )}
                            {game.numPlays > 0 && (
                              <span>{game.numPlays}× gespielt</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setCollectionDialogOpen(false)}>
                Schließen
              </Button>
              {collection.length > 0 && !bulkImportResult && (
                <Button
                  onClick={handleBulkImport}
                  disabled={isBulkImporting || selectedBggIds.size === 0}
                >
                  {isBulkImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importiere...
                    </>
                  ) : (
                    <>
                      <Library className="h-4 w-4 mr-2" />
                      {selectedBggIds.size} Spiel{selectedBggIds.size !== 1 ? "e" : ""} importieren
                    </>
                  )}
                </Button>
              )}
              {bulkImportResult && (
                <Button onClick={() => { setCollectionDialogOpen(false); router.push("/dashboard/games"); router.refresh(); }}>
                  Zur Spielesammlung
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spiel suchen</CardTitle>
              <CardDescription>Suche nach einem Spiel auf BoardGameGeek</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="z.B. Catan, Wingspan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" disabled={isSearching || searchQuery.length < 2}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direkt per ID laden</CardTitle>
              <CardDescription>
                Gib die BGG-ID direkt ein (findest du in der URL auf boardgamegeek.com)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDirectLoad} className="flex gap-2">
                <Input
                  placeholder="z.B. 13 (für Catan)"
                  value={bggIdInput}
                  onChange={(e) => setBggIdInput(e.target.value)}
                />
                <Button type="submit" disabled={isLoading || !bggIdInput}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Laden"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suchergebnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {searchResults.map((result) => (
                    <li key={result.bggId}>
                      <button
                        onClick={() => loadGameDetails(result.bggId)}
                        className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                      >
                        <span className="font-medium">{result.name}</span>
                        {result.yearPublished && (
                          <span className="text-muted-foreground ml-2">({result.yearPublished})</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
              {error}
            </div>
          )}

          {isLoading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {selectedGame && !isLoading && (
            <Card>
              <CardHeader>
                <div className="flex gap-4">
                  {selectedGame.imageUrl ? (
                    <img
                      src={selectedGame.imageUrl}
                      alt={selectedGame.name}
                      className="w-full rounded-lg"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded flex-shrink-0 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      🎲
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle>{selectedGame.name}</CardTitle>
                    {selectedGame.yearPublished && (
                      <CardDescription>Erschienen {selectedGame.yearPublished}</CardDescription>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{selectedGame.minPlayers}-{selectedGame.maxPlayers}</span>
                      </div>
                      {selectedGame.playTimeMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{selectedGame.playTimeMinutes} Min.</span>
                        </div>
                      )}
                      {selectedGame.complexity && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{selectedGame.complexity}/5</span>
                        </div>
                      )}
                      {selectedGame.rating && (
                        <div className="flex items-center gap-1">
                          <span>⭐ {selectedGame.rating}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedGame.description && (
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {selectedGame.description}
                  </p>
                )}

                {selectedGame.designers.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Designer</Label>
                    <p className="text-sm">{selectedGame.designers.slice(0, 3).join(", ")}</p>
                  </div>
                )}

                {selectedGame.categories.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Kategorien</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedGame.categories.slice(0, 5).map((cat) => (
                        <span key={cat} className="text-xs bg-secondary px-2 py-1 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGame.mechanics.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Mechaniken</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedGame.mechanics.slice(0, 5).map((mech) => (
                        <span key={mech} className="text-xs bg-secondary px-2 py-1 rounded">
                          {mech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importieren...
                      </>
                    ) : (
                      "Zur Sammlung hinzufügen"
                    )}
                  </Button>
                  <a
                    href={`https://boardgamegeek.com/boardgame/${selectedGame.bggId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedGame && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Suche nach einem Spiel oder gib eine BGG-ID ein
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
