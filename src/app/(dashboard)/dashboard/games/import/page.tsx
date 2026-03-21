"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search, Loader2, ScanBarcode } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { CollectionImportDialog } from "./collection-import-dialog";
import { GamePreviewCard } from "./game-preview-card";

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

  const [existingBggIds, setExistingBggIds] = useState<Set<string>>(new Set());
  const [isLoadingExistingGames, setIsLoadingExistingGames] = useState(true);
  const [existingGamesError, setExistingGamesError] = useState<string | null>(null);

  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [barcodeEan, setBarcodeEan] = useState<string | null>(null);

  // Load existing collection once so we can block duplicate imports by exact BGG ID
  useEffect(() => {
    let isMounted = true;
    async function loadExistingGames() {
      try {
        const response = await fetch("/api/games");
        if (!response.ok) {
          throw new Error("Failed to load existing games");
        }
        const games: Array<{ bggId?: string | null }> = await response.json();
        const ids = games
          .map((game) => game.bggId)
          .filter((id): id is string => Boolean(id));
        if (isMounted) {
          setExistingBggIds(new Set(ids));
        }
      } catch (err) {
        console.error("Error loading existing games", err);
        if (isMounted) {
          setExistingGamesError("Konnte bestehende Sammlung nicht prüfen – Duplikate werden serverseitig geblockt.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingExistingGames(false);
        }
      }
    }

    loadExistingGames();
    return () => {
      isMounted = false;
    };
  }, []);

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

    if (existingBggIds.has(selectedGame.bggId)) {
      setError("Dieses Spiel ist bereits in deiner Sammlung");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/games/import-bgg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bggId: selectedGame.bggId, ean: barcodeEan || undefined }),
      });

      if (response.ok) {
        setBarcodeEan(null);
        router.push("/dashboard/games");
        router.refresh();
        setExistingBggIds((prev) => {
          const next = new Set(prev);
          next.add(selectedGame.bggId);
          return next;
        });
      } else if (response.status === 409) {
        setError("Dieses Spiel ist bereits in deiner Sammlung");
        setExistingBggIds((prev) => {
          const next = new Set(prev);
          next.add(selectedGame.bggId);
          return next;
        });
      } else {
        setError("Import fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleBarcodeGameSelected(bggId: string, ean: string) {
    setBarcodeEan(ean);
    setBarcodeScannerOpen(false);
    await loadGameDetails(bggId);
  }

  function handleCollectionImported(newIds: string[]) {
    setExistingBggIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/games">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Von BGG importieren</h1>
            <p className="text-muted-foreground">Importiere Spiele direkt von BoardGameGeek</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setBarcodeScannerOpen(true)}>
            <ScanBarcode className="h-4 w-4" />
            <span className="hidden sm:inline">Barcode</span>
          </Button>

          <CollectionImportDialog
            existingBggIds={existingBggIds}
            onImported={handleCollectionImported}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {!isLoadingExistingGames && existingGamesError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {existingGamesError}
            </div>
          )}
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

        <GamePreviewCard
          selectedGame={selectedGame}
          isLoading={isLoading}
          isImporting={isImporting}
          error={error}
          isAlreadyOwned={!isLoadingExistingGames && !!selectedGame && existingBggIds.has(selectedGame.bggId)}
          onImport={handleImport}
        />
      </div>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        open={barcodeScannerOpen}
        onOpenChange={setBarcodeScannerOpen}
        onGameSelected={handleBarcodeGameSelected}
      />
    </div>
  );
}
