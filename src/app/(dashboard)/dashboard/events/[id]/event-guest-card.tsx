import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCircle } from "lucide-react";

interface GuestParticipant {
  id: string;
  nickname: string;
  createdAt: Date;
  _count?: { votes: number } | null;
}

interface EventGuestCardProps {
  guestParticipants: GuestParticipant[];
  guestVoteCount: number;
}

export function EventGuestCard({ guestParticipants, guestVoteCount }: EventGuestCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Öffentliche Gäste ({guestParticipants.length})
        </CardTitle>
        <CardDescription>
          {guestVoteCount} Gast-Stimmen bisher gesammelt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {guestParticipants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Gäste über den öffentlichen Link registriert.
          </p>
        ) : (
          guestParticipants.map((guest) => (
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
  );
}
