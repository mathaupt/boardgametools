"use client";

import { Button } from "@/components/ui/button";
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
import { Loader2, RefreshCcw } from "lucide-react";
import { formatLongDate } from "@/lib/date";

export function PollClosedBanner({
  finalDate,
  isCreator,
  isPast,
  resetting,
  onResetClick,
}: {
  finalDate: string;
  isCreator: boolean;
  isPast: boolean;
  resetting: boolean;
  onResetClick: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-success/50 bg-success/10 p-4 text-sm text-success">
        Die Terminabstimmung ist abgeschlossen. Der ausgewählte Termin ist{" "}
        <span className="font-semibold">
          {formatLongDate(finalDate)}
        </span>
        .
      </div>
      {isCreator && !isPast && (
        <Button
          variant="outline"
          onClick={onResetClick}
          disabled={resetting}
          data-testid="date-poll-reset"
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" aria-hidden="true" />
          )}
          Neue Terminabstimmung starten
        </Button>
      )}
    </div>
  );
}

export function ResetPollDialog({
  open,
  onOpenChange,
  resetting,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetting: boolean;
  onReset: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abstimmung zurücksetzen?</AlertDialogTitle>
          <AlertDialogDescription>
            Dadurch werden alle Terminvorschläge und Stimmen gelöscht. Du kannst im
            Anschluss eine neue Abstimmung starten.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onReset} disabled={resetting}>
            {resetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            Abstimmung zurücksetzen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
