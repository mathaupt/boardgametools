"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search, Loader2, Users, Clock, Star, ExternalLink } from "lucide-react";

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

  return (
    <div className="space-y-6">
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
                  {selectedGame.imageUrl && (
                    <img
                      src={selectedGame.imageUrl}
                      alt={selectedGame.name}
                      className="w-24 h-24 object-cover rounded"
                    />
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
