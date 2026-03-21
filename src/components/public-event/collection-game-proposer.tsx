"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Search } from "lucide-react";
import type { GameSummary, Proposal } from "./types";

interface CollectionGameProposerProps {
  token: string;
  currentUserId: string;
  proposedGameIds: Set<string>;
  onProposalAdded: (proposal: Proposal) => void;
}

export function CollectionGameProposer({
  token,
  currentUserId,
  proposedGameIds,
  onProposalAdded,
}: CollectionGameProposerProps) {
  const { toast } = useToast();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [gamesError, setGamesError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) return;
    const loadGames = async () => {
      setGamesLoading(true);
      setGamesError(null);
      try {
        const response = await fetch("/api/games", {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error("Konnte Sammlung nicht laden");
        }
        const data: GameSummary[] = await response.json();
        setGames(data);
      } catch (error) {
        console.error("Error loading games", error);
        setGamesError("Sammlung konnte nicht geladen werden");
      } finally {
        setGamesLoading(false);
      }
    };
    loadGames();
  }, [currentUserId]);

  const availableGames = useMemo(() => {
    return games.filter((game) => !proposedGameIds.has(game.id));
  }, [games, proposedGameIds]);

  const filteredGames = useMemo(() => {
    if (!gameSearch.trim()) return availableGames;
    return availableGames.filter((game) =>
      game.name.toLowerCase().includes(gameSearch.trim().toLowerCase())
    );
  }, [availableGames, gameSearch]);

  const handleProposeGame = async (gameId: string) => {
    setGamesLoading(true);
    try {
      const response = await fetch(`/api/public/event/${token}/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Vorschlag fehlgeschlagen");
      }
      const proposal: Proposal = await response.json();
      onProposalAdded(proposal);
      toast({ title: "Spiel vorgeschlagen", description: "Danke für deinen Beitrag!" });
    } catch (error) {
      console.error("Propose error", error);
      toast({
        title: "Fehler beim Vorschlag",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setGamesLoading(false);
    }
  };

  return (
    <section>
      <Card className="border-border/60 bg-background/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Spiel aus Sammlung vorschlagen
          </CardTitle>
          <CardDescription>
            Wähle ein Spiel aus deiner Sammlung aus, um es der Abstimmung hinzuzufügen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Spiel suchen ..."
              value={gameSearch}
              onChange={(event) => setGameSearch(event.target.value)}
              className="bg-background"
            />
            <Button
              variant="outline"
              onClick={() => setGameSearch("")}
              title="Suche zurücksetzen"
            >
              <Search className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
          {gamesError && <p className="text-sm text-destructive">{gamesError}</p>}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {gamesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sammlung wird geladen...
              </div>
            ) : filteredGames.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {availableGames.length === 0
                  ? "Alle Spiele deiner Sammlung sind bereits im Voting."
                  : "Keine Spiele gefunden."}
              </p>
            ) : (
              filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">{game.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {game.minPlayers ?? "?"}-{game.maxPlayers ?? "?"} Spieler
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    disabled={gamesLoading}
                    onClick={() => handleProposeGame(game.id)}
                    data-testid={`propose-${game.id}`}
                    title="Spiel vorschlagen"
                    className="h-8 w-8 sm:h-8 sm:w-auto sm:px-3"
                  >
                    <Plus className="h-4 w-4 sm:mr-1 sm:h-3 sm:w-3" />
                    <span className="hidden sm:inline text-xs">Vorschlagen</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
