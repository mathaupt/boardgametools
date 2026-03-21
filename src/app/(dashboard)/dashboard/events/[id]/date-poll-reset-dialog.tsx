"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCcw } from "lucide-react";

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
        Die Terminabstimmung ist abgeschlossen. Der ausgewählte Termin ist
        <span className="font-semibold">
          {" "}
          {new Date(finalDate).toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
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
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" />
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abstimmung zurücksetzen?</DialogTitle>
          <DialogDescription>
            Dadurch werden alle Terminvorschläge und Stimmen gelöscht. Du kannst im
            Anschluss eine neue Abstimmung starten.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={resetting}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={onReset}
            disabled={resetting}
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Abstimmung zurücksetzen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
