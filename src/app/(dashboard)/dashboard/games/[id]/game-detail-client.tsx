"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export interface SerializedGame {
  id: string;
  name: string;
  description: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
  imageUrl: string | null;
  tags: { tag: { id: string; name: string } }[];
}

export default function GameDetailClient({ game }: { game: SerializedGame }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Fehler beim Löschen des Spiels");
      router.push("/dashboard/games");
    } catch (_error) {
      toast({
        title: "Fehler",
        description: "Spiel konnte nicht gelöscht werden.",
        variant: "destructive",
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-muted-foreground min-w-0">
            <Button variant="ghost" size="sm" className="h-auto px-1" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <span aria-hidden="true">/</span>
            <Button variant="ghost" size="sm" className="h-auto px-1" asChild>
              <Link href="/dashboard/games">Spiele</Link>
            </Button>
            <span aria-hidden="true">/</span>
            <span className="text-foreground truncate max-w-[200px]" title={game.name}>
              {game.name}
            </span>
          </nav>

          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/dashboard/games/${game.id}/edit`}>Bearbeiten</Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isDeleting}>
              Löschen
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {game.imageUrl ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={game.imageUrl}
                      alt={`Cover von ${game.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-6xl">?</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{game.name}</h1>
                {game.description && <p className="text-muted-foreground mb-4">{game.description}</p>}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm text-muted-foreground">Spieleranzahl</div>
                    <div className="font-semibold">{game.minPlayers} - {game.maxPlayers}</div>
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
                      <div className="font-semibold">{"*".repeat(game.complexity)}{"_".repeat(5 - game.complexity)}</div>
                    </div>
                  )}
                  {game.bggId && (
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-sm text-muted-foreground">BGG ID</div>
                      <div className="font-semibold">{game.bggId}</div>
                    </div>
                  )}
                </div>
                {game.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((gt) => (
                      <span key={gt.tag.id} className="bg-muted px-2 py-1 rounded text-xs">
                        {gt.tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &ldquo;{game.name}&rdquo; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Wird gelöscht…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
