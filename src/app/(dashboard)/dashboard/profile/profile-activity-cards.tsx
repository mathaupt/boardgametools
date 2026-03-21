"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CalendarDays, Vote, Users, ArrowRight, Check } from "lucide-react";

interface Invite {
  id: string;
  status: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string | null;
}

interface EventItem {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
  isCreator: boolean;
  proposalCount: number;
  inviteCount: number;
}

interface GroupItem {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  pollCount: number;
  joinedAt: string;
}

interface ProfileActivityCardsProps {
  invites: Invite[];
  events: EventItem[];
  groups: GroupItem[];
}

export function ProfileActivityCards({ invites, events, groups }: ProfileActivityCardsProps) {
  const pendingInvites = invites.filter((i) => i.status === "pending");
  const upcomingEvents = events.filter((e) => new Date(e.eventDate) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.eventDate) < new Date());

  const statusLabel: Record<string, string> = {
    pending: "Offen",
    accepted: "Angenommen",
    declined: "Abgelehnt",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning-foreground",
    accepted: "bg-success/10 text-success",
    declined: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6 lg:col-span-2">
      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-warning" />
              Offene Einladungen
              <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning-foreground">
                {pendingInvites.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {pendingInvites.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/dashboard/events/${inv.eventId}`}
                    className="flex items-center gap-3 py-2.5 rounded-md transition-colors hover:bg-muted/50"
                  >
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{inv.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inv.eventDate).toLocaleDateString("de-DE", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                        {inv.eventLocation && ` · ${inv.eventLocation}`}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Vote className="h-4 w-4 text-primary" />
            Meine Events
          </CardTitle>
          <CardDescription>
            {upcomingEvents.length} kommende, {pastEvents.length} vergangene
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Events.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.slice(0, 8).map((evt) => {
                const isPast = new Date(evt.eventDate) < new Date();
                return (
                  <li key={evt.id}>
                    <Link
                      href={`/dashboard/events/${evt.id}`}
                      className="flex items-center gap-3 py-2.5 rounded-md transition-colors hover:bg-muted/50"
                    >
                      <span className={`shrink-0 text-center w-9 ${isPast ? "opacity-50" : ""}`}>
                        <span className="block text-base font-bold leading-tight">
                          {new Date(evt.eventDate).getDate()}
                        </span>
                        <span className="block text-[9px] uppercase text-muted-foreground font-medium">
                          {new Date(evt.eventDate).toLocaleDateString("de-DE", { month: "short" })}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isPast ? "text-muted-foreground" : ""}`}>
                          {evt.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {evt.isCreator ? "Organisator" : "Eingeladen"}
                          {evt.location && ` · ${evt.location}`}
                          {" · "}
                          {evt.proposalCount} Vorschläge, {evt.inviteCount} Teilnehmer
                        </p>
                      </div>
                      {evt.isCreator && (
                        <span title="Du bist Organisator">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        </span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {events.length > 8 && (
            <Link href="/dashboard/events" className="block mt-3 text-xs text-primary font-medium hover:underline">
              Alle Events anzeigen
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Invites history */}
      {invites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Einladungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {invites.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/dashboard/events/${inv.eventId}`}
                    className="flex items-center gap-3 py-2 rounded-md transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{inv.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inv.eventDate).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${statusColor[inv.status] || ""}`}>
                      {statusLabel[inv.status] || inv.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Groups */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-info" />
            Meine Gruppen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keiner Gruppe beigetreten.</p>
          ) : (
            <ul className="divide-y divide-border">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/dashboard/groups/${g.id}`}
                    className="flex items-center gap-3 py-2.5 rounded-md transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 shrink-0">
                      <Users className="h-4 w-4 text-info" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.role === "owner" ? "Ersteller" : "Mitglied"}
                        {" · "}
                        {g.memberCount} Mitglieder, {g.pollCount} Umfragen
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
