"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-foreground p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Kritischer Fehler</h1>
          <p className="text-muted-foreground">
            Die Anwendung konnte nicht geladen werden.
          </p>
          <Button onClick={reset}>Erneut versuchen</Button>
        </div>
      </body>
    </html>
  );
}
