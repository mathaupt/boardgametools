"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Game } from "@prisma/client";

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Spiels');
      }
      
      // Erfolgreich gelöscht - zur Übersicht navigieren
      router.push('/dashboard/games');
    } catch (error) {
      console.error('Delete error:', error);
      setError('Fehler beim Löschen des Spiels');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    // Navigiere zur Edit-Seite (noch nicht implementiert)
    router.push(`/dashboard/games/${gameId}/edit`);
  };

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 hover:text-blue-600"
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
            <span className="text-gray-900">{game?.name || 'Spiel'}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Bearbeiten
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>

        {/* Game Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Game Image */}
            <div className="md:col-span-1">
              {game.imageUrl ? (
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-6xl">🎲</div>
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {game.name}
              </h1>
              
              {game.description && (
                <p className="text-gray-600 mb-4">{game.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Spieleranzahl</div>
                  <div className="font-semibold">
                    {game.minPlayers} - {game.maxPlayers}
                  </div>
                </div>
                
                {game.playTimeMinutes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Spieldauer</div>
                    <div className="font-semibold">{game.playTimeMinutes} Min.</div>
                  </div>
                )}
                
                {game.complexity && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Komplexität</div>
                    <div className="font-semibold">
                      {"★".repeat(game.complexity)}{"☆".repeat(5 - game.complexity)}
                    </div>
                  </div>
                )}
                
                {game.bggId && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">BGG ID</div>
                    <div className="font-semibold">{game.bggId}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Session starten
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Statistiken
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions History */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Gespielte Sessions</h2>
          <div className="text-gray-500 text-center py-8">
            Noch keine Sessions für dieses Spiel gespielt.
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Spiel löschen?</h2>
            <p className="text-gray-600 mb-6">
              Bist du sicher, dass du das Spiel "{game?.name}" löschen möchtest? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                disabled={isDeleting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
