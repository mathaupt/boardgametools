"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { PublicActor } from "@/lib/events/public-actor";
import type { PublicGuest } from "@/lib/public-event";
import { PublicIdentityNotice } from "./public-identity-notice";

interface GuestRegistrationPanelProps {
  token: string;
  actor: PublicActor;
  onGuestJoined: (guest: PublicGuest) => void;
  canJoin?: boolean;
  blockedReason?: string | null;
  onStateConflict?: () => void | Promise<void>;
  sessionExpired?: boolean;
}

export function GuestRegistrationPanel({
  token,
  actor,
  onGuestJoined,
  canJoin = true,
  blockedReason = null,
  onStateConflict,
  sessionExpired = false,
}: GuestRegistrationPanelProps) {
  const { toast } = useToast();
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);

  const handleGuestJoin = async () => {
    if (actor.kind !== "observer" || !canJoin || nickname.trim().length < 2) return;
    setJoining(true);
    try {
      const response = await fetch(`/api/public/event/${encodeURIComponent(token)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        if (response.status === 409) await onStateConflict?.();
        if (response.status === 409) throw new Error("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
        throw new Error(data?.error ?? "Beitritt fehlgeschlagen");
      }
      const participant = await response.json() as PublicGuest;
      if (!participant.id || !participant.nickname || !participant.createdAt || !Number.isFinite(participant.votesCount)) {
        throw new Error("Die Teilnahmedaten konnten nicht gelesen werden. Bitte lade die Seite neu.");
      }
      onGuestJoined(participant);
      setNickname("");
      toast({ title: "Willkommen!", description: "Du nimmst jetzt an der Veranstaltung teil." });
    } catch (error) {
      console.error("Guest join error", error);
      toast({
        title: "Beitritt fehlgeschlagen",
        description: error instanceof Error ? error.message : "Versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <section id="event-participation" aria-labelledby="event-participation-title" className="min-w-0 scroll-mt-6">
      <Card className="border-primary/25 bg-card">
        <CardHeader className="pb-3">
          <CardTitle id="event-participation-title" className="text-lg" as="h2">Deine Teilnahme</CardTitle>
          <CardDescription>Deine aktuelle Identität und der passende Teilnahmeweg.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PublicIdentityNotice actor={actor} sessionExpired={sessionExpired} />
          {actor.kind === "observer" && canJoin && (
            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0 space-y-2">
                <label htmlFor="guest-nickname" className="text-sm font-medium text-foreground">Als Gast mit Spitznamen teilnehmen</label>
                <Input
                  id="guest-nickname"
                  data-testid="guest-nickname-input"
                  maxLength={80}
                  placeholder="Dein Spitzname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  disabled={joining}
                  className="min-h-11 min-w-0 bg-background"
                />
              </div>
              <Button
                data-testid="guest-join-button"
                onClick={handleGuestJoin}
                disabled={joining || nickname.trim().length < 2}
                className="h-auto min-h-11 whitespace-normal leading-tight"
              >
                {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />}
                {joining ? "Beitritt läuft …" : "Als Gast teilnehmen"}
              </Button>
            </div>
          )}
          {actor.kind === "observer" && !canJoin && !sessionExpired && (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground" role="status">
              {blockedReason ?? "Eine Registrierung ist für dieses Event nicht mehr möglich."}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
