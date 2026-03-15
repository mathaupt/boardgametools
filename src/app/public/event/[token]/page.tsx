import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { findPublicEventByToken } from "@/lib/event-share";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Share2, Vote, Users, UserCircle, Check, X, Clock } from "lucide-react";
import { PublicEventClient } from "@/components/public-event/public-event-client";

export const revalidate = 0;

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await auth();
  const { token } = await params;

  const event = await findPublicEventByToken(
    token,
    buildPublicEventInclude(session?.user?.id)
  );

  if (!event || !event.isPublic) {
    notFound();
  }

  const serialized = serializePublicEvent(event, session?.user?.id ?? null);
  const eventDate = new Date(serialized.eventDate);
  const isPast = eventDate < new Date();

  return (
    <div className="min-h-screen bg-background bg-gradient-to-b from-background via-muted to-background py-12 text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Share2 className="h-4 w-4" /> Öffentliches Voting
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {serialized.title}
              </h1>
              {serialized.description && (
                <p className="mt-3 text-base text-muted-foreground">{serialized.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-3 py-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {eventDate.toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {serialized.status !== "planning" && (
                    <span className="block text-xs text-muted-foreground">
                      {eventDate.toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </span>
              </div>
              {serialized.location && (
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-3 py-2">
                  <MapPin className="h-4 w-4" />
                  <span>{serialized.location}</span>
                </div>
              )}
              <Badge variant={isPast ? "secondary" : "default"} className="rounded-2xl px-3 py-2 text-xs">
                {isPast ? "Beendet" : "Aktiv"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border-border bg-card text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Users className="h-5 w-5" />
                Teilnehmer ({serialized.invites.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {serialized.invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Einladungen.</p>
              ) : (
                serialized.invites.map((invite, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        <UserCircle className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{invite.name}</span>
                    </div>
                    <Badge
                      variant={
                        invite.status === "accepted"
                          ? "default"
                          : invite.status === "declined"
                          ? "destructive"
                          : "secondary"
                      }
                      className="flex items-center gap-1 text-xs"
                    >
                      {invite.status === "accepted" ? (
                        <><Check className="h-3 w-3" /> Dabei</>
                      ) : invite.status === "declined" ? (
                        <><X className="h-3 w-3" /> Abgesagt</>
                      ) : (
                        <><Clock className="h-3 w-3" /> Ausstehend</>
                      )}
                    </Badge>
                  </div>
                ))
              )}
              {serialized.guestParticipants.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Gäste ({serialized.guestParticipants.length})
                  </p>
                  {serialized.guestParticipants.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                          <UserCircle className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{guest.nickname}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {guest.votesCount} Votes
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Share2 className="h-5 w-5" />
                Öffentliche Teilnahme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Teile diese Seite mit Freunden. Sie können ohne Login als Gast teilnehmen,
                einen Spitznamen festlegen und direkt für Spielvorschläge abstimmen.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <PublicEventClient token={token} event={serialized} />
        </div>
      </div>
    </div>
  );
}
