"use client";
import type { ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Users, Clock, ExternalLink, Trophy, Gamepad2 } from "lucide-react";

export interface BGGGame {
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

export function BggGameDetailCard({ selectedGame, importing, onImport, children }: { selectedGame: BGGGame; importing: boolean; onImport:()=>void; children:ReactNode }) {
  const getComplexityStars = (complexity?: string) => {
    if (!complexity) return "☆☆☆☆☆";
    const value = parseFloat(complexity);
    const stars = Math.round(value);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  return (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle as="h2" className="flex min-w-0 flex-wrap items-center gap-2 [overflow-wrap:anywhere]">
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
                onClick={onImport}
                disabled={importing}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {importing ? 'Wird importiert…' : 'Importieren'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {children}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Game Image */}
              <div>
                {selectedGame.imageUrl ? (
                  <Image
                    src={selectedGame.imageUrl}
                    alt={selectedGame.name}
                    width={400}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="max-h-80 w-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                    <Gamepad2 className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                
                {selectedGame.thumbnailUrl && (
                  <div className="mt-2 text-center">
                    <a
                      href={`https://boardgamegeek.com/boardgame/${selectedGame.bggId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
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
                      <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>{selectedGame.minPlayers}-{selectedGame.maxPlayers} Spieler</span>
                    </div>
                    
                    {selectedGame.playTimeMinutes && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{selectedGame.playTimeMinutes} Minuten</span>
                      </div>
                    )}
                    
                    {selectedGame.complexity && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>Komplexität: {getComplexityStars(selectedGame.complexity)}</span>
                      </div>
                    )}
                    
                    {selectedGame.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
                        <span>Bewertung: {parseFloat(selectedGame.rating).toFixed(2)}/10</span>
                      </div>
                    )}
                    
                    {selectedGame.rank && (
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span>Rang: #{selectedGame.rank}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedGame.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Beschreibung</h3>
                    <p className="text-sm text-muted-foreground line-clamp-6">
                      {selectedGame.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
  );
}
