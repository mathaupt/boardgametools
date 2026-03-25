"use client";

import { Input } from "@/components/ui/input";
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Spielzeit (Minuten)
          </label>
          <Input
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Anzahl Spieler
          </label>
          <Input
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Punkte
          </label>
          <Input
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={entry.successful === true}
              onChange={(e) => {
                onPlayDetailChange(entry, "successful", e.target.checked ? true : null);
              }}
              className="h-4 w-4 rounded border-input accent-success"
            />
            <span className="text-sm">Erfolgreich abgeschlossen</span>
          </label>
        </div>
      </div>
    </div>
  );
}
