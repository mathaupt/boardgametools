"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GroupsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Groups error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Fehler in der Gruppenverwaltung</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Beim Laden der Gruppen ist ein Fehler aufgetreten. Bitte versuche es erneut.
      </p>
      <Button onClick={reset} variant="outline">
        Erneut versuchen
      </Button>
    </div>
  );
}
