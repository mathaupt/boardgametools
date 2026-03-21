"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Users, UserPlus, Loader2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guest, StoredGuestState } from "./types";

interface GuestRegistrationPanelProps {
  token: string;
  activeGuest: StoredGuestState | null;
  initialGuestList: Guest[];
  onGuestJoined: (guest: StoredGuestState) => void;
  persistGuest: (guest: StoredGuestState, votes: Set<string>) => void;
}

export function GuestRegistrationPanel({
  token,
  activeGuest,
  initialGuestList,
  onGuestJoined,
  persistGuest,
}: GuestRegistrationPanelProps) {
  const { toast } = useToast();
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [guestList, setGuestList] = useState<Guest[]>(initialGuestList);

  const handleGuestJoin = async () => {
    if (!nickname.trim()) {
      toast({ title: "Nickname fehlt", description: "Bitte einen Spitznamen eingeben.", variant: "destructive" });
      return;
    }
    setJoining(true);
    try {
      const response = await fetch(`/api/public/event/${token}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Beitritt fehlgeschlagen");
      }
      const participant: Guest = await response.json();
      setGuestList((prev) => {
        const exists = prev.some((guest) => guest.id === participant.id);
        if (exists) {
          return prev.map((guest) => (guest.id === participant.id ? participant : guest));
        }
        return [...prev, participant].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
      const stored: StoredGuestState = { id: participant.id, nickname: participant.nickname };
      onGuestJoined(stored);
      persistGuest(stored, new Set());
      setNickname("");
      toast({ title: "Willkommen!", description: "Du bist jetzt für das Event registriert." });
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
    <section className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            Als Gast teilnehmen
          </CardTitle>
          <CardDescription>
            Nickname eingeben, um abstimmen zu können
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeGuest ? (
            <div className="rounded-lg border border-success bg-success/10 p-4 text-sm">
              <p className="font-semibold text-success">Willkommen zurück, {activeGuest.nickname}!</p>
              <p className="text-muted-foreground">
                Du kannst jetzt als Gast abstimmen. Deine Stimme wird unter deinem Nickname gezählt.
              </p>
            </div>
          ) : (
            <>
              <label htmlFor="guest-nickname" className="text-sm font-medium text-muted-foreground">
                Spitzname
              </label>
              <Input
                id="guest-nickname"
                data-testid="guest-nickname-input"
                placeholder="z.B. W0rkerPlacementPro"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                disabled={joining}
                className="bg-background/80"
              />
              <Button
                data-testid="guest-join-button"
                onClick={handleGuestJoin}
                disabled={joining || nickname.trim().length < 2}
                className="w-full"
              >
                {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {joining ? "Beitritt läuft..." : "Als Gast registrieren"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Gästeliste ({guestList.length})
          </CardTitle>
          <CardDescription>
            Alle öffentlichen Teilnehmer:innen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {guestList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Gäste registriert.</p>
          ) : (
            guestList.map((guest) => (
              <div
                key={guest.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2",
                  activeGuest?.id === guest.id && "border-success bg-success/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-muted p-2 text-muted-foreground">
                    <UserCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{guest.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      Beigetreten am {new Date(guest.createdAt).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {guest.votesCount} Votes
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
