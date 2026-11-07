import { describe, expect, it } from "vitest";
import { evaluateBadgeProgress, type PersonalAchievementStats } from "@/lib/gamification/badges";

const stats = (overrides: Partial<PersonalAchievementStats> = {}): PersonalAchievementStats => ({
  createdSessions: 0,
  distinctGamesPlayed: 0,
  ownedGamesPlayed: 0,
  completedSeries: 0,
  ...overrides,
});

describe("evaluateBadgeProgress", () => {
  it("keeps badge thresholds locked immediately below each milestone", () => {
    const result = evaluateBadgeProgress(stats({ createdSessions: 9, distinctGamesPlayed: 4 }));

    expect(result.find((badge) => badge.id === "first-session")).toMatchObject({ earned: true, progress: 1, target: 1 });
    expect(result.find((badge) => badge.id === "sessions-10")).toMatchObject({ earned: false, progress: 9, target: 10 });
    expect(result.find((badge) => badge.id === "sessions-50")).toMatchObject({ earned: false, progress: 9, target: 50 });
    expect(result.find((badge) => badge.id === "games-5")).toMatchObject({ earned: false, progress: 4, target: 5 });
  });

  it("unlocks milestones at the exact threshold and caps progress at its target", () => {
    const result = evaluateBadgeProgress(stats({ createdSessions: 87, distinctGamesPlayed: 5 }));

    expect(result.find((badge) => badge.id === "sessions-10")).toMatchObject({ earned: true, progress: 10, target: 10 });
    expect(result.find((badge) => badge.id === "sessions-50")).toMatchObject({ earned: true, progress: 50, target: 50 });
    expect(result.find((badge) => badge.id === "games-5")).toMatchObject({ earned: true, progress: 5, target: 5 });
  });

  it("treats negative and non-finite progress as zero", () => {
    const result = evaluateBadgeProgress(stats({ createdSessions: -3, distinctGamesPlayed: Number.NaN, ownedGamesPlayed: Number.POSITIVE_INFINITY }));

    expect(result.find((badge) => badge.id === "first-session")).toMatchObject({ progress: 0, earned: false });
    expect(result.find((badge) => badge.id === "games-5")).toMatchObject({ progress: 0, earned: false });
    expect(result.find((badge) => badge.id === "collection-game-first")).toMatchObject({ progress: 0, earned: false });
  });

  it("only unlocks collection and series badges when those personal conditions hold", () => {
    expect(evaluateBadgeProgress(stats()).find((badge) => badge.id === "collection-game-first"))
      .toMatchObject({ earned: false, progress: 0, target: 1 });
    expect(evaluateBadgeProgress(stats({ ownedGamesPlayed: 1 })).find((badge) => badge.id === "collection-game-first"))
      .toMatchObject({ earned: true, progress: 1, target: 1 });
    expect(evaluateBadgeProgress(stats({ completedSeries: 1 })).find((badge) => badge.id === "series-complete"))
      .toMatchObject({ earned: true, progress: 1, target: 1 });
  });

  it("returns a stable catalogue with explanatory accessible labels", () => {
    const result = evaluateBadgeProgress(stats());
    expect(result.map((badge) => badge.id)).toEqual([
      "first-session", "sessions-10", "sessions-50", "games-5", "collection-game-first", "series-complete",
    ]);
    expect(result.every((badge) => badge.title && badge.description && badge.altText && badge.icon)).toBe(true);
  });

  it("provides a concrete German unlock condition for every badge", () => {
    const result = evaluateBadgeProgress(stats());

    expect(result.map(({ id, unlockCondition }) => [id, unlockCondition])).toEqual([
      ["first-session", "Dokumentiere 1 nicht gelöschte Session als Ersteller."],
      ["sessions-10", "Dokumentiere 10 nicht gelöschte Sessions als Ersteller."],
      ["sessions-50", "Dokumentiere 50 nicht gelöschte Sessions als Ersteller."],
      ["games-5", "Spiele 5 verschiedene Spiele in nicht gelöschten Sessions selbst mit."],
      ["collection-game-first", "Spiele mindestens 1 Spiel aus deiner aktiven Sammlung selbst mit."],
      ["series-complete", "Markiere alle Spiele in mindestens 1 nicht gelöschten Spielreihe als gespielt."],
    ]);
  });
});
