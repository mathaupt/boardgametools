"use client";

import { useState, useCallback } from "react";
import { AddGameDialog } from "./add-game-dialog";
import { SeriesDetailHeader } from "./series-detail-header";
import { SeriesProgressCard } from "./series-progress-card";
import { SeriesEntryList } from "./series-entry-list";
import { SeriesDeleteDialogs } from "./series-delete-dialogs";
import { useSeriesHandlers } from "./use-series-handlers";
import type { GameSeries, SeriesEntry, AddSeriesGameInput } from "./types";

interface SeriesDetailClientProps {
  initialSeries: GameSeries;
  seriesId: string;
}

export default function SeriesDetailClient({ initialSeries, seriesId }: SeriesDetailClientProps) {
  const [listRevision, setListRevision] = useState(0);
  const [series, setSeries] = useState<GameSeries | null>(initialSeries);
  const [deleteSeriesOpen, setDeleteSeriesOpen] = useState(false);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<SeriesEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    try {
      const res = await fetch(`/api/series/${seriesId}`, { cache: "no-store" });
      if (!res.ok) return null;
      const current: GameSeries = await res.json();
      setSeries(current);
      return current;
    } catch {
      return null;
    }
  }, [seriesId]);

  const {
    handleTogglePlayed,
    handlePlayDetailChange,
    handleRatingChange,
    handleDifficultyChange,
    handleMoveEntry,
    handleDeleteEntry,
    handleDeleteSeries,
    handleGameAdded: refreshAfterGameAdded,
  } = useSeriesHandlers({
    seriesId,
    series,
    setSeries,
    loadSeries,
    setExpandedEntry,
    setDeleteEntryTarget,
    setDeleting,
    setAddDialogOpen,
    deleteEntryTarget,
  });

  async function handleGameAdded(inputs: AddSeriesGameInput[], closeDialog: boolean) {
    await refreshAfterGameAdded(inputs, closeDialog);
    setListRevision(revision => revision + 1);
  }

  if (!series) return null;

  return (
    <div className="space-y-6">
      <SeriesDetailHeader series={series} seriesId={seriesId} onDeleteClick={() => setDeleteSeriesOpen(true)} />
      <SeriesProgressCard entries={series.entries} />
      <SeriesEntryList key={listRevision}
        entries={series.entries}
        expandedEntry={expandedEntry}
        onToggleExpanded={(id) => setExpandedEntry(expandedEntry === id ? null : id)}
        onAddClick={() => setAddDialogOpen(true)}
        onTogglePlayed={handleTogglePlayed}
        onMoveEntry={handleMoveEntry}
        onRatingChange={handleRatingChange}
        onDifficultyChange={handleDifficultyChange}
        onPlayDetailChange={handlePlayDetailChange}
        onDeleteEntry={setDeleteEntryTarget}
      />
      <AddGameDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} seriesId={seriesId} existingGameIds={series.entries.map((e) => e.gameId)} existingBggIds={series.entries.map((e) => e.game.bggId).filter((id): id is string => Boolean(id))} onGamesAdded={handleGameAdded} />
      <SeriesDeleteDialogs deleteSeriesOpen={deleteSeriesOpen} onDeleteSeriesOpenChange={setDeleteSeriesOpen} deleteEntryTarget={deleteEntryTarget} onDeleteEntryTargetChange={setDeleteEntryTarget} onDeleteSeries={handleDeleteSeries} onDeleteEntry={handleDeleteEntry} deleting={deleting} seriesName={series.name} />
    </div>
  );
}
