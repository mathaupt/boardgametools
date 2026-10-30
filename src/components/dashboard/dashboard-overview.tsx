import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingInvites, type PendingInvite } from "@/components/pending-invites";
import { EventPreview, type EveningPreview } from "./event-preview";
import { formatDate } from "@/lib/date";

interface DashboardOverviewProps {
  name: string | null;
  counts: { games: number; sessions: number; groups: number; events: number };
  events: EveningPreview[];
  recentSessions: { id: string; gameName: string; playedAt: string }[];
  invites: PendingInvite[];
}
const shortcuts = [
  ["Spiel hinzufügen", "/dashboard/games/new"],
  ["Von BGG importieren", "/dashboard/bgg"],
  ["Session erfassen", "/dashboard/sessions/new"],
  ["Gruppe erstellen", "/dashboard/groups/new"],
];

export function DashboardOverview({ name, counts, events, recentSessions, invites }: DashboardOverviewProps) {
  return <div>
    <div className="club-topline"><span className="font-semibold">Deine Spielrunde</span><Link href="/dashboard/profile" className="text-sm text-muted-foreground hover:text-primary">{name ? `Willkommen zurück, ${name}` : "Mein Profil"}</Link></div>
    <div className="club-heading"><div><h1>Der nächste Spieleabend wartet.</h1><p>Deine Termine, Einladungen und zuletzt gespielten Partien.</p></div>
      <Button asChild><Link href="/dashboard/events/new"><Plus aria-hidden="true" />Event planen</Link></Button>
    </div>
    <div className="club-workspace">
      <section className="club-upcoming min-w-0" aria-labelledby="upcoming-heading">
        <div className="club-section-title"><h2 id="upcoming-heading">Kommende Spieleabende</h2></div>
        {events.length ? events.map((event, index) => <EventPreview key={event.id} event={event} featured={index === 0} />) : <div className="club-empty"><h3>Platz für eure nächste Runde.</h3><p>Plane einen Spieleabend und entscheide gemeinsam mit deiner Runde, was auf den Tisch kommt.</p><Link className="club-text-link mt-3" href="/dashboard/events/new">Ersten Spieleabend planen <ArrowRight className="size-4" aria-hidden="true" /></Link></div>}
        {events.length > 0 && <Link className="club-text-link mt-2" href="/dashboard/events">Alle Events ansehen <ArrowRight className="size-4" aria-hidden="true" /></Link>}
      </section>
      <div className="club-history-region min-w-0"><section className="club-history" aria-labelledby="history-heading"><div className="club-section-title"><h2 id="history-heading">Zuletzt gespielt</h2><Link className="club-text-link text-sm" href="/dashboard/sessions">Alle Sessions</Link></div>
        {recentSessions.length ? <ul>{recentSessions.map((item) => <li key={item.id}><Link className="font-semibold hover:underline" href={`/dashboard/sessions/${item.id}`}>{item.gameName}</Link><time className="shrink-0 text-sm text-muted-foreground" dateTime={item.playedAt}>{formatDate(item.playedAt)}</time></li>)}</ul> : <div className="club-empty"><p>Noch keine Partien erfasst.</p><Link className="club-text-link mt-2" href="/dashboard/sessions/new">Erste Partie erfassen <ArrowRight className="size-4" aria-hidden="true" /></Link></div>}
      </section>
      <div className="club-summary" aria-label="Deine Sammlung im Überblick"><Link className="club-text-link" href="/dashboard/games">{counts.games} Spiele</Link><Link className="club-text-link" href="/dashboard/sessions">{counts.sessions} Sessions</Link><Link className="club-text-link" href="/dashboard/groups">{counts.groups} Gruppen</Link><Link className="club-text-link" href="/dashboard/events">{counts.events} Events</Link></div>
      </div>
      <aside className="club-actions min-w-0" aria-label="Einladungen und Schnellzugriffe">
        <PendingInvites invites={invites} compact showEmpty />
        <section className="club-shortcuts"><h2>Für deine Runde</h2>{shortcuts.map(([label, href]) => <Link key={href} href={href}>{label}<ArrowRight className="size-4" aria-hidden="true" /></Link>)}</section>
      </aside>
    </div>
  </div>;
}
