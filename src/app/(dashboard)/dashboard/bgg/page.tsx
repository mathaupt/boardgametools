"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Star, Users, Clock, ExternalLink } from "lucide-react";

interface BGGGame {
  bggId: string;
  name: string;
  description?: string;
  yearPublished?: string;
  minPlayers?: string;
  maxPlayers?: string;
  playTimeMinutes?: string;
  complexity?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  rating?: string;
  rank?: string;
}

interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished?: string;
  type?: string;
}

export default function BGGImportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<BGGGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleSearch = async () => {
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
      alert('Fehler bei der Suche');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectGame = async (bggId: string) => {
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
      alert('Fehler beim Laden der Spiel-Details');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedGame) return;

    setImporting(true);
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedGame.name,
          description: selectedGame.description,
          minPlayers: parseInt(selectedGame.minPlayers || "2"),
          maxPlayers: parseInt(selectedGame.maxPlayers || "4"),
          playTimeMinutes: selectedGame.playTimeMinutes ? parseInt(selectedGame.playTimeMinutes) : null,
          complexity: selectedGame.complexity ? Math.round(parseFloat(selectedGame.complexity)) : null,
          bggId: selectedGame.bggId,
          imageUrl: selectedGame.imageUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const importedGame = await response.json();
      alert(`Spiel "${importedGame.name}" erfolgreich importiert!`);
      
      // Reset form
      setSelectedGame(null);
      setSearchResults([]);
      setSearchQuery("");
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Fehler beim Importieren des Spiels');
    } finally {
      setImporting(false);
    }
  };

  const getComplexityStars = (complexity?: string) => {
    if (!complexity) return "☆☆☆☆☆";
    const value = parseFloat(complexity);
    const stars = Math.round(value);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">BoardGameGeek Import</h1>
        <p className="text-muted-foreground">Spiele direkt von BoardGameGeek importieren</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Spiel suchen</CardTitle>
          <CardDescription>
            Suche nach Brettspielen auf BoardGameGeek
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="z.B. Catan, Monopoly, Carcassonne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? 'Suche...' : 'Suchen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle>Suchergebnisse ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {searchResults.map((game) => (
              <div
                key={game.bggId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectGame(game.bggId)}
              >
                <div>
                  <div className="font-medium">{game.name}</div>
                  {game.yearPublished && (
                    <div className="text-sm text-gray-500">{game.yearPublished}</div>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Game Details */}
      {selectedGame && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedGame.name}
                  <Badge variant="outline">
                    BGG ID: {selectedGame.bggId}
                  </Badge>
                </CardTitle>
                {selectedGame.yearPublished && (
                  <CardDescription>Erschienen {selectedGame.yearPublished}</CardDescription>
                )}
              </div>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {importing ? 'Wird importiert...' : 'Importieren'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Game Image */}
              <div>
                {selectedGame.imageUrl ? (
                  <img
                    src={selectedGame.imageUrl}
                    alt={selectedGame.name}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-gray-400 text-6xl">🎲</div>
                  </div>
                )}
                
                {selectedGame.thumbnailUrl && (
                  <div className="mt-2 text-center">
                    <a
                      href={`https://boardgamegeek.com/boardgame/${selectedGame.bggId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Auf BoardGameGeek ansehen
                    </a>
                  </div>
                )}
              </div>

              {/* Game Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Spiel-Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{selectedGame.minPlayers}-{selectedGame.maxPlayers} Spieler</span>
                    </div>
                    
                    {selectedGame.playTimeMinutes && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{selectedGame.playTimeMinutes} Minuten</span>
                      </div>
                    )}
                    
                    {selectedGame.complexity && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-500" />
                        <span>Komplexität: {getComplexityStars(selectedGame.complexity)}</span>
                      </div>
                    )}
                    
                    {selectedGame.rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">⭐</span>
                        <span>Bewertung: {parseFloat(selectedGame.rating).toFixed(2)}/10</span>
                      </div>
                    )}
                    
                    {selectedGame.rank && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">🏆</span>
                        <span>Rang: #{selectedGame.rank}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedGame.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Beschreibung</h3>
                    <p className="text-sm text-gray-600 line-clamp-6">
                      {selectedGame.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
