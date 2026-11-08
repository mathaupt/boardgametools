"use client";

import Link from "@/components/speech/speech-page-link";
import { useMemo, useState } from "react";
import { Award, CalendarDays, Compass, Gamepad2, LibraryBig, Sparkles, Table2, X } from "lucide-react";
import type { BadgeProgress } from "@/lib/gamification/badges";
import type { CollectionDiscovery } from "@/lib/gamification/discovery";

interface Overview {
  stats: { createdSessions: number; distinctGamesPlayed: number; ownedGamesPlayed: number; completedSeries: number };
  badges: BadgeProgress[];
  discovery: CollectionDiscovery;
}

interface AchievementDashboardProps {
  overview: Overview;
}

const badgeIcons = {
  spark: Sparkles,
  table: Table2,
  calendar: CalendarDays,
  compass: Compass,
  collection: Gamepad2,
  series: LibraryBig,
} as const;

function BadgeArtwork({ badge, earned }: { badge: BadgeProgress; earned: boolean }) {
  const Icon = badgeIcons[badge.icon];
  return (
    <span
      role="img"
      aria-label={badge.altText}
      className={`relative grid size-16 shrink-0 place-items-center rounded-full border-2 ${earned ? "border-primary text-primary" : "border-muted-foreground/40 text-muted-foreground"}`}
    >
      <span className={`absolute inset-1 rounded-full border ${earned ? "border-primary/35 bg-primary/10" : "border-muted-foreground/20 bg-muted/70"}`} />
      <Icon className="relative size-7" strokeWidth={1.8} aria-hidden="true" />
      {earned && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-background p-0.5 text-primary"><Award className="size-4" aria-hidden="true" /></span>}
    </span>
  );
}

function ProgressBadge({ badge }: { badge: BadgeProgress }) {
  const units = {
    createdSessions: { singular: "Session", plural: "Sessions" },
    distinctGamesPlayed: { singular: "Spiel", plural: "verschiedenen Spielen" },
    ownedGamesPlayed: { singular: "eigenem Spiel", plural: "eigenen Spielen" },
    completedSeries: { singular: "Spielreihe", plural: "Spielereihen" },
  }[badge.metric];
  const progress = Math.min(badge.progress, badge.target);
  const percent = badge.target > 0 ? (progress / badge.target) * 100 : 0;
  return (
    <li className="flex min-w-0 items-center gap-4 border-b border-border py-4 last:border-0">
      <BadgeArtwork badge={badge} earned={false} />
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <h3 className="font-semibold leading-snug">{badge.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
        <BadgeCondition badge={badge} />
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Fortschritt: ${badge.title}`}
            aria-valuemin={0}
            aria-valuemax={badge.target}
            aria-valuenow={progress}
          >
            <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <span className="min-w-0 flex-1 break-words text-xs tabular-nums text-muted-foreground">
            {progress} von {badge.target} {badge.target === 1 ? units.singular : units.plural}
          </span>
        </div>
      </div>
    </li>
  );
}

function BadgeCondition({ badge }: { badge: BadgeProgress }) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground [overflow-wrap:anywhere]">Freischaltbedingung: </span>
      {badge.unlockCondition}
    </p>
  );
}

function DiscoverySection({ title, games, onDismiss, pendingIds }: {
  title: string;
  games: CollectionDiscovery["neverPlayed"];
  onDismiss: (gameId: string) => void;
  pendingIds: Set<string>;
}) {
  if (games.length === 0) return null;
  return (
    <section aria-labelledby={`discovery-${title}`}>
      <h3 id={`discovery-${title}`} className="text-lg font-semibold">{title}</h3>
      <ul className="mt-2 divide-y divide-border">
        {games.map((game) => (
          <li key={game.id} className="flex min-w-0 items-center gap-3 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground" aria-hidden="true">
              <Gamepad2 className="size-5" />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{game.name}</span>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              aria-label={`Aus Entdeckerbereich entfernen: ${game.name}`}
              disabled={pendingIds.has(game.id)}
              onClick={() => onDismiss(game.id)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AchievementDashboard({ overview }: AchievementDashboardProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const discovery = useMemo(() => ({
    neverPlayed: overview.discovery.neverPlayed.filter((game) => !dismissedIds.includes(game.id)),
    longUnplayed: overview.discovery.longUnplayed.filter((game) => !dismissedIds.includes(game.id)),
  }), [overview.discovery, dismissedIds]);
  const earned = overview.badges.filter((badge) => badge.earned);
  const nextBadges = overview.badges.filter((badge) => !badge.earned);

  async function dismissGame(gameId: string) {
    setError(null);
    setPendingIds((current) => new Set(current).add(gameId));
    try {
      const response = await fetch("/api/achievements/discovery-dismissals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      if (!response.ok) throw new Error("Spiel konnte nicht ausgeblendet werden.");
      setDismissedIds((current) => [...current, gameId]);
    } catch {
      setError("Das Spiel konnte nicht ausgeblendet werden. Bitte versuche es erneut.");
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(gameId);
        return next;
      });
    }
  }

  return (
    <main className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Meine Erfolge</h1>
        <p className="text-muted-foreground">Halte Spielrunden fest, entdecke deine Sammlung und sammle Abzeichen in deinem eigenen Tempo.</p>
        <dl className="flex flex-wrap gap-x-7 gap-y-2 border-b border-border pb-5 pt-2 text-sm">
          <div><dt className="inline text-muted-foreground">Dokumentierte Sessions </dt><dd className="inline font-semibold tabular-nums">{overview.stats.createdSessions}</dd></div>
          <div><dt className="inline text-muted-foreground">Mitgespielte Spiele </dt><dd className="inline font-semibold tabular-nums">{overview.stats.distinctGamesPlayed}</dd></div>
          <div><dt className="inline text-muted-foreground">Abgeschlossene Reihen </dt><dd className="inline font-semibold tabular-nums">{overview.stats.completedSeries}</dd></div>
        </dl>
      </header>

      {overview.stats.createdSessions === 0 && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-5">
          <p className="max-w-xl text-sm">Halte deine erste Spielrunde fest, dann beginnt deine Abzeichenreise.</p>
          <Link href="/dashboard/sessions/new" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Erste Session erfassen
          </Link>
        </section>
      )}

      <section aria-labelledby="achievement-badges" className="space-y-5">
        <div>
          <h2 id="achievement-badges" className="text-2xl font-semibold tracking-tight">Abzeichen</h2>
          <p className="mt-1 text-sm text-muted-foreground">Deine Fortschritte beruhen auf deinen dokumentierten Spielrunden.</p>
        </div>
        <section aria-labelledby="earned-badges" className="space-y-2">
          <h3 id="earned-badges" className="text-lg font-semibold">Freigeschaltet</h3>
          {earned.length > 0 ? (
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {earned.map((badge) => (
                <li key={badge.id} className="flex min-w-0 items-start gap-4 border-b border-border py-4">
                  <BadgeArtwork badge={badge} earned />
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <h4 className="font-semibold leading-snug">{badge.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
                    <BadgeCondition badge={badge} />
                    <p className="mt-2 text-sm font-semibold text-primary">Freigeschaltet</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Noch kein Abzeichen freigeschaltet. Jede eigene Spielrunde zählt.</p>
          )}
        </section>

        <section aria-labelledby="upcoming-badges" className="max-w-3xl space-y-2 border-t border-border pt-5">
          <h3 id="upcoming-badges" className="text-lg font-semibold">Noch nicht freigeschaltet</h3>
          {nextBadges.length > 0 ? (
            <ul className="divide-y divide-border">
              {nextBadges.map((badge) => <ProgressBadge key={badge.id} badge={badge} />)}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Du hast alle verfügbaren Abzeichen freigeschaltet.</p>
          )}
        </section>
      </section>

      <section aria-labelledby="collection-discovery" className="max-w-3xl space-y-5 border-t border-border pt-7">
        <div>
          <h2 id="collection-discovery" className="text-2xl font-semibold tracking-tight">Spiele neu entdecken</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ein persönlicher Blick auf Spiele aus deiner Sammlung, die du selbst noch nicht oder länger nicht mitgespielt hast.</p>
        </div>
        <DiscoverySection title="Noch nicht mitgespielt" games={discovery.neverPlayed} onDismiss={dismissGame} pendingIds={pendingIds} />
        <DiscoverySection title="Seit mindestens einem Jahr nicht gespielt" games={discovery.longUnplayed} onDismiss={dismissGame} pendingIds={pendingIds} />
        {discovery.neverPlayed.length === 0 && discovery.longUnplayed.length === 0 && (
          <p className="text-sm text-muted-foreground">Für deine Sammlung gibt es gerade keine Entdeckungen.</p>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </section>

      <p className="text-sm text-muted-foreground"><Link href="/dashboard/profile" className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Profil und öffentliche Abzeichen verwalten</Link></p>
    </main>
  );
}
