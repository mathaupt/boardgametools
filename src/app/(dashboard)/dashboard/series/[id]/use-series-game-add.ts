"use client";

import { useCallback, useRef, useState } from "react";
import type { AddSeriesGameInput, SeriesGameSelection } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { addSeriesGamesSequentially, getSeriesGameSelectionKey, type SeriesBulkAddResult } from "@/lib/series/bulk-add-entries";

export function useSeriesGameAdd(
  seriesId: string,
  onGamesAdded: (inputs: AddSeriesGameInput[], closeDialog: boolean) => void | Promise<void>,
) {
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);
  const [batchResults, setBatchResults] = useState<Record<string, SeriesBulkAddResult>>({});
  const busy = useRef(false);
  const { toast } = useToast();
  const clearError = useCallback(() => {
    setError(null);
    setBatchProgress(null);
    setBatchResults({});
  }, []);

  async function addGame(input: AddSeriesGameInput) {
    if (busy.current) return;
    busy.current = true;
    const key = getSeriesGameSelectionKey(input);
    setAdding(key);
    setError(null);
    try {
      const [result] = await addSeriesGamesSequentially(
        [{ key, input }],
        (item) => fetch(`/api/series/${seriesId}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }),
      );
      if (result.status === "failed") {
        setError(result.message);
        return false;
      }
      await onGamesAdded([input], true);
      if (result.status === "already_present") {
        toast({ title: "Bereits in der Reihe", description: "Die Reihenübersicht wurde aktualisiert und aktive Filter wurden zurückgesetzt." });
      }
      return true;
    } catch (error) {
      setError(error instanceof Error && ["Die Reihe konnte nicht aktualisiert werden. Bitte versuche es erneut.", "Das Spiel konnte in der aktualisierten Reihe nicht gefunden werden. Bitte lade die Seite neu."].includes(error.message)
        ? error.message
        : "Verbindungsfehler. Bitte versuche es erneut.");
      return false;
    } finally {
      busy.current = false;
      setAdding(null);
    }
  }

  async function addGames(selections: SeriesGameSelection[]) {
    if (busy.current || selections.length === 0) return [];
    busy.current = true;
    setError(null);
    setBatchProgress({ completed: 0, total: selections.length });

    const results = await addSeriesGamesSequentially(
      selections.map(({ key, input }) => ({ key, input })),
      (input) => fetch(`/api/series/${seriesId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      (result, completed) => {
        setBatchResults((current) => ({ ...current, [result.key]: result }));
        setBatchProgress({ completed, total: selections.length });
      },
    );

    const completedInputs = selections
      .filter(({ key }) => results.some((result) => result.key === key && result.status !== "failed"))
      .map(({ input }) => input);
    if (completedInputs.length > 0) {
      try {
        await onGamesAdded(completedInputs, false);
      } catch {
        setError("Die Spiele wurden verarbeitet, aber die Reihe konnte nicht aktualisiert werden. Bitte lade die Seite neu.");
      }
    }

    setBatchProgress(null);
    busy.current = false;
    return results;
  }

  return { adding, error, batchProgress, batchResults, clearError, addGame, addGames };
}
