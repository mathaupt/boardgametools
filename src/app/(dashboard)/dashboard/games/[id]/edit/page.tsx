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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Spiel wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🎲</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Spiel nicht gefunden"}
          </h1>
          <p className="text-gray-600 mb-4">
            Das gesuchte Spiel existiert nicht oder wurde gelöscht.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => router.push("/dashboard/games")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <button
            onClick={() => router.push("/dashboard")}
            className="hover:text-blue-600"
          >
            🏠 Dashboard
          </button>
          <span>/</span>
          <button
            onClick={() => router.push("/dashboard/games")}
            className="hover:text-blue-600"
          >
            🎲 Spiele
          </button>
          <span>/</span>
          <button
            onClick={() => router.push(`/dashboard/games/${gameId}`)}
            className="hover:text-blue-600"
          >
            {game.name}
          </button>
          <span>/</span>
          <span className="text-gray-900">Bearbeiten</span>
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
