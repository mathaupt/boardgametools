"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
      } catch (_err) {
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
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Spiel wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-destructive text-6xl mb-4">🎲</div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground hover:text-foreground min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 hover:text-primary"
            >
              🏠 Dashboard
            </button>
            <span>/</span>
            <button
              onClick={() => router.push("/dashboard/games")}
              className="hover:text-primary"
            >
              🎲 Spiele
            </button>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{game?.name || 'Spiel'}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleEdit}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Bearbeiten
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90"
            >
              Löschen
            </button>
          </div>
        </div>

        {/* Game Details */}
        <div className="bg-card rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Game Image */}
            <div className="md:col-span-1">
              {game.imageUrl ? (
                <Image
                  src={game.imageUrl}
                  alt={game.name}
                  width={800}
                  height={256}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-muted-foreground text-6xl">🎲</div>
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="md:col-span-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                {game.name}
              </h1>
              
              {game.description && (
                <p className="text-muted-foreground mb-4">{game.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/50 p-3 rounded">
                  <div className="text-sm text-muted-foreground">Spieleranzahl</div>
                  <div className="font-semibold">
                    {game.minPlayers} - {game.maxPlayers}
                  </div>
                </div>
                
                {game.playTimeMinutes && (
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm text-muted-foreground">Spieldauer</div>
                    <div className="font-semibold">{game.playTimeMinutes} Min.</div>
                  </div>
                )}
                
                {game.complexity && (
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm text-muted-foreground">Komplexität</div>
                    <div className="font-semibold">
                      {"★".repeat(game.complexity)}{"☆".repeat(5 - game.complexity)}
                    </div>
                  </div>
                )}
                
                {game.bggId && (
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm text-muted-foreground">BGG ID</div>
                    <div className="font-semibold">{game.bggId}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button className="bg-success text-success-foreground px-4 py-2 rounded hover:bg-success/90">
                  Session starten
                </button>
                <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80">
                  Statistiken
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions History */}
        <div className="mt-8 bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Gespielte Sessions</h2>
          <div className="text-muted-foreground text-center py-8">
            Noch keine Sessions für dieses Spiel gespielt.
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Spiel löschen?</h2>
            <p className="text-muted-foreground mb-6">
              Bist du sicher, dass du das Spiel &ldquo;{game?.name}&rdquo; löschen möchtest? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-muted-foreground border border-border rounded hover:bg-muted/50"
                disabled={isDeleting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
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
