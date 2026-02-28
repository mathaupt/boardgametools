"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Game } from "@prisma/client";

interface EditGameFormProps {
  game: Game;
  onSave: (game: Partial<Game>) => void;
  onCancel: () => void;
}

export default function EditGameForm({ game, onSave, onCancel }: EditGameFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: game.name,
    description: game.description || "",
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    playTimeMinutes: game.playTimeMinutes || "",
    complexity: game.complexity || 1,
    bggId: game.bggId || "",
    imageUrl: game.imageUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          playTimeMinutes: formData.playTimeMinutes ? parseInt(formData.playTimeMinutes.toString()) : null,
          complexity: parseInt(formData.complexity.toString()),
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      const updatedGame = await response.json();
      onSave(updatedGame);
      router.push(`/dashboard/games/${game.id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Fehler beim Speichern des Spiels');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Spiel bearbeiten</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Spielname *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Beschreibung
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Min. Spieler *
                </label>
                <input
                  type="number"
                  name="minPlayers"
                  value={formData.minPlayers}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Max. Spieler *
                </label>
                <input
                  type="number"
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Spieldauer (Minuten)
                </label>
                <input
                  type="number"
                  name="playTimeMinutes"
                  value={formData.playTimeMinutes}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Komplexität
                </label>
                <select
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={1}>1 - Sehr einfach</option>
                  <option value={2}>2 - Einfach</option>
                  <option value={3}>3 - Mittel</option>
                  <option value={4}>4 - Komplex</option>
                  <option value={5}>5 - Sehr komplex</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                BGG ID
              </label>
              <input
                type="text"
                name="bggId"
                value={formData.bggId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Bild URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted/50"
                disabled={isSaving}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Wird gespeichert...' : 'Speichern'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
