import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { findPublicEventByToken } from "@/lib/event-share";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Users, UserCircle, Check, X, Clock } from "lucide-react";
import { PublicEventClient } from "@/components/public-event/public-event-client";
import { PublicEventHeader } from "@/components/public-event/public-event-header";

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
  return (
    <div className="min-h-screen bg-background bg-gradient-to-b from-background via-muted to-background py-12 text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 max-[320px]:px-2 sm:px-6 lg:px-8">
        <PublicEventHeader event={serialized} />

        <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <Card className="min-w-0 border-border bg-card text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground" as="h2">
                <Users className="h-5 w-5" aria-hidden="true" />
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
                    className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        <UserCircle className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-medium text-foreground">{invite.name}</span>
                    </div>
                    <Badge
                      variant={
                        invite.status === "accepted"
                          ? "default"
                          : invite.status === "declined"
                          ? "destructive"
                          : "secondary"
                      }
                      className="flex shrink-0 items-center gap-1 text-xs"
                    >
                      {invite.status === "accepted" ? (
                        <><Check className="h-3 w-3" aria-hidden="true" /> Dabei</>
                      ) : invite.status === "declined" ? (
                        <><X className="h-3 w-3" aria-hidden="true" /> Abgesagt</>
                      ) : (
                        <><Clock className="h-3 w-3" aria-hidden="true" /> Ausstehend</>
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
                      className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                          <UserCircle className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span className="min-w-0 break-words text-sm font-medium text-foreground">{guest.nickname}</span>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {guest.votesCount} Votes
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0 border-border bg-card text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground" as="h2">
                <Share2 className="h-5 w-5" aria-hidden="true" />
                Öffentliche Teilnahme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Teile diese Seite mit Freunden. Sie nehmen ohne Login teil, wählen einen
                Spitznamen und stimmen über Spielvorschläge ab.
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
