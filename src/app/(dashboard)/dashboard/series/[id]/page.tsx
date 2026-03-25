"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AddGameDialog } from "./add-game-dialog";
import { SeriesDetailHeader } from "./series-detail-header";
import { SeriesProgressCard } from "./series-progress-card";
import { SeriesEntryList } from "./series-entry-list";
import { SeriesDeleteDialogs } from "./series-delete-dialogs";
import { SeriesLoadingSkeleton } from "./series-loading-skeleton";
import { SeriesNotFound } from "./series-not-found";
import { useSeriesHandlers } from "./use-series-handlers";
import type { GameSeries, SeriesEntry } from "./types";

export default function SeriesDetailPage() {
  const params = useParams();
  const seriesId = params.id as string;

  const [series, setSeries] = useState<GameSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSeriesOpen, setDeleteSeriesOpen] = useState(false);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<SeriesEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    const res = await fetch(`/api/series/${seriesId}`);
    if (res.ok) {
      setSeries(await res.json());
    }
    setLoading(false);
  }, [seriesId]);

  useEffect(() => { loadSeries(); }, [loadSeries]);

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

  if (loading) {
    return <SeriesLoadingSkeleton />;
  }

  if (!series) {
    return <SeriesNotFound />;
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <SeriesDetailHeader
        series={series}
        seriesId={seriesId}
        onDeleteClick={() => setDeleteSeriesOpen(true)}
      />

      {/* Progress Card */}
      <SeriesProgressCard entries={series.entries} />

      {/* Games section with filter/sort and entry list */}
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

      {/* Add Game Dialog */}
      <AddGameDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        seriesId={seriesId}
        existingGameIds={series.entries.map((e) => e.gameId)}
        onGameAdded={handleGameAdded}
      />

      {/* Delete confirmation dialogs */}
      <SeriesDeleteDialogs
        deleteSeriesOpen={deleteSeriesOpen}
        onDeleteSeriesOpenChange={setDeleteSeriesOpen}
        deleteEntryTarget={deleteEntryTarget}
        onDeleteEntryTargetChange={setDeleteEntryTarget}
        onDeleteSeries={handleDeleteSeries}
        onDeleteEntry={handleDeleteEntry}
        deleting={deleting}
        seriesName={series.name}
      />
    </div>
  );
}
