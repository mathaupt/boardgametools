"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, ImageIcon, Loader2, Plus, Users } from "lucide-react";
import { gameTextForRead } from "@/lib/game-text";
import type { SeriesGameSelection } from "./types";

export interface CollectionGame {
  id: string;
  name: string;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
}

interface Props {
  games: CollectionGame[];
  selections: SeriesGameSelection[];
  disabled: boolean;
  adding: string | null;
  onToggle: (game: CollectionGame) => void;
  onAdd: (gameId: string) => void;
}

export function SeriesCollectionGameList({ games, selections, disabled, adding, onToggle, onAdd }: Props) {
  return (
    <div className="space-y-1" role="list" aria-label="Spiele aus deiner Sammlung">
      {games.map((game) => {
        const key = `game:${game.id}`;
        const selected = selections.some((item) => item.key === key);
        return (
          <div key={game.id} role="listitem" className="flex min-h-14 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
            <Checkbox aria-label={`${game.name} auswählen`} checked={selected} disabled={disabled || (selections.length >= 20 && !selected)} onChange={() => onToggle(game)} />
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              {game.imageUrl ? <Image src={game.imageUrl} alt="" className="object-cover" fill sizes="40px" /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-4 w-4" aria-hidden="true" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{gameTextForRead(game.name)}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" aria-hidden="true" />{game.minPlayers}–{game.maxPlayers}</span>
                {game.playTimeMinutes && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" aria-hidden="true" />{game.playTimeMinutes} Min.</span>}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAdd(game.id)} disabled={disabled} className="min-h-11 shrink-0" aria-label={adding === `game:${game.id}` ? "Wird hinzugefügt" : "Hinzufügen"}>
              {adding === `game:${game.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <><Plus className="mr-1 h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Hinzufügen</span></>}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
