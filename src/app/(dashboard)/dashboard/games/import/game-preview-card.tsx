"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Clock, Star, ExternalLink, Search } from "lucide-react";

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

interface GamePreviewCardProps {
  selectedGame: BGGGameData | null;
  isLoading: boolean;
  isImporting: boolean;
  error: string | null;
  isAlreadyOwned: boolean;
  onImport: () => void;
}

export function GamePreviewCard({
  selectedGame,
  isLoading,
  isImporting,
  error,
  isAlreadyOwned,
  onImport,
}: GamePreviewCardProps) {
  return (
    <div>
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
          {error}
        </div>
      )}
      {selectedGame && isAlreadyOwned && (
        <div className="p-3 text-sm bg-warning/10 border border-warning/20 text-warning rounded-md mb-4">
          Dieses Spiel befindet sich bereits in deiner Sammlung.
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
            <div className="flex flex-col sm:flex-row gap-4">
              {selectedGame.imageUrl ? (
                <Image
                  src={selectedGame.imageUrl}
                  alt={selectedGame.name}
                  width={128}
                  height={128}
                  className="w-full sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded flex-shrink-0 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  🎲
                </div>
              )}
              <div className="flex-1 min-w-0">
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
                    <span key={cat} className="text-xs bg-secondary px-2 py-1 rounded">{cat}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedGame.mechanics.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Mechaniken</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedGame.mechanics.slice(0, 5).map((mech) => (
                    <span key={mech} className="text-xs bg-secondary px-2 py-1 rounded">{mech}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={onImport} disabled={isImporting} className="flex-1">
                {isImporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importieren...</>
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
  );
}
