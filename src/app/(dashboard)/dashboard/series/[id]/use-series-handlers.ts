"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import type { GameSeries, SeriesEntry } from "./types";

interface UseSeriesHandlersOptions {
  seriesId: string;
  series: GameSeries | null;
  setSeries: React.Dispatch<React.SetStateAction<GameSeries | null>>;
  loadSeries: () => Promise<void>;
  setExpandedEntry: React.Dispatch<React.SetStateAction<string | null>>;
  setDeleteEntryTarget: React.Dispatch<React.SetStateAction<SeriesEntry | null>>;
  setDeleting: React.Dispatch<React.SetStateAction<boolean>>;
  setAddDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deleteEntryTarget: SeriesEntry | null;
}

export function useSeriesHandlers({
  seriesId,
  series,
  setSeries,
  loadSeries,
  setExpandedEntry,
  setDeleteEntryTarget,
  setDeleting,
  setAddDialogOpen,
  deleteEntryTarget,
}: UseSeriesHandlersOptions) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleTogglePlayed(entry: SeriesEntry) {
    const newPlayed = !entry.played;
    setSeries((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) =>
          e.id === entry.id
            ? {
                ...e,
                played: newPlayed,
                playedAt: newPlayed ? new Date().toISOString() : null,
                rating: newPlayed ? e.rating : null,
                playTimeMinutes: newPlayed ? e.playTimeMinutes : null,
                successful: newPlayed ? e.successful : null,
                playerCount: newPlayed ? e.playerCount : null,
                score: newPlayed ? e.score : null,
              }
            : e
        ),
      };
    });

    if (newPlayed) {
      setExpandedEntry(entry.id);
    } else {
      setExpandedEntry(null);
    }

    const res = await fetch(`/api/series/${seriesId}/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ played: newPlayed }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Status konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handlePlayDetailChange(entry: SeriesEntry, field: string, value: unknown) {
    setSeries((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => e.id === entry.id ? { ...e, [field]: value } : e),
      };
    });

    const res = await fetch(`/api/series/${seriesId}/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Änderung konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleRatingChange(entry: SeriesEntry, rating: number | null) {
    setSeries((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => e.id === entry.id ? { ...e, rating } : e),
      };
    });

    const res = await fetch(`/api/series/${seriesId}/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Bewertung konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleDifficultyChange(entry: SeriesEntry, difficulty: string | null) {
    setSeries((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => e.id === entry.id ? { ...e, difficulty } : e),
      };
    });

    const res = await fetch(`/api/series/${seriesId}/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Schwierigkeit konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleMoveEntry(entry: SeriesEntry, direction: "up" | "down") {
    if (!series) return;
    const entries = [...series.entries];
    const idx = entries.findIndex((e) => e.id === entry.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= entries.length) return;

    const tempOrder = entries[idx].sortOrder;
    entries[idx] = { ...entries[idx], sortOrder: entries[swapIdx].sortOrder };
    entries[swapIdx] = { ...entries[swapIdx], sortOrder: tempOrder };
    entries.sort((a, b) => a.sortOrder - b.sortOrder);

    setSeries({ ...series, entries });

    const res = await fetch(`/api/series/${seriesId}/entries/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: entries.map((e) => ({ id: e.id, sortOrder: e.sortOrder })),
      }),
    });

    if (!res.ok) {
      toast({ title: "Fehler", description: "Reihenfolge konnte nicht gespeichert werden", variant: "destructive" });
      loadSeries();
    }
  }

  async function handleDeleteEntry() {
    if (!deleteEntryTarget) return;
    setDeleting(true);

    const res = await fetch(`/api/series/${seriesId}/entries/${deleteEntryTarget.id}`, { method: "DELETE" });

    if (res.ok) {
      setSeries((prev) => {
        if (!prev) return prev;
        return { ...prev, entries: prev.entries.filter((e) => e.id !== deleteEntryTarget.id) };
      });
      toast({ title: "Entfernt", description: `${deleteEntryTarget.game.name} aus der Reihe entfernt.` });
    }

    setDeleteEntryTarget(null);
    setDeleting(false);
  }

  async function handleDeleteSeries() {
    setDeleting(true);
    const res = await fetch(`/api/series/${seriesId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/series");
    }
    setDeleting(false);
  }

  function handleGameAdded() {
    loadSeries();
    setAddDialogOpen(false);
  }

  return {
    handleTogglePlayed,
    handlePlayDetailChange,
    handleRatingChange,
    handleDifficultyChange,
    handleMoveEntry,
    handleDeleteEntry,
    handleDeleteSeries,
    handleGameAdded,
  };
}
