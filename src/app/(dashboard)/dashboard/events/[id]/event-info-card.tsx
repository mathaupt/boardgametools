import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Gamepad } from "lucide-react";
import Image from "next/image";

interface Invite {
  id: string;
  status: string;
  email?: string | null;
  user?: { id: string; name: string | null; email: string | null } | null;
}

interface EventInfoCardProps {
  event: {
    title: string;
    description: string | null;
    eventDate: Date;
    location: string | null;
    createdAt: Date;
    createdBy: { name: string | null };
    invites: Invite[];
    selectedGame?: { id: string; name: string; imageUrl: string | null } | null;
    winningProposal?: { bggName: string | null; bggImageUrl: string | null } | null;
  };
  isPast: boolean;
}

export function EventInfoCard({ event, isPast }: EventInfoCardProps) {
  const eventDate = new Date(event.eventDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-foreground">
              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center" aria-label="Event Icon">
                📅
              </div>
              {event.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm sm:text-base text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {eventDate.toLocaleDateString("de-DE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
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
                <p className="text-muted-foreground text-sm">Noch keine Einladungen</p>
              ) : (
                event.invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs">
                        {invite.user?.name?.[0] ?? "?"}
                      </div>
                      <span>{invite.user?.name ?? invite.email ?? "Unbekannt"}</span>
                    </div>
                    <Badge
                      variant={
                        invite.status === "accepted"
                          ? "default"
                          : invite.status === "declined"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {invite.status === "accepted"
                        ? "Zugesagt"
                        : invite.status === "declined"
                          ? "Abgelehnt"
                          : "Ausstehend"}
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
                <span>{new Date(event.createdAt).toLocaleDateString("de-DE")}</span>
              </div>
              {(event.selectedGame || event.winningProposal) && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Ausgewähltes Spiel:</span>
                  <div className="flex items-center gap-2">
                    {(event.selectedGame?.imageUrl || event.winningProposal?.bggImageUrl) ? (
                      <Image
                        src={(event.selectedGame?.imageUrl || event.winningProposal?.bggImageUrl)!}
                        alt={event.selectedGame?.name || event.winningProposal?.bggName || "Spiel"}
                        width={32}
                        height={32}
                        className="rounded object-cover border border-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center">
                        <Gamepad className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium">
                      {event.selectedGame?.name || event.winningProposal?.bggName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
