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
import { BarcodeScanner } from "@/components/barcode-scanner";
import type { GameItem } from "./games-list-client";

interface GamesListOverlaysProps {
  deleteTarget: GameItem | null;
  deleteAllOpen: boolean;
  totalCount: number;
  deleting: boolean;
  barcodeScannerOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteAllOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onDeleteAll: () => void;
  onBarcodeScannerOpenChange: (open: boolean) => void;
  onBarcodeGameSelected: (bggId: string, ean: string) => void;
  onLocalGameFound: (gameId: string) => void;
}

export function GamesListOverlays({
  deleteTarget,
  deleteAllOpen,
  totalCount,
  deleting,
  barcodeScannerOpen,
  onDeleteOpenChange,
  onDeleteAllOpenChange,
  onDelete,
  onDeleteAll,
  onBarcodeScannerOpenChange,
  onBarcodeGameSelected,
  onLocalGameFound,
}: GamesListOverlaysProps) {
  return (
    <>
      <AlertDialog open={!!deleteTarget} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du <strong>{deleteTarget?.name}</strong> wirklich aus deiner Sammlung entfernen?
              Alle zugehörigen Sessions werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="bg-card text-card-foreground hover:bg-muted border border-border">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Wird entfernt…" : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllOpen} onOpenChange={onDeleteAllOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Spiele entfernen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du wirklich alle <strong>{totalCount} Spiele</strong> aus deiner Sammlung entfernen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="bg-card text-card-foreground hover:bg-muted border border-border">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteAll} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Wird entfernt…" : `Alle ${totalCount} entfernen`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BarcodeScanner
        open={barcodeScannerOpen}
        onOpenChange={onBarcodeScannerOpenChange}
        onGameSelected={onBarcodeGameSelected}
        onLocalGameFound={onLocalGameFound}
      />
    </>
  );
}
