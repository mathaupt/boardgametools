"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
        <p className="text-muted-foreground">Aendere die Details dieser Session</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Session Details</CardTitle><CardDescription>Grundlegende Informationen</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gameId">Spiel *</Label>
                <select id="gameId" value={formData.gameId} onChange={(e) => setFormData((p) => ({ ...p, gameId: e.target.value }))} required className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Spiel auswaehlen</option>
                  {games.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.minPlayers}-{g.maxPlayers})</option>)}
                </select>
              </div>
              <div><Label htmlFor="playedAt">Gespielt am *</Label><Input id="playedAt" type="date" value={formData.playedAt} onChange={(e) => setFormData((p) => ({ ...p, playedAt: e.target.value }))} required /></div>
              <div><Label htmlFor="dur">Dauer (Min)</Label><Input id="dur" type="number" value={formData.durationMinutes} onChange={(e) => setFormData((p) => ({ ...p, durationMinutes: e.target.value }))} placeholder="90" min="1" /></div>
            </div>
            <div><Label htmlFor="notes">Notizen</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={3} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Spieler & Ergebnisse</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {players.map((player, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><Label>Spieler *</Label><select value={player.userId} onChange={(e) => updatePlayer(i, "userId", e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md"><option value="">Waehlen</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                  <div><Label>Platz</Label><Input type="number" value={player.placement || ""} onChange={(e) => updatePlayer(i, "placement", parseInt(e.target.value) || null)} min="1" /></div>
                  <div><Label>Punkte</Label><Input type="number" value={player.score || ""} onChange={(e) => updatePlayer(i, "score", parseInt(e.target.value) || null)} /></div>
                  <div className="flex items-center gap-2 mt-6"><input type="checkbox" checked={player.isWinner} onChange={(e) => updatePlayer(i, "isWinner", e.target.checked)} className="rounded" /><Label className="flex items-center gap-1"><Trophy className="h-4 w-4 text-warning" />Gewinner</Label></div>
                </div>
                {players.length > 1 && <Button type="button" variant="outline" size="sm" onClick={() => removePlayer(i)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPlayer} className="w-full"><Plus className="h-4 w-4 mr-2" />Spieler hinzufuegen</Button>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/sessions/${session.id}`)} disabled={saving}>Abbrechen</Button>
          <Button type="submit" disabled={saving}>{saving ? "Wird gespeichert..." : "Aenderungen speichern"}</Button>
        </div>
      </form>
    </div>
  );
}
