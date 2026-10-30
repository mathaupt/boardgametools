"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Check, X, Mail } from "lucide-react";
import { formatShortDateTime } from "@/lib/date";

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

export function PendingInvites({ invites: initialInvites, compact = false, showEmpty = false }: { invites: PendingInvite[]; compact?: boolean; showEmpty?: boolean }) {
  const [invites, setInvites] = useState(initialInvites);
  const [loading, setLoading] = useState<string | null>(null);

  if (invites.length === 0) return showEmpty ? <section className="club-invites"><h2>Deine Einladungen</h2><p className="mt-4 text-muted-foreground">Aktuell keine offenen Einladungen.</p></section> : null;

  async function respond(eventId: string, status: "accepted" | "declined") {
    setLoading(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((inv) => inv.eventId !== eventId));
      }
    } catch (err) {
      console.error("Error responding to invite:", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="club-invites" aria-label="Offene Einladungen">
      <div>
        <h2 className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
          Offene Einladungen ({invites.length})
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Einladungen zu Spieleabenden, die auf deine Antwort warten</p>
      </div>
      <div>
        <ul className="club-invites-list">
          {invites.map((inv) => (
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
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  disabled={loading === inv.eventId}
                  onClick={() => respond(inv.eventId, "accepted")}
                >
                  <Check className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Zusagen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading === inv.eventId}
                  onClick={() => respond(inv.eventId, "declined")}
                >
                  <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Absagen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
