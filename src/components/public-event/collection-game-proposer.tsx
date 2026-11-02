"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, RotateCcw } from "lucide-react";
import type { GameSummary, Proposal } from "./types";
import { ProposalSearchPanel, ProposalResultList, ProposalResultRow } from "./proposal-search-panel";

interface CollectionGameProposerProps {
  token: string;
  currentUserId: string;
  proposedGameIds: Set<string>;
  onProposalAdded: (proposal: Proposal) => void;
  onStateConflict?: () => void | Promise<void>;
  onSessionExpired?: () => void;
}

export function CollectionGameProposer({
  token,
  currentUserId,
  proposedGameIds,
  onProposalAdded,
  onStateConflict,
  onSessionExpired,
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
          if (response.status === 401) onSessionExpired?.();
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
  }, [currentUserId, onSessionExpired]);

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
        if (response.status === 409) await onStateConflict?.();
        if (response.status === 401) onSessionExpired?.();
        if (response.status === 409) throw new Error("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
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
    <ProposalSearchPanel id="collection-propose-title" title="Spiel aus Sammlung vorschlagen" icon={Plus}
      description="Wähle ein Spiel aus deiner Sammlung aus, um es der Abstimmung hinzuzufügen.">
      <div className="space-y-2">
        <label htmlFor="public-collection-query" className="text-sm font-medium text-foreground">Spiel in deiner Sammlung suchen</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="public-collection-query"
            type="search"
            placeholder="Spiel suchen…"
            value={gameSearch}
            onChange={(event) => setGameSearch(event.target.value)}
            className="min-h-11 min-w-0 border-muted-foreground bg-background shadow-none"
            aria-describedby="public-collection-query-hint"
          />
          <Button
            variant="outline"
            onClick={() => setGameSearch("")}
            title="Suche zurücksetzen"
            aria-label="Suche zurücksetzen"
            className="min-h-11 max-w-full whitespace-normal border-muted-foreground bg-card text-foreground shadow-none dark:border-muted-foreground dark:bg-card"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="min-w-0 [overflow-wrap:anywhere]">Zurücksetzen</span>
          </Button>
        </div>
        <p id="public-collection-query-hint" className="text-sm text-muted-foreground">Die Liste wird beim Tippen gefiltert.</p>
      </div>
      {gamesError && <p className="text-sm text-destructive">{gamesError}</p>}
      <div aria-busy={gamesLoading}>
        {gamesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Sammlung wird geladen…
          </div>
        ) : filteredGames.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {availableGames.length === 0
              ? "Alle Spiele deiner Sammlung sind bereits im Voting."
              : "Keine Spiele gefunden."}
          </p>
        ) : (
          <ProposalResultList label="Spiele aus deiner Sammlung">
            {filteredGames.map((game) => (
              <ProposalResultRow key={game.id}>
                <div className="min-w-0 flex-1 basis-32 [overflow-wrap:anywhere]">
                  <p className="font-medium text-sm text-foreground">{game.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {game.minPlayers ?? "?"}-{game.maxPlayers ?? "?"} Spieler
                  </p>
                </div>
                <Button
                  disabled={gamesLoading}
                  onClick={() => handleProposeGame(game.id)}
                  data-testid={`propose-${game.id}`}
                  title="Spiel vorschlagen"
                  aria-label={`${game.name} vorschlagen`}
                  className="min-h-11 max-w-full shrink-0 whitespace-normal"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">Vorschlagen</span>
                </Button>
              </ProposalResultRow>
            ))}
          </ProposalResultList>
        )}
      </div>
    </ProposalSearchPanel>
  );
}
