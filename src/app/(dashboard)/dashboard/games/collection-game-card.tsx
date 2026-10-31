import Image from "next/image";
import { Users, Clock, Star, ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameItem } from "./games-list-client";
import { gameTextForRead } from "@/lib/game-text";

export function CollectionGameCard({ game }: { game: GameItem }) {
  const gameName = gameTextForRead(game.name);
  const gameDescription = game.description ? gameTextForRead(game.description) : null;
  return (
<Card className="club-game-card">
                  <div className="club-game-cover">
                    {game.imageUrl ? (
                      <Image
                        src={game.imageUrl}
                        alt={gameName}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <ImageIcon className="h-6 w-6" aria-hidden="true" />
                        <span className="text-xs">Kein Bild</span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle as="h2" className="line-clamp-2 text-xl leading-snug">{gameName}</CardTitle>
                    {gameDescription && (
                      <CardDescription className="line-clamp-2">{gameDescription}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        <span>{game.minPlayers}-{game.maxPlayers}</span>
                      </div>
                      {game.playTimeMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          <span>{game.playTimeMinutes} Min.</span>
                        </div>
                      )}
                      {game.complexity && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" aria-hidden="true" />
                          <span>{game.complexity}/5</span>
                        </div>
                      )}
                    </div>
                    {game.tags && game.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {game.tags.slice(0, 3).map((t) => (
                          <span key={t.tag.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                            {t.tag.name}
                          </span>
                        ))}
                        {game.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{game.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      {game._count?.sessions ?? 0} Sessions gespielt
                    </p>
                  </CardContent>
                </Card>
  );
}
