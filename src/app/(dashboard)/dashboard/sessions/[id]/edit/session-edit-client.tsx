"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Trophy, Users } from "lucide-react";

interface Player {
  userId: string;
  score?: number | null;
  isWinner: boolean;
  placement?: number | null;
}

export interface SerializedSession {
  id: string;
  gameId: string;
  playedAt: string;
  durationMinutes: number | null;
  notes: string | null;
  players: { userId: string; score: number | null; isWinner: boolean; placement: number | null }[];
}

export interface SerializedSessionGame {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface SerializedUser {
  id: string;
  name: string | null;
  email: string;
}

interface SessionEditClientProps {
  session: SerializedSession;
  games: SerializedSessionGame[];
  users: SerializedUser[];
}

export default function SessionEditClient({ session, games, users }: SessionEditClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    gameId: session.gameId,
    playedAt: new Date(session.playedAt).toISOString().split("T")[0],
    durationMinutes: session.durationMinutes?.toString() || "",
    notes: session.notes || "",
  });

  const [players, setPlayers] = useState<Player[]>(
    session.players.map((p) => ({ userId: p.userId, score: p.score, isWinner: p.isWinner, placement: p.placement }))
  );

  const addPlayer = () => {
    const nextPlacement = Math.max(...players.map((p) => p.placement || 0), 0) + 1;
    setPlayers([...players, { userId: "", score: null, isWinner: false, placement: nextPlacement }]);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index).map((p, i) => ({ ...p, placement: i + 1 })));
  };

  const updatePlayer = <K extends keyof Player>(index: number, field: K, value: Player[K]) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    if (field === "isWinner" && value === true) {
      newPlayers.forEach((p, i) => { if (i !== index) p.isWinner = false; });
    }
    setPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
          players: players.map((p) => ({ userId: p.userId, score: p.score || null, isWinner: p.isWinner, placement: p.placement || null })),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Fehler beim Speichern"); }
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Session bearbeiten</h1>
        <p className="text-muted-foreground">Ändere die Details dieser Session</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle as="h2">Session Details</CardTitle><CardDescription>Grundlegende Informationen</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gameId">Spiel *</Label>
                <Select value={formData.gameId} onValueChange={(value) => setFormData((p) => ({ ...p, gameId: value }))}>
                  <SelectTrigger id="gameId">
                    <SelectValue placeholder="Spiel auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((g) => <SelectItem key={g.id} value={g.id}>{g.name} ({g.minPlayers}-{g.maxPlayers})</SelectItem>)}
                  </SelectContent>
                </Select>
                <input type="hidden" name="gameId" value={formData.gameId} required />
              </div>
              <div><Label htmlFor="playedAt">Gespielt am *</Label><Input id="playedAt" type="date" value={formData.playedAt} onChange={(e) => setFormData((p) => ({ ...p, playedAt: e.target.value }))} required /></div>
              <div><Label htmlFor="dur">Dauer (Min)</Label><Input id="dur" type="number" value={formData.durationMinutes} onChange={(e) => setFormData((p) => ({ ...p, durationMinutes: e.target.value }))} placeholder="90" min="1" /></div>
            </div>
            <div><Label htmlFor="notes">Notizen</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={3} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2" as="h2"><Users className="h-5 w-5" aria-hidden="true" />Spieler & Ergebnisse</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {players.map((player, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`player-${i}`}>Spieler *</Label>
                    <Select value={player.userId} onValueChange={(value) => updatePlayer(i, "userId", value)}>
                      <SelectTrigger id={`player-${i}`}>
                        <SelectValue placeholder="Spieler wählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name={`player-${i}`} value={player.userId} required />
                  </div>
                  <div><Label htmlFor={`placement-${i}`}>Platz</Label><Input id={`placement-${i}`} type="number" value={player.placement || ""} onChange={(e) => updatePlayer(i, "placement", parseInt(e.target.value) || null)} min="1" /></div>
                  <div><Label htmlFor={`score-${i}`}>Punkte</Label><Input id={`score-${i}`} type="number" value={player.score || ""} onChange={(e) => updatePlayer(i, "score", parseInt(e.target.value) || null)} /></div>
                  <div className="flex items-center gap-2 mt-6"><Checkbox id={`winner-${i}`} checked={player.isWinner} onChange={(e) => updatePlayer(i, "isWinner", e.target.checked)} /><Label htmlFor={`winner-${i}`} className="flex items-center gap-1"><Trophy className="h-4 w-4 text-warning" aria-hidden="true" />Gewinner</Label></div>
                </div>
                {players.length > 1 && <Button type="button" variant="outline" size="sm" onClick={() => removePlayer(i)} aria-label="Spieler entfernen"><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPlayer} className="w-full"><Plus className="h-4 w-4 mr-2" aria-hidden="true" />Spieler hinzufügen</Button>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/sessions/${session.id}`)} disabled={saving}>Abbrechen</Button>
          <Button type="submit" disabled={saving}>{saving ? "Wird gespeichert…" : "Änderungen speichern"}</Button>
        </div>
      </form>
    </div>
  );
}
