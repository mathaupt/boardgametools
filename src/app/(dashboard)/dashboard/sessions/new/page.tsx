"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Game, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Trophy, Users } from "lucide-react";

interface Player {
  userId: string;
  user?: User;
  score?: number | null;
  isWinner: boolean;
  placement?: number | null;
}

export default function NewSessionPage() {
  const router = useRouter();
  
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    gameId: "",
    playedAt: new Date().toISOString().split('T')[0],
    durationMinutes: "",
    notes: ""
  });
  
  const [players, setPlayers] = useState<Player[]>([
    { userId: "", score: null, isWinner: false, placement: 1 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, usersRes] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/users')
        ]);
        
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setGames(gamesData);
        }
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addPlayer = () => {
    const nextPlacement = Math.max(...players.map(p => p.placement || 0), 0) + 1;
    setPlayers([...players, { 
      userId: "", 
      score: null, 
      isWinner: false, 
      placement: nextPlacement 
    }]);
  };

  const removePlayer = (index: number) => {
    const newPlayers = players.filter((_, i) => i !== index);
    // Re-number placements
    const renumbered = newPlayers.map((player, i) => ({
      ...player,
      placement: i + 1
    }));
    setPlayers(renumbered);
  };

  const updatePlayer = (index: number, field: keyof Player, value: any) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    
    // If winner is set, update other players
    if (field === 'isWinner' && value === true) {
      newPlayers.forEach((player, i) => {
        if (i !== index) {
          player.isWinner = false;
        }
      });
    }
    
    setPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
          players: players.map(p => ({
            userId: p.userId,
            score: p.score || null,
            isWinner: p.isWinner,
            placement: p.placement || null
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Session');
      }

      router.push('/dashboard/sessions');
    } catch (error) {
      console.error('Save error:', error);
      alert('Fehler beim Speichern der Session');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Neue Session eintragen</h1>
          <p className="text-muted-foreground">Dokumentiere eine gespielte Brettspiel-Session</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Grundlegende Informationen zur Session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gameId">Spiel *</Label>
                <select
                  id="gameId"
                  value={formData.gameId}
                  onChange={(e) => setFormData(prev => ({ ...prev, gameId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Spiel auswählen</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name} ({game.minPlayers}-{game.maxPlayers} Spieler)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="playedAt">Gespielt am *</Label>
                <Input
                  id="playedAt"
                  type="date"
                  value={formData.playedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, playedAt: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="durationMinutes">Dauer (Minuten)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: e.target.value }))}
                  placeholder="z.B. 90"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Besondere Ereignisse, lustige Momente, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Spieler & Ergebnisse
            </CardTitle>
            <CardDescription>Wer hat gespielt und wie waren die Ergebnisse?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {players.map((player, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Spieler *</Label>
                    <select
                      value={player.userId}
                      onChange={(e) => updatePlayer(index, 'userId', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Spieler auswählen</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Platzierung</Label>
                    <Input
                      type="number"
                      value={player.placement || ""}
                      onChange={(e) => updatePlayer(index, 'placement', parseInt(e.target.value) || null)}
                      placeholder="1"
                      min="1"
                    />
                  </div>

                  <div>
                    <Label>Punkte</Label>
                    <Input
                      type="number"
                      value={player.score || ""}
                      onChange={(e) => updatePlayer(index, 'score', parseInt(e.target.value) || null)}
                      placeholder="z.B. 100"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        id={`winner-${index}`}
                        checked={player.isWinner}
                        onChange={(e) => updatePlayer(index, 'isWinner', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`winner-${index}`} className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Gewinner
                      </Label>
                    </div>
                  </div>
                </div>

                {players.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePlayer(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addPlayer}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Spieler hinzufügen
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/sessions')}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Wird gespeichert...' : 'Session speichern'}
          </Button>
        </div>
      </form>
    </div>
  );
}
