"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Trophy, ArrowLeft, Pencil, Trash2, Star } from "lucide-react";

interface SessionPlayer {
  id: string;
  userId: string;
  score: number | null;
  isWinner: boolean;
  placement: number | null;
  user: { id: string; name: string | null; email: string | null };
}

interface SessionRating {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
}

interface SessionData {
  id: string;
  gameId: string;
  playedAt: string;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
  game: { id: string; name: string; imageUrl: string | null };
  createdBy: { id: string; name: string | null; email: string | null };
  players: SessionPlayer[];
  ratings: SessionRating[];
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (res.status === 404) {
          setError("Session nicht gefunden.");
          return;
        }
        if (!res.ok) {
          setError("Fehler beim Laden der Session.");
          return;
        }
        const data = await res.json();
        setSession(data);
      } catch {
        setError("Fehler beim Laden der Session.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Möchtest du diese Session wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Fehler beim Löschen");
      }
      router.push("/dashboard/sessions");
    } catch {
      alert("Fehler beim Löschen der Session.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/sessions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Sessions
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">{error || "Session nicht gefunden"}</h3>
            <Link href="/dashboard/sessions">
              <Button variant="outline">Zurück zur Übersicht</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedPlayers = [...session.players].sort(
    (a, b) => (a.placement || 999) - (b.placement || 999)
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/sessions" className="hover:underline">Sessions</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{session.game.name}</span>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{session.game.name}</h1>
          <p className="text-muted-foreground">
            Session vom {new Date(session.playedAt).toLocaleDateString("de-DE", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/sessions/${session.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Wird gelöscht..." : "Löschen"}
          </Button>
        </div>
      </div>

      {/* Game info & meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {session.game.imageUrl && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={session.game.imageUrl}
                    alt={session.game.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(session.playedAt).toLocaleDateString("de-DE")}</span>
                  </div>
                  {session.durationMinutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{session.durationMinutes} Minuten</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{session.players.length} Spieler</span>
                  </div>
                </div>
                {session.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Erstellt von:</span>{" "}
              <span className="font-medium">{session.createdBy.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Erstellt am:</span>{" "}
              <span>{new Date(session.createdAt).toLocaleDateString("de-DE")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Players table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Spieler & Ergebnisse
          </CardTitle>
          <CardDescription>{sortedPlayers.length} Spieler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Platz</th>
                  <th className="text-left py-2 pr-4 font-medium">Spieler</th>
                  <th className="text-right py-2 pr-4 font-medium">Punkte</th>
                  <th className="text-center py-2 font-medium">Gewinner</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr key={player.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {player.placement ? `#${player.placement}` : "-"}
                    </td>
                    <td className="py-2 pr-4 font-medium">
                      {player.user.name || player.user.email}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {player.score !== null ? player.score : "-"}
                    </td>
                    <td className="py-2 text-center">
                      {player.isWinner && (
                        <Trophy className="h-4 w-4 text-warning mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ratings */}
      {session.ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Bewertungen
            </CardTitle>
            <CardDescription>{session.ratings.length} Bewertung(en)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.ratings.map((rating) => (
              <div key={rating.id} className="flex flex-col gap-1 border-b last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {rating.user.name || rating.user.email}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rating.rating
                            ? "text-warning fill-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-sm text-muted-foreground">{rating.comment}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Back link */}
      <Link href="/dashboard/sessions">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Sessions
        </Button>
      </Link>
    </div>
  );
}
