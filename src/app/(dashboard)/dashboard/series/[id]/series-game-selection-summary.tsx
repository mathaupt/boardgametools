"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Plus, RotateCw, X } from "lucide-react";
import type { SeriesGameSelection } from "./types";
import type { SeriesBulkAddResult } from "@/lib/series/bulk-add-entries";

interface Props {
  selections: SeriesGameSelection[];
  results: Record<string, SeriesBulkAddResult>;
  progress: { completed: number; total: number } | null;
  onSubmit: () => void;
  onRemove: (key: string) => void;
  onRetry: () => void;
}

export function SeriesGameSelectionSummary({ selections, results, progress, onSubmit, onRemove, onRetry }: Props) {
  const failed = Object.values(results).some((result) => result.status === "failed");
  const busy = progress !== null;

  return (
    <section aria-label="Ausgewählte Spiele" className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{selections.length} von 20 Spielen ausgewählt</p>
        <div className="flex min-w-0 basis-full flex-wrap gap-2 sm:basis-auto">
          {failed && !busy ? (
            <Button type="button" size="sm" onClick={onRetry} className="h-auto min-h-11 min-w-0 w-full whitespace-normal sm:w-auto">
              <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" /> Fehlgeschlagene erneut versuchen
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={selections.length === 0 || busy} onClick={onSubmit} className="h-auto min-h-11 min-w-0 w-full whitespace-normal sm:w-auto">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 h-4 w-4" aria-hidden="true" />}
              {busy ? `Füge hinzu (${progress.completed}/${progress.total})` : selections.length ? `${selections.length} Spiele hinzufügen` : "Ausgewählte Spiele hinzufügen"}
            </Button>
          )}
        </div>
      </div>
      {selections.length > 0 && (
        <ul className="max-h-36 space-y-1 overflow-y-auto" aria-live="polite">
          {selections.map((selection) => {
            const result = results[selection.key];
            const status = result?.status === "added" ? "Hinzugefügt" : result?.status === "already_present" ? "Bereits in der Reihe" : result?.status === "failed" ? result.message : null;
            return (
              <li key={selection.key} className="flex min-w-0 items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{selection.name}{status ? `: ${status}` : ""}</span>
                {!busy && !result && <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label={`${selection.name} aus Auswahl entfernen`} onClick={() => onRemove(selection.key)}><X className="h-4 w-4" aria-hidden="true" /></Button>}
              </li>
            );
          })}
        </ul>
      )}
      {failed && <p role="status" className="text-xs text-muted-foreground">Erfolgreiche Spiele bleiben erhalten; ein erneuter Versuch sendet nur fehlgeschlagene Einträge.</p>}
    </section>
  );
}
