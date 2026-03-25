import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { getPendingInvites } from "@/lib/queries/pending-invites";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Users, Vote, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GameTooltip } from "@/components/ui/game-tooltip";
import { PendingInvites } from "@/components/pending-invites";

export default async function EventsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const events = await cachedQuery(
    () => prisma.event.findMany({
      where: { createdById: userId },
      include: {
        invites: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        proposals: {
          include: {
            game: true,
            _count: { 
              select: { 
                votes: true 
              } 
            },
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        selectedGame: true,
        winningProposal: true,
        _count: { select: { proposals: true, invites: true } }
      },
      orderBy: { eventDate: "desc" },
      take: 20
    }),
    ["user-events-list", userId!],
    { revalidate: 60, tags: [CacheTags.userEvents(userId!)] }
  );

  // Offene Einladungen laden
  const pendingInvites = await getPendingInvites(userId!);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Events & Voting</h1>
          <p className="text-muted-foreground">Plane Spieleabende mit Abstimmung</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Event erstellen
          </Button>
        </Link>
      </div>

      {/* Offene Einladungen */}
      <PendingInvites
        invites={pendingInvites.map((inv) => ({
          id: inv.id,
          eventId: inv.eventId,
          status: inv.status,
          event: {
            id: inv.event.id,
            title: inv.event.title,
            eventDate: inv.event.eventDate.toISOString(),
            location: inv.event.location,
            createdBy: inv.event.createdBy,
          },
        }))}
      />

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Events</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Du hast noch keine Spiele-Events erstellt. 
              Erstelle dein erstes Event mit Voting-System!
            </p>
            <Link href="/dashboard/events/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Event erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        📅
                      </div>
                      {event.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.eventDate).toLocaleDateString('de-DE')}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event._count.invites} Eingeladene
                      </div>
                      <div className="flex items-center gap-1">
                        <Vote className="h-4 w-4" />
                        {event._count.proposals} Vorschläge
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                    <Link href={`/dashboard/events/${event.id}/voting`}>
                      <Button variant="outline" size="sm">
                        Voting
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              
              {event.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
              )}

              {(event.selectedGame || event.winningProposal) && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-warning" aria-label="Trophy Icon" />
                    <span className="font-medium text-foreground">Ausgewähltes Spiel:</span>
                    <span className="text-muted-foreground">{event.selectedGame?.name || event.winningProposal?.bggName}</span>
                  </div>
                </CardContent>
              )}

              {event.proposals.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-foreground">Spielvorschläge</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.proposals.slice(0, 3).map((proposal) => {
                        const gameName = proposal.game?.name ?? proposal.bggName ?? "Unbekannt";
                        const gameImage = proposal.game?.imageUrl ?? proposal.bggImageUrl ?? null;
                        return (
                        <div key={proposal.id} className="flex items-center gap-2 bg-card px-2 py-1 rounded text-sm border border-border">
                          {gameImage ? (
                            <div className="relative w-6 h-6 flex-shrink-0">
                              <Image
                                src={gameImage}
                                alt={gameName}
                                width={24}
                                height={24}
                                className="object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                              🎲
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-xs truncate max-w-[100px]">{gameName}</div>
                            <div className="text-xs text-muted-foreground">
                              {proposal._count.votes} Votes
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      {event.proposals.length > 3 && (
                        <span className="text-muted-foreground text-sm">
                          +{event.proposals.length - 3} weitere
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
