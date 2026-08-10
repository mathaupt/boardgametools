"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Game } from "@/generated/prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditGameFormProps {
  game: Game;
  onSave?: (game: Partial<Game>) => void;
  onCancel?: () => void;
}

export default function EditGameForm({ game, onSave, onCancel }: EditGameFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: game.name,
    description: game.description || "",
    minPlayers: String(game.minPlayers),
    maxPlayers: String(game.maxPlayers),
    playTimeMinutes: game.playTimeMinutes ? String(game.playTimeMinutes) : "",
    complexity: String(game.complexity ?? 1),
    bggId: game.bggId || "",
    imageUrl: game.imageUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          minPlayers: parseInt(formData.minPlayers) || 1,
          maxPlayers: parseInt(formData.maxPlayers) || 4,
          playTimeMinutes: formData.playTimeMinutes ? parseInt(formData.playTimeMinutes) : null,
          complexity: parseInt(formData.complexity) || 1,
          bggId: formData.bggId || undefined,
          imageUrl: formData.imageUrl || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Speichern");
      }

      const updatedGame = await response.json();
      onSave?.(updatedGame);
      router.push(`/dashboard/games/${game.id}`);
    } catch {
      toast({ title: "Fehler", description: "Fehler beim Speichern des Spiels", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = onCancel ?? (() => router.push(`/dashboard/games/${game.id}`));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Spiel bearbeiten</h1>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Spieldetails</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Spielname *</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPlayers">Min. Spieler *</Label>
                  <Input
                    id="minPlayers"
                    type="number"
                    name="minPlayers"
                    value={formData.minPlayers}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPlayers">Max. Spieler *</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    name="maxPlayers"
                    value={formData.maxPlayers}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playTimeMinutes">Spieldauer (Minuten)</Label>
                  <Input
                    id="playTimeMinutes"
                    type="number"
                    name="playTimeMinutes"
                    value={formData.playTimeMinutes}
                    onChange={handleChange}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complexity">Komplexität</Label>
                  <Select value={formData.complexity} onValueChange={(v) => setFormData((prev) => ({ ...prev, complexity: v }))}>
                    <SelectTrigger id="complexity" className="w-full">
                      <SelectValue placeholder="Komplexität auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Sehr einfach</SelectItem>
                      <SelectItem value="2">2 - Einfach</SelectItem>
                      <SelectItem value="3">3 - Mittel</SelectItem>
                      <SelectItem value="4">4 - Komplex</SelectItem>
                      <SelectItem value="5">5 - Sehr komplex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bggId">BGG ID</Label>
                <Input
                  id="bggId"
                  type="text"
                  name="bggId"
                  value={formData.bggId}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Bild URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Wird gespeichert…" : "Speichern"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
