"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { SeriesEntry } from "./types";

interface EntryPlayDetailsProps {
  entry: SeriesEntry;
  onPlayDetailChange: (entry: SeriesEntry, field: string, value: unknown) => void;
}

export function EntryPlayDetails({ entry, onPlayDetailChange }: EntryPlayDetailsProps) {
  return (
    <div className="mt-3 pt-3 border-t ml-[52px] sm:ml-[68px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Play time */}
        <div>
          <Label htmlFor={`playTime-${entry.id}`} className="text-xs font-medium text-muted-foreground mb-1 block">
            Spielzeit (Minuten)
          </Label>
          <Input
            id={`playTime-${entry.id}`}
            type="number"
            min={0}
            max={9999}
            placeholder="z.B. 90"
            defaultValue={entry.playTimeMinutes ?? ""}
            onBlur={(e) => {
              const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
              if (val !== entry.playTimeMinutes) onPlayDetailChange(entry, "playTimeMinutes", val);
            }}
            className="h-8 text-sm"
          />
        </div>

        {/* Player count */}
        <div>
          <Label htmlFor={`playerCount-${entry.id}`} className="text-xs font-medium text-muted-foreground mb-1 block">
            Anzahl Spieler
          </Label>
          <Input
            id={`playerCount-${entry.id}`}
            type="number"
            min={1}
            max={99}
            placeholder="z.B. 4"
            defaultValue={entry.playerCount ?? ""}
            onBlur={(e) => {
              const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
              if (val !== entry.playerCount) onPlayDetailChange(entry, "playerCount", val);
            }}
            className="h-8 text-sm"
          />
        </div>

        {/* Score */}
        <div>
          <Label htmlFor={`score-${entry.id}`} className="text-xs font-medium text-muted-foreground mb-1 block">
            Punkte
          </Label>
          <Input
            id={`score-${entry.id}`}
            type="number"
            min={0}
            max={999999}
            placeholder="z.B. 120"
            defaultValue={entry.score ?? ""}
            onBlur={(e) => {
              const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
              if (val !== entry.score) onPlayDetailChange(entry, "score", val);
            }}
            className="h-8 text-sm"
          />
        </div>

        {/* Successful checkbox */}
        <div className="flex items-end pb-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`successful-${entry.id}`}
              checked={entry.successful === true}
              onChange={(e) => {
                onPlayDetailChange(entry, "successful", e.target.checked ? true : null);
              }}
            />
            <Label htmlFor={`successful-${entry.id}`} className="text-sm cursor-pointer">
              Erfolgreich abgeschlossen
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
