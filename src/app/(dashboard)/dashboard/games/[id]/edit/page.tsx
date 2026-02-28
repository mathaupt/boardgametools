"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Game } from "@prisma/client";
import EditGameForm from "./EditGameForm";

export default function EditGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Spiel nicht gefunden");
          } else {
            setError("Fehler beim Laden des Spiels");
          }
          return;
        }
        
        const gameData = await response.json();
        setGame(gameData);
      } catch (err) {
        setError("Netzwerkfehler beim Laden des Spiels");
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Spiel wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🎲</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Spiel nicht gefunden"}
          </h1>
          <p className="text-muted-foreground mb-4">
            Das gesuchte Spiel existiert nicht oder wurde gelöscht.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80"
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => router.push("/dashboard/games")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              🎲 Zurück zur Spielsammlung
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <button
            onClick={() => router.push("/dashboard")}
            className="hover:text-primary">
            🏠 Dashboard
          </button>
          <span>/</span>
          <button
            onClick={() => router.push("/dashboard/games")}
            className="hover:text-primary">
            🎲 Spiele
          </button>
          <span>/</span>
          <button
            onClick={() => router.push(`/dashboard/games/${gameId}`)}
            className="hover:text-primary">
            {game.name}
          </button>
          <span>/</span>
          <span className="text-foreground">Bearbeiten</span>
        </div>
      </div>

      <EditGameForm 
        game={game} 
        onSave={() => {}} 
        onCancel={() => router.push(`/dashboard/games/${gameId}`)} 
      />
    </div>
  );
}
