"use client";

import Image from "next/image";
import { ExternalLink, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BGGGameData } from "@/lib/bgg-types";

interface BggCatalogDetailProps {
  detail: BGGGameData | null;
  loading: boolean;
  error: string | null;
  canPropose: boolean;
  proposing: boolean;
  onRetry: () => void;
  onPropose: () => void;
  onClose: () => void;
}

export function BggCatalogDetail({ detail, loading, error, canPropose, proposing, onRetry, onPropose, onClose }: BggCatalogDetailProps) {
  if (loading) return <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Spieldetails werden geladen …</p>;
  if (error) return (
    <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 p-3 text-sm">
      <p>Die Spieldetails konnten nicht geladen werden: {error}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="min-h-11" onClick={onRetry}>Erneut versuchen</Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>Schließen</Button>
      </div>
    </div>
  );
  if (!detail) return null;

  return (
    <section aria-labelledby="bgg-detail-title" className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex min-w-0 flex-wrap gap-4">
        {detail.imageUrl && <Image src={detail.imageUrl} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0 flex-1">
          <h3 id="bgg-detail-title" className="[overflow-wrap:anywhere] font-semibold text-foreground">{detail.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.minPlayers}–{detail.maxPlayers} Spieler
            {detail.playTimeMinutes ? ` · ${detail.playTimeMinutes} Min.` : ""}
            {detail.complexity ? ` · Komplexität ${detail.complexity.toFixed(1)}/5` : ""}
            {detail.rating ? ` · Rating ${detail.rating.toFixed(1)}/10` : ""}
          </p>
          {detail.description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{detail.description}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={onPropose} disabled={!canPropose || proposing}>
          {proposing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 h-4 w-4" aria-hidden="true" />}
          {proposing ? "Wird vorgeschlagen …" : "Vorschlagen"}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" asChild>
          <a href={`https://boardgamegeek.com/boardgame/${detail.bggId}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />Auf BoardGameGeek
          </a>
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 min-w-11" onClick={onClose} aria-label="Details schließen">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
