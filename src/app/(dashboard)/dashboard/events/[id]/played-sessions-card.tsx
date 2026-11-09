"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import { PlayedSessionForm, type EventParticipantOption, type PlayedProposalOption } from "./played-session-form";

interface PlayedSession {
  id: string;
  playedAt: string;
  durationMinutes: number | null;
  notes: string | null;
  players: { score: number | null; placement: number | null; isWinner: boolean; user: { name: string | null } }[];
  guestPlayers: { name: string; score: number | null; placement: number | null; isWinner: boolean }[];
}

interface PlayedProposal extends PlayedProposalOption {
  imageUrl: string | null;
  playedSessions: { id: string; session: PlayedSession }[];
}

interface PlayedSessionsCardProps {
  eventId: string;
  eventDate: string;
  proposals: PlayedProposal[];
  otherSessions: { id: string; gameName: string; session: PlayedSession }[];
  participants: EventParticipantOption[];
  isCreator: boolean;
}

function ResultSummary({ name, score, placement, isWinner }: { name: string; score: number | null; placement: number | null; isWinner: boolean }) {
  return <li className="flex flex-wrap items-center gap-x-2 text-sm">
    <span className="font-medium">{name}</span>
    {placement != null && <span className="text-muted-foreground">Platz {placement}</span>}
    {score != null && <span className="text-muted-foreground">{score} Punkte</span>}
    {isWinner && <span className="inline-flex items-center gap-1 text-warning-foreground"><Trophy className="h-3.5 w-3.5" aria-hidden="true" />Gewinner</span>}
  </li>;
}

export function PlayedSessionsCard({ eventId, eventDate, proposals, otherSessions, participants, isCreator }: PlayedSessionsCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const sessionCount = proposals.reduce((total, proposal) => total + proposal.playedSessions.length, 0) + otherSessions.length;

  return (
    <Card aria-labelledby="played-sessions-title">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle id="played-sessions-title" as="h2">Gespielte Partien</CardTitle>
          <CardDescription>{sessionCount === 0 ? "Halte fest, welche Vorschläge tatsächlich auf dem Tisch lagen." : `${sessionCount} ${sessionCount === 1 ? "Partie" : "Partien"} erfasst`}</CardDescription>
        </div>
        {isCreator && !formOpen && (
          <Button type="button" className="min-h-11" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Partie erfassen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {proposals.length === 0 && otherSessions.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Für dieses Event gibt es noch keine Spielvorschläge.</p>
        ) : sessionCount === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Noch keine Partie als gespielt erfasst.</p>
        ) : (
          <ul className="space-y-3">
            {proposals.map((proposal) => proposal.playedSessions.length > 0 && (
              <li key={proposal.id} className="border-t border-border py-4 first:border-0 first:pt-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{proposal.gameName}</h3>
                  <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-foreground">Gespielt</span>
                  {proposal.playedSessions.length > 1 && <span className="text-xs text-muted-foreground">{proposal.playedSessions.length} Partien</span>}
                </div>
                <ul className="space-y-3">
                  {proposal.playedSessions.map(({ id, session }) => (
                    <li key={id} className="border-t border-border/70 pt-3 first:border-0 first:pt-0">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" />{formatDate(session.playedAt)}</span>
                        {session.durationMinutes != null && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" aria-hidden="true" />{session.durationMinutes} Min.</span>}
                        {isCreator && <Link className="min-h-11 inline-flex items-center font-medium text-primary underline-offset-4 hover:underline" href={`/dashboard/sessions/${session.id}`}>Sessiondetails und Bearbeitung</Link>}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {session.players.map((player, index) => <ResultSummary key={`user-${index}`} name={player.user.name ?? "Teilnehmer"} score={player.score} placement={player.placement} isWinner={player.isWinner} />)}
                        {session.guestPlayers.map((player, index) => <ResultSummary key={`guest-${index}`} name={`${player.name} (Gast)`} score={player.score} placement={player.placement} isWinner={player.isWinner} />)}
                      </ul>
                      {session.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{session.notes}</p>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {otherSessions.length > 0 && <section aria-labelledby="other-played-games" className="border-t border-border pt-4">
          <h3 id="other-played-games" className="mb-3 font-semibold">Weitere gespielte Spiele</h3>
          <ul className="space-y-3">{otherSessions.map(({ id, gameName, session }) => <li key={id} className="border-t border-border/70 pt-3 first:border-0 first:pt-0">
            <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-semibold">{gameName}</span><span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-foreground">Gespielt</span></div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" />{formatDate(session.playedAt)}</span>{session.durationMinutes != null && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" aria-hidden="true" />{session.durationMinutes} Min.</span>}{isCreator && <Link className="min-h-11 inline-flex items-center font-medium text-primary underline-offset-4 hover:underline" href={`/dashboard/sessions/${session.id}`}>Sessiondetails und Bearbeitung</Link>}</div>
            {session.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{session.notes}</p>}
          </li>)}</ul>
        </section>}
        {isCreator && formOpen && (
          <PlayedSessionForm
            eventId={eventId}
            proposals={proposals}
            participants={participants}
            defaultPlayedAt={eventDate}
            onCancel={() => setFormOpen(false)}
            onCreated={() => setFormOpen(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
