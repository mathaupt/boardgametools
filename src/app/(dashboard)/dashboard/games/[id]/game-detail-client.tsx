"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export interface SerializedGame {
  id: string;
  name: string;
  description: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
  imageUrl: string | null;
  tags: { tag: { id: string; name: string } }[];
}

export default function GameDetailClient({ game }: { game: SerializedGame }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Fehler beim Loeschen des Spiels");
      router.push("/dashboard/games");
    } catch (_error) {
      console.error("Delete error:", _error);
      setError("Fehler beim Loeschen des Spiels");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{error}</h1>
          <div className="flex gap-2 justify-center">
            <button onClick={() => router.push("/dashboard")} className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80">Dashboard</button>
            <button onClick={() => router.push("/dashboard/games")} className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">Zurueck zur Spielsammlung</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground hover:text-foreground min-w-0">
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 hover:text-primary">Dashboard</button>
            <span>/</span>
            <button onClick={() => router.push("/dashboard/games")} className="hover:text-primary">Spiele</button>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{game.name}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/dashboard/games/${game.id}/edit`)} className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">Bearbeiten</button>
            <button onClick={() => setShowDeleteModal(true)} className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90">Loeschen</button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              {game.imageUrl ? (
                <Image src={game.imageUrl} alt={game.name} width={800} height={256} className="w-full h-64 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-muted-foreground text-6xl">?</div>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{game.name}</h1>
              {game.description && <p className="text-muted-foreground mb-4">{game.description}</p>}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/50 p-3 rounded">
                  <div className="text-sm text-muted-foreground">Spieleranzahl</div>
                  <div className="font-semibold">{game.minPlayers} - {game.maxPlayers}</div>
                </div>
                {game.playTimeMinutes && (
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm text-muted-foreground">Spieldauer</div>
                    <div className="font-semibold">{game.playTimeMinutes} Min.</div>
                  </div>
                )}
                {game.complexity && (
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm text-muted-foreground">Komplexitaet</div>
                    <div className="font-semibold">{"*".repeat(game.complexity)}{"_".repeat(5 - game.complexity)}</div>
                  </div>
                )}
                {game.bggId && (
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm text-muted-foreground">BGG ID</div>
                    <div className="font-semibold">{game.bggId}</div>
                  </div>
                )}
              </div>
              {game.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {game.tags.map((gt) => (
                    <span key={gt.tag.id} className="bg-muted px-2 py-1 rounded text-xs">{gt.tag.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Spiel loeschen?</h2>
            <p className="text-muted-foreground mb-6">Bist du sicher, dass du das Spiel &ldquo;{game.name}&rdquo; loeschen moechtest? Diese Aktion kann nicht rueckgaengig gemacht werden.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-muted-foreground border border-border rounded hover:bg-muted/50" disabled={isDeleting}>Abbrechen</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50" disabled={isDeleting}>{isDeleting ? "Wird geloescht..." : "Loeschen"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
