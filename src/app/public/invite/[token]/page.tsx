"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Gamepad2, Check, X, Loader2 } from "lucide-react";

interface InviteData {
  id: string;
  status: string;
  email: string | null;
  respondedAt: string | null;
  event: {
    title: string;
    description: string | null;
    eventDate: string;
    location: string | null;
    status: string;
    organizer: string;
    inviteCount: number;
    proposals: Array<{
      gameName: string;
      imageUrl: string | null;
      minPlayers: number;
      maxPlayers: number;
      totalVotes: number;
    }>;
  };
}

export default function PublicInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(`/api/public/invite/${token}/respond`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Einladung nicht gefunden");
          return;
        }
        const data = await res.json();
        setInvite(data);
      } catch {
        setError("Fehler beim Laden der Einladung");
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  async function handleRespond(status: "accepted" | "declined") {
    setResponding(true);
    try {
      const res = await fetch(`/api/public/invite/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler beim Antworten");
        return;
      }
      setResponseMessage(data.message);
      setInvite((prev) => prev ? { ...prev, status } : prev);
    } catch {
      setError("Fehler beim Antworten");
    } finally {
      setResponding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="py-12 text-center">
            <X className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Einladung nicht gefunden</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  const eventDate = new Date(invite.event.eventDate);
  const isPast = eventDate < new Date();
  const alreadyResponded = invite.status !== "pending";

  return (
    <div className="min-h-screen bg-background bg-gradient-to-b from-background via-muted to-background py-12 text-foreground">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-4 w-4" /> Einladung zum Spieleabend
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            {invite.event.title}
          </h1>
          {invite.event.description && (
            <p className="mt-3 text-base text-muted-foreground">{invite.event.description}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Eingeladen von <strong className="text-foreground">{invite.event.organizer}</strong>
          </p>
        </div>

        {/* Event Details */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Calendar className="h-5 w-5" /> Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {eventDate.toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" um "}
                {eventDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {invite.event.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{invite.event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{invite.event.inviteCount} eingeladene Personen</span>
            </div>
            <div className="pt-2">
              <Badge variant={isPast ? "secondary" : "default"}>
                {isPast ? "Vergangen" : "Bevorstehend"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Spielvorschläge */}
        {invite.event.proposals.length > 0 && (
          <Card className="mt-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Gamepad2 className="h-5 w-5" /> Spielvorschläge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invite.event.proposals.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.gameName} className="h-10 w-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{p.gameName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.minPlayers}–{p.maxPlayers} Spieler
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{p.totalVotes} Stimmen</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Antwort-Bereich */}
        <Card className="mt-6 border-border bg-card">
          <CardContent className="py-8">
            {responseMessage ? (
              <div className="text-center">
                <Check className="mx-auto mb-3 h-12 w-12 text-success" />
                <h3 className="text-lg font-semibold text-foreground">{responseMessage}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Der Organisator wurde benachrichtigt.
                </p>
              </div>
            ) : alreadyResponded ? (
              <div className="text-center">
                <Badge variant={invite.status === "accepted" ? "default" : "secondary"} className="mb-3 text-base px-4 py-2">
                  {invite.status === "accepted" ? "Zugesagt" : "Abgesagt"}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Du hast bereits auf diese Einladung geantwortet.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Nimmst du teil?
                </h3>
                {error && (
                  <p className="mb-4 text-sm text-destructive">{error}</p>
                )}
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => handleRespond("accepted")}
                    disabled={responding}
                    className="min-w-[140px]"
                  >
                    {responding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Zusagen
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleRespond("declined")}
                    disabled={responding}
                    className="min-w-[140px]"
                  >
                    {responding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Absagen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          BoardGameTools &mdash; Spieleabende einfach organisieren
        </p>
      </div>
    </div>
  );
}
