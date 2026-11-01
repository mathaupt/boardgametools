import { Check, Clock, UserCircle, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import type { PublicGuest, SerializedPublicEvent } from "@/lib/public-event";

type PublicInvite = SerializedPublicEvent["invites"][number];

export function ParticipantsSection({ invites, guests, activeGuestId }: {
  invites: PublicInvite[];
  guests: PublicGuest[];
  activeGuestId: string | null;
}) {
  const count = invites.length + guests.length;
  return (
    <section id="event-participants" aria-labelledby="event-participants-title" className="scroll-mt-6">
      <Card className="min-w-0 border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle id="event-participants-title" className="flex items-center gap-2 text-lg" as="h2">
            <Users className="h-5 w-5" aria-hidden="true" />
            Teilnehmende ({count})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {count === 0 ? <p className="text-sm text-muted-foreground">Noch keine Teilnehmenden.</p> : (
            <ul className="space-y-2">
              {invites.map((invite, index) => (
                <li key={`${invite.name}-${index}`} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-medium">{invite.name}</span>
                  <Badge variant={invite.status === "accepted" ? "default" : invite.status === "declined" ? "destructive" : "secondary"} className="shrink-0">
                    {invite.status === "accepted" ? <><Check className="mr-1 h-3 w-3" aria-hidden="true" />Dabei</> : invite.status === "declined" ? <><X className="mr-1 h-3 w-3" aria-hidden="true" />Abgesagt</> : <><Clock className="mr-1 h-3 w-3" aria-hidden="true" />Ausstehend</>}
                  </Badge>
                </li>
              ))}
              {guests.map((guest) => (
                <li key={guest.id} className={`flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${activeGuestId === guest.id ? "border-success bg-success/10" : "border-border/60 bg-muted/20"}`}>
                  <span className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere] text-sm font-medium">
                    <UserCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {guest.nickname}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(guest.createdAt)} · {guest.votesCount} Stimmen</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
