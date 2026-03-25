import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SeriesEntry } from "./types";

interface SeriesDeleteDialogsProps {
  deleteSeriesOpen: boolean;
  onDeleteSeriesOpenChange: (open: boolean) => void;
  deleteEntryTarget: SeriesEntry | null;
  onDeleteEntryTargetChange: (entry: SeriesEntry | null) => void;
  onDeleteSeries: () => void;
  onDeleteEntry: () => void;
  deleting: boolean;
  seriesName: string;
}

export function SeriesDeleteDialogs({
  deleteSeriesOpen,
  onDeleteSeriesOpenChange,
  deleteEntryTarget,
  onDeleteEntryTargetChange,
  onDeleteSeries,
  onDeleteEntry,
  deleting,
  seriesName,
}: SeriesDeleteDialogsProps) {
  return (
    <>
      <AlertDialog open={!!deleteEntryTarget} onOpenChange={(open) => { if (!open) onDeleteEntryTargetChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel aus Reihe entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du <strong>{deleteEntryTarget?.game.name}</strong> aus dieser Reihe entfernen?
              Das Spiel bleibt in deiner Sammlung erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteEntry}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Wird entfernt..." : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteSeriesOpen} onOpenChange={onDeleteSeriesOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reihe löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Reihe <strong>{seriesName}</strong> wirklich löschen?
              Die Spiele bleiben in deiner Sammlung, nur die Reihe und der Fortschritt werden entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteSeries}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Wird gelöscht..." : "Reihe löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
