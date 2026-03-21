"use client";

import Image from "next/image";
import { Game } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ExternalLink, Gamepad2 } from "lucide-react";

interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished: string;
  type: string;
  imageUrl?: string;
}

interface GameProposalPanelProps {
  availableGames: Game[];
  collectionSearch: string;
  onCollectionSearchChange: (val: string) => void;
  activeTab: "collection" | "bgg";
  onTabChange: (tab: "collection" | "bgg") => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  bggResults: BGGSearchResult[];
  bggLoading: boolean;
  onAddProposal: (gameId: string) => void;
  onBggSearch: () => void;
  onBggImport: (bggId: string) => void;
}

export default function GameProposalPanel({
  availableGames,
  collectionSearch,
  onCollectionSearchChange,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchQueryChange,
  bggResults,
  bggLoading,
  onAddProposal,
  onBggSearch,
  onBggImport,
}: GameProposalPanelProps) {
  const filteredCollection = availableGames.filter(game =>
    game.name.toLowerCase().includes(collectionSearch.trim().toLowerCase())
  );

  return (
    <>
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Plus className="h-5 w-5" />
        Spiel vorschlagen
      </h2>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="text-lg">Spiel auswählen</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "collection" ? "default" : "outline"}
                size="sm"
                onClick={() => onTabChange("collection")}
              >
                Meine Sammlung
              </Button>
              <Button
                variant={activeTab === "bgg" ? "default" : "outline"}
                size="sm"
                onClick={() => onTabChange("bgg")}
              >
                BGG Suche
              </Button>
            </div>
          </div>
          <CardDescription>
            {activeTab === "collection" 
              ? "Wähle ein Spiel aus deiner Sammlung" 
              : "Suche und importiere Spiele von BoardGameGeek"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === "collection" ? (
            // Eigene Sammlung
            <>
              {availableGames.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Alle Spiele wurden bereits vorgeschlagen
                </p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Spiel suchen..."
                      value={collectionSearch}
                      onChange={(e) => onCollectionSearchChange(e.target.value)}
                    />
                  </div>
                  {filteredCollection.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      {collectionSearch ? `Keine Treffer für "${collectionSearch}"` : "Keine Spiele verfügbar"}
                    </p>
                  ) : (
                    filteredCollection.map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {/* Game Image */}
                          <div className="flex-shrink-0">
                            {game.imageUrl ? (
                              <Image 
                                src={game.imageUrl} 
                                alt={game.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                                <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{game.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {game.minPlayers}-{game.maxPlayers} Spieler
                              {game.complexity && ` • ${game.complexity}/5 Komplexität`}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onAddProposal(game.id)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Vorschlagen
                        </Button>
                      </div>
                    ))
                  )}
                </>
              )}
            </>
          ) : (
            // BGG Suche
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="z.B. Catan, Monopoly, Carcassonne..."
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onBggSearch()}
                />
                <Button onClick={onBggSearch} disabled={bggLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  {bggLoading ? 'Suche...' : 'Suchen'}
                </Button>
              </div>

              {bggResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-2">
                    {bggResults.length} Spiele gefunden
                  </p>
                  {bggResults.map((game) => (
                    <div key={game.bggId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Game Image */}
                        <div className="flex-shrink-0">
                          {game.imageUrl ? (
                            <Image 
                              src={game.imageUrl} 
                              alt={game.name}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{game.name}</div>
                          {game.yearPublished && (
                            <div className="text-sm text-muted-foreground">{game.yearPublished}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onBggImport(game.bggId)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Importieren
                        </Button>
                        <a
                          href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && bggResults.length === 0 && !bggLoading && (
                <p className="text-muted-foreground text-center py-4">
                  Keine Spiele gefunden für &quot;{searchQuery}&quot;
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
