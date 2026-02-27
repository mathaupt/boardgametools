import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicShareCard } from "./public-share-card";
import { getPublicBaseUrl } from "@/lib/public-link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Vote,
  Mail,
  Plus,
  Trophy,
  Share2,
  Download,
  ThumbsUp,
  ThumbsDown,
  Gamepad,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import VotingClient from "./voting-client";
import DatePollClient from "./date-poll-client";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: true,
      invites: {
        include: { user: true }
      },
      proposals: {
        include: {
          game: true,
          proposedBy: true,
          _count: { select: { votes: true, guestVotes: true } }
        }
      },
      selectedGame: true,
      guestParticipants: {
        include: {
          _count: { select: { votes: true } }
        },
        orderBy: { createdAt: "asc" }
      },
      dateProposals: {
        include: {
          votes: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          guestVotes: {
            include: { guest: { select: { id: true, nickname: true } } },
          },
        },
        orderBy: { date: "asc" },
      }
    }
  });

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event nicht gefunden</h1>
          <p className="text-gray-600 mb-4">Das gesuchte Event existiert nicht.</p>
          <Link href="/dashboard/events">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = event.createdById === userId;
  const eventDate = new Date(event.eventDate);
  const isPast = eventDate < new Date();
  const publicUrl = event.shareToken ? `${getPublicBaseUrl()}/public/event/${event.shareToken}` : null;
  const guestVoteCount = event.guestParticipants.reduce((sum, guest) => sum + (guest._count?.votes ?? 0), 0);

  // Get user votes for each proposal
  const userVotes = userId ? await prisma.vote.findMany({
    where: {
      userId,
      proposal: {
        eventId: id
      }
    },
    select: {
      proposalId: true
    }
  }) : [];

  const userVoteIds = new Set(userVotes.map(vote => vote.proposalId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück zu Events
          </Link>
        </div>
        <div className="flex gap-2">
          {isCreator && !isPast && (
            <>
              <Link href={`/dashboard/events/${event.id}/invite`}>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Einladungen
                </Button>
              </Link>
              <Link href={`/dashboard/events/${event.id}/share`}>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Teilen
                </Button>
              </Link>
              <Link href={`/dashboard/events/${event.id}/voting`}>
                <Button>
                  <Vote className="h-4 w-4 mr-2" />
                  Voting
                </Button>
              </Link>
            </>
          )}
          <Link href={`/api/events/${event.id}/calendar`} target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Kalender
            </Button>
          </Link>
        </div>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center" aria-label="Event Icon">
                  📅
                </div>
                {event.title}
              </CardTitle>
              <div className="flex items-center gap-4 mt-3 text-base text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {eventDate.toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {event.invites.length} Eingeladene
                </div>
                <Badge variant={isPast ? "secondary" : "default"}>
                  {isPast ? "Vergangen" : "Anstehend"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {event.description && (
          <CardContent>
            <h3 className="font-semibold mb-2">Beschreibung</h3>
            <p className="text-muted-foreground">{event.description}</p>
          </CardContent>
        )}

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Einladungen */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Einladungen ({event.invites.length})
              </h3>
              <div className="space-y-2">
                {event.invites.length === 0 ? (
                  <p className="text-gray-500 text-sm">Noch keine Einladungen</p>
                ) : (
                  event.invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                          {invite.user?.name?.[0] ?? "?"}
                        </div>
                        <span>{invite.user?.name ?? invite.email ?? "Unbekannt"}</span>
                      </div>
                      <Badge variant={
                        invite.status === "accepted" ? "default" :
                        invite.status === "declined" ? "destructive" : "secondary"
                      }>
                        {invite.status === "accepted" ? "Zugesagt" :
                         invite.status === "declined" ? "Abgelehnt" : "Ausstehend"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Event Status */}
            <div>
              <h3 className="font-semibold mb-3">Event Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Erstellt von:</span>
                  <span>{event.createdBy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Erstellt am:</span>
                  <span>{new Date(event.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
                {event.selectedGame && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Ausgewähltes Spiel:</span>
                    <div className="flex items-center gap-2">
                      {event.selectedGame.imageUrl ? (
                        <img 
                          src={event.selectedGame.imageUrl} 
                          alt={event.selectedGame.name}
                          className="w-8 h-8 rounded object-cover border border-border"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-game.png';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center">
                          <Gamepad className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{event.selectedGame.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public link + guest overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PublicShareCard
          eventId={event.id}
          initialIsPublic={event.isPublic}
          initialShareToken={event.shareToken}
          initialPublicUrl={publicUrl}
          canManage={isCreator}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Öffentliche Gäste ({event.guestParticipants.length})
            </CardTitle>
            <CardDescription>
              {guestVoteCount} Gast-Stimmen bisher gesammelt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.guestParticipants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Gäste über den öffentlichen Link registriert.
              </p>
            ) : (
              event.guestParticipants.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                      <UserCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{guest.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        Seit {new Date(guest.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {guest._count?.votes ?? 0} Votes
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Terminabstimmung */}
      <DatePollClient
        eventId={event.id}
        userId={userId || null}
        isCreator={isCreator}
        isPast={isPast}
        initialProposals={event.dateProposals.map((p: any) => ({
          ...p,
          date: p.date.toISOString(),
        }))}
        selectedDate={event.selectedDate?.toISOString() ?? null}
      />

      {/* Spielvorschläge mit Voting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Spielvorschläge ({event.proposals.length})
              </CardTitle>
              <CardDescription>
                Vorgeschlagene Spiele für dieses Event
              </CardDescription>
            </div>
            {isCreator && !isPast && (
              <Link href={`/dashboard/events/${event.id}/voting`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Spiel vorschlagen
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {event.proposals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="font-semibold mb-2">Noch keine Vorschläge</h3>
              <p className="text-gray-600 mb-4">
                Es wurden noch keine Spiele für dieses Event vorgeschlagen.
              </p>
              {isCreator && !isPast && (
                <Link href={`/dashboard/events/${event.id}/voting`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Vorschlag machen
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <VotingClient 
              proposals={event.proposals} 
              eventId={event.id} 
              userId={userId || null}
              userVoteIds={userVoteIds}
              isPast={isPast}
              selectedGameId={event.selectedGame?.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
