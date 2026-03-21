"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GamesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Games error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Fehler in der Spieleverwaltung</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Beim Laden der Spiele ist ein Fehler aufgetreten. Bitte versuche es erneut.
      </p>
      <Button onClick={reset} variant="outline">
        Erneut versuchen
      </Button>
    </div>
  );
}
