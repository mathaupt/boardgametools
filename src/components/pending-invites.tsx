"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Check, X, Mail } from "lucide-react";

interface PendingInvite {
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

export function PendingInvites({ invites: initialInvites }: { invites: PendingInvite[] }) {
  const [invites, setInvites] = useState(initialInvites);
  const [loading, setLoading] = useState<string | null>(null);

  if (invites.length === 0) return null;

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          Offene Einladungen ({invites.length})
        </CardTitle>
        <CardDescription>Einladungen zu Spieleabenden, die auf deine Antwort warten</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border bg-card px-4 py-3 gap-2"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/events/${inv.event.id}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {inv.event.title}
                </Link>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(inv.event.eventDate).toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {inv.event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {inv.event.location}
                    </span>
                  )}
                  <span>von {inv.event.createdBy.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <Button
                  size="sm"
                  variant="default"
                  disabled={loading === inv.eventId}
                  onClick={() => respond(inv.eventId, "accepted")}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Zusagen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading === inv.eventId}
                  onClick={() => respond(inv.eventId, "declined")}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Absagen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
