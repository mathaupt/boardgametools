"use client";

import { useCallback, useRef, useState } from "react";
import type { AddSeriesGameInput } from "./types";
import { useToast } from "@/components/ui/use-toast";

export function useSeriesGameAdd(seriesId: string, onGameAdded: (input: AddSeriesGameInput) => void | Promise<void>) {
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const { toast } = useToast();
  const clearError = useCallback(() => setError(null), []);

  async function addGame(input: AddSeriesGameInput) {
    if (busy.current) return;
    busy.current = true;
    setAdding("gameId" in input ? input.gameId : input.bggId);
    setError(null);
    try {
      const response = await fetch(`/api/series/${seriesId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok && response.status !== 409) {
        const data = await response.json().catch(() => null) as {error?: string} | null;
        setError(response.status === 401 ? "Bitte melde dich erneut an." : response.status >= 500 ? "Das Spiel konnte nicht hinzugefügt werden. Bitte versuche es erneut." : data?.error ?? "Das Spiel konnte nicht hinzugefügt werden.");
        return;
      }
      await onGameAdded(input);
      if (response.status === 409) {
        toast({ title: "Bereits in der Reihe", description: "Die Reihenübersicht wurde aktualisiert und aktive Filter wurden zurückgesetzt." });
      }
    } catch (error) {
      setError(error instanceof Error && ["Die Reihe konnte nicht aktualisiert werden. Bitte versuche es erneut.", "Das Spiel konnte in der aktualisierten Reihe nicht gefunden werden. Bitte lade die Seite neu."].includes(error.message)
        ? error.message
        : "Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      busy.current = false;
      setAdding(null);
    }
  }

  return { adding, error, clearError, addGame };
}
