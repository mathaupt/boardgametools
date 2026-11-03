"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { BggVersionPicker } from "@/components/bgg/bgg-version-picker";
import type { BGGGameVersion } from "@/lib/bgg-types";
import { BggGameDetailCard, type BGGGame } from "./bgg-game-detail-card";
import { useBggCollectionPresence } from "@/components/bgg/use-bgg-collection-presence";
import { BggCollectionStatus } from "@/components/bgg/bgg-collection-status";

interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished?: string;
  type?: string;
}

export default function BGGImportPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<BGGGame | null>(null);
  const presence = useBggCollectionPresence(selectedGame ? [selectedGame.bggId] : []);
  const collectionMatch = selectedGame ? presence.matches[selectedGame.bggId] : null;
  const [selectedVersion, setSelectedVersion] = useState<BGGGameVersion | null>(null);
  const [_loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/bgg?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: "Fehler", description: "Fehler bei der Suche", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectGame = async (bggId: string) => {
    setSelectedVersion(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/bgg?bggId=${bggId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch game details');
      }

      const game = await response.json();
      setSelectedGame(game);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({ title: "Fehler", description: "Fehler beim Laden der Spiel-Details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedGame || presence.status !== "ready" || collectionMatch) return;

    setImporting(true);
    try {
      const response = await fetch('/api/games/import-bgg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bggId: selectedGame.bggId, versionId: selectedVersion?.versionId }),
      });

      if (response.status === 409) { presence.retry(); return; }
      if (!response.ok) throw new Error('Import failed');

      const { game: importedGame } = await response.json();
      toast({ title: "Spiel importiert", description: `Spiel "${importedGame.name}" erfolgreich importiert!` });
      
      // Reset form
      setSelectedGame(null);
      setSelectedVersion(null);
      setSearchResults([]);
      setSearchQuery("");
      
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: "Fehler", description: "Fehler beim Importieren des Spiels", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="break-words text-2xl font-bold [overflow-wrap:anywhere] sm:text-3xl">BoardGameGeek Import</h1>
        <p className="text-muted-foreground">Spiele direkt von BoardGameGeek importieren</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle as="h2">Spiel suchen</CardTitle>
          <CardDescription>
            Suche nach Brettspielen auf BoardGameGeek
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder="z.B. Catan, Monopoly, Carcassonne…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Spiel suchen"
            />
            <Button type="submit" className="min-h-11" disabled={searching} aria-label={searching ? 'Suche läuft' : 'Suchen'}>
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="ml-2">{searching ? 'Suche…' : 'Suchen'}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle as="h2">Suchergebnisse ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {searchResults.map((game) => (
              <div
                key={game.bggId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{game.name}</div>
                  {game.yearPublished && (
                    <div className="text-sm text-muted-foreground">{game.yearPublished}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectGame(game.bggId)}
                  aria-label={`Details für ${game.name}`}
                >
                  Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedGame && <BggGameDetailCard selectedGame={{ ...selectedGame, imageUrl: selectedVersion?.imageUrl ?? selectedVersion?.thumbnailUrl ?? selectedGame.imageUrl }} importing={importing} importDisabled={presence.status !== "ready" || !!collectionMatch} onImport={handleImport}>
        <BggCollectionStatus status={presence.status} match={collectionMatch} retry={presence.retry} />
        {presence.status === "ready" && !collectionMatch && <BggVersionPicker key={selectedGame.bggId} bggId={selectedGame.bggId} value={selectedVersion?.versionId ?? null} onChange={setSelectedVersion} disabled={importing} />}
      </BggGameDetailCard>}
    </div>
  );
}
