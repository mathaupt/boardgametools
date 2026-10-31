import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin, Users, Vote, Trophy, Dice6 } from "lucide-react";
import { formatDate } from "@/lib/date";
import Image from "next/image";
import Link from "next/link";
import { EventDate } from "@/components/dashboard/event-preview";
import { PendingInvites, type PendingInvite } from "@/components/pending-invites";
import { gameTextForRead } from "@/lib/game-text";

export interface EventListItem {
  id: string; title: string; description: string | null; eventDate: Date | string; location: string | null;
  selectedGame: { name: string } | null;
  winningProposal: { bggName: string | null } | null;
  _count: { invites: number; proposals: number };
  proposals: { id: string; bggName: string | null; bggImageUrl: string | null; game: { name: string; imageUrl: string | null } | null; _count: { votes: number } }[];
}

export function EventsOverview({ events, invites }: { events: EventListItem[]; invites: PendingInvite[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-bold">Events & Voting</h1>
          <p className="text-muted-foreground">Deine Spieleabende. Gemeinsam planen, gemeinsam auswählen.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Event erstellen
          </Link>
        </Button>
      </div>

      {/* Offene Einladungen */}
      <PendingInvites invites={invites} />

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="size-10 mb-4 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold mb-2">Noch keine Events</h2>
            <p className="text-muted-foreground mb-4 text-center">
              Du hast noch keine Spiele-Events erstellt.
              Erstelle dein erstes Event mit Voting-System!
            </p>
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Erstes Event erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="border-0 shadow-none overflow-hidden">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                  <div className="flex gap-5 min-w-0">
                    <EventDate date={new Date(event.eventDate).toISOString()} />
                    <div className="min-w-0">
                    <CardTitle as="h2" className="text-xl leading-snug break-words">
                      <Link href={`/dashboard/events/${event.id}`} className="hover:underline">{event.title}</Link>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        {formatDate(event.eventDate)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {event._count.invites} Eingeladene
                      </div>
                      <div className="flex items-center gap-1">
                        <Vote className="h-4 w-4" aria-hidden="true" />
                        {event._count.proposals} Vorschläge
                      </div>
                    </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/events/${event.id}`}>
                        Details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/events/${event.id}/voting`}>
                        Voting
                      </Link>
                    </Button>
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
                    <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
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
                        const gameName = gameTextForRead(proposal.game?.name ?? proposal.bggName ?? "Unbekannt");
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
                              <Dice6 className="size-4" aria-hidden="true" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm truncate max-w-[160px]">{gameName}</div>
                            <div className="text-xs text-muted-foreground">
                              {proposal._count.votes} Stimmen
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
