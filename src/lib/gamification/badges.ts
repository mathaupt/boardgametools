export interface PersonalAchievementStats {
  createdSessions: number;
  distinctGamesPlayed: number;
  ownedGamesPlayed: number;
  completedSeries: number;
}

export type BadgeIcon = "spark" | "table" | "calendar" | "compass" | "collection" | "series";

interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  unlockCondition: string;
  altText: string;
  target: number;
  icon: BadgeIcon;
  metric: keyof PersonalAchievementStats;
}

export interface BadgeProgress extends BadgeDefinition {
  progress: number;
  earned: boolean;
}

export const BADGES: readonly BadgeDefinition[] = [
  { id: "first-session", title: "Erste Spielrunde", description: "Du hast deine erste Spielsession festgehalten.", unlockCondition: "Dokumentiere 1 nicht gelöschte Session als Ersteller.", altText: "Abzeichen: Erste Spielrunde", target: 1, icon: "spark", metric: "createdSessions" },
  { id: "sessions-10", title: "Zehn gemeinsame Runden", description: "Zehn dokumentierte Sessions sind zusammengekommen.", unlockCondition: "Dokumentiere 10 nicht gelöschte Sessions als Ersteller.", altText: "Abzeichen: Zehn gemeinsame Runden", target: 10, icon: "table", metric: "createdSessions" },
  { id: "sessions-50", title: "Fünfzig Spielrunden", description: "Du hast fünfzig Spielsessions dokumentiert.", unlockCondition: "Dokumentiere 50 nicht gelöschte Sessions als Ersteller.", altText: "Abzeichen: Fünfzig Spielrunden", target: 50, icon: "calendar", metric: "createdSessions" },
  { id: "games-5", title: "Fünf Spiele entdeckt", description: "Du hast fünf verschiedene Spiele selbst mitgespielt.", unlockCondition: "Spiele 5 verschiedene Spiele in nicht gelöschten Sessions selbst mit.", altText: "Abzeichen: Fünf Spiele entdeckt", target: 5, icon: "compass", metric: "distinctGamesPlayed" },
  { id: "collection-game-first", title: "Sammlung auf dem Tisch", description: "Du hast zum ersten Mal ein eigenes Sammlungsspiel mitgespielt.", unlockCondition: "Spiele mindestens 1 Spiel aus deiner aktiven Sammlung selbst mit.", altText: "Abzeichen: Sammlung auf dem Tisch", target: 1, icon: "collection", metric: "ownedGamesPlayed" },
  { id: "series-complete", title: "Reihe abgeschlossen", description: "Du hast alle Spiele einer Spielreihe als gespielt markiert.", unlockCondition: "Markiere alle Spiele in mindestens 1 nicht gelöschten Spielreihe als gespielt.", altText: "Abzeichen: Reihe abgeschlossen", target: 1, icon: "series", metric: "completedSeries" },
];

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function evaluateBadgeProgress(stats: PersonalAchievementStats): BadgeProgress[] {
  return BADGES.map((badge) => {
    const progress = Math.min(nonNegativeInteger(stats[badge.metric]), badge.target);
    return { ...badge, progress, earned: progress >= badge.target };
  });
}
