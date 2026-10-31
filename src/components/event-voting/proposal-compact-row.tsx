"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Gamepad2, Trophy } from "lucide-react";
import { ProposalGameDetails } from "@/components/event-voting/proposal-game-details";

interface ProposalCompactRowProps {
  eventId?: string;
  token?: string;
  proposalId: string;
  name: string;
  imageUrl?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  playTimeMinutes?: number | null;
  proposedBy?: string | null;
  totalVotes: number;
  rank?: number;
  voteSummary?: string;
  selected?: boolean;
  children: ReactNode;
}

export function ProposalCompactRow({
  eventId,
  token,
  proposalId,
  name,
  imageUrl,
  minPlayers,
  maxPlayers,
  playTimeMinutes,
  proposedBy,
  totalVotes,
  rank,
  voteSummary,
  selected = false,
  children,
}: ProposalCompactRowProps) {
  return (
    <li data-testid={`proposal-${proposalId}`} className="flex min-w-0 flex-col gap-2 border-b border-border px-3 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
      <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-3 max-[240px]:grid-cols-[2rem_minmax(0,1fr)] max-[240px]:items-start">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-secondary-foreground sm:h-12 sm:w-12" aria-hidden="true">
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6" />}
        </div>
        <div className="min-w-0">
          {selected && <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-warning"><Trophy className="h-3 w-3" aria-hidden="true" />Ausgewählt</span>}
          <ProposalGameDetails
            eventId={eventId}
            token={token}
            proposalId={proposalId}
            name={name}
            titleClassName="break-words text-base font-semibold leading-snug"
            headingLevel={3}
          />
          <p className="flex flex-wrap items-center gap-x-1 text-xs leading-4 text-muted-foreground">
            {minPlayers != null && maxPlayers != null && <span>{minPlayers}–{maxPlayers} Spieler</span>}
            {minPlayers != null && maxPlayers != null && playTimeMinutes != null && <span aria-hidden="true">·</span>}
            {playTimeMinutes != null && <span>{playTimeMinutes} Min.</span>}
          </p>
          {proposedBy && <p className="text-xs leading-4 text-muted-foreground">Vorgeschlagen von {proposedBy}</p>}
        </div>
        <div className="min-w-0 text-right sm:min-w-[5rem] max-[240px]:col-start-2 max-[240px]:flex max-[240px]:flex-wrap max-[240px]:items-baseline max-[240px]:gap-x-1 max-[240px]:text-left">
          <strong className="block text-lg tabular-nums leading-5 max-[240px]:inline" data-testid={`vote-count-${proposalId}`}>{totalVotes}</strong>
          <span className="block text-xs leading-4 text-muted-foreground max-[240px]:inline">Stimmen{rank != null ? ` · Rang ${rank}` : ""}</span>
          {voteSummary && <span className="block break-words text-[0.6875rem] leading-4 text-muted-foreground max-[240px]:inline">{voteSummary}</span>}
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 pl-10 sm:shrink-0 sm:pl-0 max-[240px]:flex-col max-[240px]:items-stretch max-[240px]:pl-0 [&>button]:min-h-11 max-[240px]:[&>button]:w-full">
        {children}
      </div>
    </li>
  );
}
