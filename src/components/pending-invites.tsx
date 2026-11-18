"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Check, X, Mail } from "lucide-react";
import { formatShortDateTime } from "@/lib/date";
import { useToast } from "@/components/ui/use-toast";

export interface PendingInvite {
  id: string;
  eventId: string;
  status: string;
  event: {
    id: string;
    title: string;
    eventDate: string;
    location: string | null;
    createdBy: {
      name: string;
    };
  };
}

export function PendingInvites({ invites: initialInvites, compact = false, showEmpty = false, id }: { invites: PendingInvite[]; compact?: boolean; showEmpty?: boolean; id?: string }) {
  const [invites, setInvites] = useState(initialInvites);
  const [loadingEventIds, setLoadingEventIds] = useState<string[]>([]);
  const [failures, setFailures] = useState<Record<string, { status: "accepted" | "declined"; message: string }>>({});
  const { toast } = useToast();

  if (invites.length === 0) return showEmpty ? <section id={id} className="club-invites"><h2>Deine Einladungen</h2><p className="mt-4 text-muted-foreground">Aktuell keine offenen Einladungen.</p></section> : null;

  async function respond(eventId: string, status: "accepted" | "declined") {
    setLoadingEventIds((current) => current.includes(eventId) ? current : [...current, eventId]);
    setFailures((current) => { const next = { ...current }; delete next[eventId]; return next; });
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((inv) => inv.eventId !== eventId));
        toast({ title: "Einladung beantwortet", description: status === "accepted" ? "Du hast für den Spieleabend zugesagt." : "Du hast für den Spieleabend abgesagt." });
      } else {
        let message = "Deine Antwort konnte nicht gespeichert werden. Bitte versuche es erneut.";
        try {
          const body = await res.json();
          if (typeof body.error === "string" && body.error.trim()) message = body.error;
        } catch { /* Die allgemeine Meldung bleibt erhalten, wenn die Antwort kein JSON enthält. */ }
        setFailures((current) => ({ ...current, [eventId]: { status, message } }));
      }
    } catch {
      setFailures((current) => ({ ...current, [eventId]: { status, message: "Verbindung fehlgeschlagen. Prüfe deine Internetverbindung und versuche es erneut." } }));
    } finally {
      setLoadingEventIds((current) => current.filter((id) => id !== eventId));
    }
  }

  return (
    <section id={id} className="club-invites" aria-label="Offene Einladungen">
      <div>
        <h2 className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
          Offene Einladungen ({invites.length})
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Einladungen zu Spieleabenden, die auf deine Antwort warten</p>
      </div>
      <div>
        <ul className="club-invites-list">
          {invites.map((inv) => {
            const failure = failures[inv.eventId];
            return (
            <li
              key={inv.id}
              className={compact ? "space-y-4" : "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"}
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/events/${inv.event.id}`}
                  className="inline-block text-lg font-semibold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {inv.event.title}
                </Link>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {formatShortDateTime(inv.event.eventDate)}
                  </span>
                  {inv.event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {inv.event.location}
                    </span>
                  )}
                  <span>von {inv.event.createdBy.name}</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 shrink-0">
                {loadingEventIds.includes(inv.eventId) && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Antwort wird gespeichert …</p>}
                {failure && <div className="flex flex-wrap items-center gap-2" role="alert">
                  <span className="text-sm text-destructive">{failure.message}</span>
                  <Button size="sm" variant="outline" disabled={loadingEventIds.includes(inv.eventId)} onClick={() => respond(inv.eventId, failure.status)}>Erneut versuchen</Button>
                </div>}
                <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={loadingEventIds.includes(inv.eventId)}
                  onClick={() => respond(inv.eventId, "accepted")}
                >
                  <Check className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Zusagen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingEventIds.includes(inv.eventId)}
                  onClick={() => respond(inv.eventId, "declined")}
                >
                  <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Absagen
                </Button>
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
