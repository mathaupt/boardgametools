"use client";

import { useState, useCallback } from "react";
import { AddGameDialog } from "./add-game-dialog";
import { SeriesDetailHeader } from "./series-detail-header";
import { SeriesProgressCard } from "./series-progress-card";
import { SeriesEntryList } from "./series-entry-list";
import { SeriesDeleteDialogs } from "./series-delete-dialogs";
import { useSeriesHandlers } from "./use-series-handlers";
import type { GameSeries, SeriesEntry } from "./types";

interface SeriesDetailClientProps {
  initialSeries: GameSeries;
  seriesId: string;
}

export default function SeriesDetailClient({ initialSeries, seriesId }: SeriesDetailClientProps) {
  const [series, setSeries] = useState<GameSeries | null>(initialSeries);
  const [deleteSeriesOpen, setDeleteSeriesOpen] = useState(false);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<SeriesEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    const res = await fetch(`/api/series/${seriesId}`);
    if (res.ok) setSeries(await res.json());
  }, [seriesId]);

  const {
    handleTogglePlayed,
    handlePlayDetailChange,
    handleRatingChange,
    handleDifficultyChange,
    handleMoveEntry,
    handleDeleteEntry,
    handleDeleteSeries,
    handleGameAdded,
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

  if (!series) return null;

  return (
    <div className="space-y-6">
      <SeriesDetailHeader series={series} seriesId={seriesId} onDeleteClick={() => setDeleteSeriesOpen(true)} />
      <SeriesProgressCard entries={series.entries} />
      <SeriesEntryList
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
      <AddGameDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} seriesId={seriesId} existingGameIds={series.entries.map((e) => e.gameId)} onGameAdded={handleGameAdded} />
      <SeriesDeleteDialogs deleteSeriesOpen={deleteSeriesOpen} onDeleteSeriesOpenChange={setDeleteSeriesOpen} deleteEntryTarget={deleteEntryTarget} onDeleteEntryTargetChange={setDeleteEntryTarget} onDeleteSeries={handleDeleteSeries} onDeleteEntry={handleDeleteEntry} deleting={deleting} seriesName={series.name} />
    </div>
  );
}
