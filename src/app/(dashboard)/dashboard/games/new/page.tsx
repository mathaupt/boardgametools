"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewGamePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      minPlayers: parseInt(formData.get("minPlayers") as string) || 1,
      maxPlayers: parseInt(formData.get("maxPlayers") as string) || 4,
      playTimeMinutes: parseInt(formData.get("playTimeMinutes") as string) || undefined,
      complexity: parseInt(formData.get("complexity") as string) || undefined,
      bggId: formData.get("bggId") as string || undefined,
    };

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Fehler beim Erstellen");
      } else {
        router.push("/dashboard/games");
        router.refresh();
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/games">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Neues Spiel</h1>
          <p className="text-muted-foreground">Füge ein Spiel zu deiner Sammlung hinzu</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Spieldetails</CardTitle>
          <CardDescription>Gib die Informationen zum Spiel ein</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required placeholder="z.B. Catan" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Kurze Beschreibung des Spiels..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPlayers">Min. Spieler</Label>
                <Input id="minPlayers" name="minPlayers" type="number" min="1" defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max. Spieler</Label>
                <Input id="maxPlayers" name="maxPlayers" type="number" min="1" defaultValue="4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="playTimeMinutes">Spielzeit (Min.)</Label>
                <Input id="playTimeMinutes" name="playTimeMinutes" type="number" min="1" placeholder="60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complexity">Komplexität (1-5)</Label>
                <Input id="complexity" name="complexity" type="number" min="1" max="5" placeholder="3" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bggId">BoardGameGeek ID</Label>
              <Input id="bggId" name="bggId" placeholder="z.B. 13" />
              <p className="text-xs text-muted-foreground">
                Optional: Die ID findest du in der BGG-URL des Spiels
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Speichern..." : "Spiel speichern"}
              </Button>
              <Link href="/dashboard/games">
                <Button type="button" variant="outline">Abbrechen</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
