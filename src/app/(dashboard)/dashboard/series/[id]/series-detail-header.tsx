import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import type { GameSeries } from "./types";

interface SeriesDetailHeaderProps {
  series: GameSeries;
  seriesId: string;
  onDeleteClick: () => void;
}

export function SeriesDetailHeader({ series, seriesId, onDeleteClick }: SeriesDetailHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Zurück zur Reihenübersicht">
          <Link href="/dashboard/series">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{series.name}</h1>
          {series.description && (
            <p className="text-muted-foreground mt-0.5">{series.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-11 sm:ml-0">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/series/${seriesId}/edit`}>
            <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
            Bearbeiten
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onDeleteClick}
        >
          <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
          Löschen
        </Button>
      </div>
    </div>
  );
}
