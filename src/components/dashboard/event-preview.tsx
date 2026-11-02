import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Dice6, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatShortMonth, formatTime } from "@/lib/date";

interface DashboardProposalPreview {
  id: string;
  name: string;
  minutes: number | null;
  imageUrl: string | null;
  totalVotes: number;
}

export interface EveningPreview {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
  selectedGameName: string | null;
  votingClosed: boolean;
  proposals: DashboardProposalPreview[];
}

export function EventDate({ date, compact = false }: { date: string; compact?: boolean }) {
  return <time dateTime={date} className={cn("club-date", compact && "is-compact")} aria-label={formatDate(date)}>
    <strong aria-hidden="true">{new Date(date).getDate().toString().padStart(2, "0")}</strong>
    <span aria-hidden="true">{formatShortMonth(date)}</span>
  </time>;
}

export function EventPreview({ event, featured = false }: { event: EveningPreview; featured?: boolean }) {
  const selected = event.selectedGameName;
  const state = selected ? "Spiel steht fest" : event.votingClosed ? "Abstimmung beendet" : "Spielauswahl offen";
  if (!featured) return <article className="club-event-row">
    <EventDate date={event.eventDate} compact />
    <div className="min-w-0 flex-1"><h3><Link className="hover:underline" href={`/dashboard/events/${event.id}`}>{event.title}</Link></h3>
      <p className="mt-1 text-sm text-muted-foreground">{formatTime(event.eventDate)} Uhr{event.location ? ` · ${event.location}` : ""}</p>
      <p className="mt-1 text-sm">{selected || state}</p>
    </div><ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
  </article>;
  return <article className="club-event-feature">
    <div className="club-event-top"><EventDate date={event.eventDate} /><div className="min-w-0">
      <h3><Link className="hover:underline" href={`/dashboard/events/${event.id}`}>{event.title}</Link></h3>
      <p className="club-event-meta"><span>{formatTime(event.eventDate)} Uhr</span>{event.location && <span className="inline-flex items-center gap-1"><MapPin className="size-4 shrink-0" aria-hidden="true" />{event.location}</span>}</p>
      <span className="club-state">{state}</span>{selected && <p className="mt-3 font-semibold">{selected}</p>}
    </div></div>
    {!selected && event.proposals.length > 0 && <div className="club-event-proposals"><h4 className="font-semibold">Was kommt auf den Tisch?</h4>
      <p className="club-proposal-caption">Top 3 nach Stimmen</p>
      <ol aria-label="Top 3 nach Stimmen">{event.proposals.map((proposal, index) => <li key={proposal.id}>
        <span className="club-proposal-rank" aria-hidden="true">{index + 1}</span>
        <div className="club-proposal-thumbnail" aria-hidden="true">
          {proposal.imageUrl ? <Image src={proposal.imageUrl} alt="" fill sizes="44px" className="object-cover" /> : <Dice6 className="size-5 text-muted-foreground" />}
        </div>
        <div className="club-proposal-copy">
          <span className="font-medium">{proposal.name}</span>
          <p className="text-sm text-muted-foreground">{proposal.totalVotes} {proposal.totalVotes === 1 ? "Stimme" : "Stimmen"}{proposal.minutes != null ? ` · ${proposal.minutes} Min.` : ""}</p>
        </div>
      </li>)}</ol>
    </div>}
    <div className="club-event-footer"><span className="text-sm text-muted-foreground">{formatDate(event.eventDate)}</span><Link className="club-text-link" href={`/dashboard/events/${event.id}`}>Spieleabend ansehen <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
  </article>;
}
