import { describe, expect, it } from "vitest";
import { aggregateChallengeProgress } from "@/lib/gamification/challenge-progress";

describe("aggregateChallengeProgress", () => {
  const members = [
    { userId: "a", joinedAt: new Date("2026-01-01"), leftAt: null },
    { userId: "b", joinedAt: new Date("2026-01-01"), leftAt: null },
  ];
  const sessions = [
    { id: "same", gameId: "g1", createdById: "a", createdAt: new Date("2026-02-01"), playerIds: ["b"] },
    { id: "old", gameId: "g2", createdById: "a", createdAt: new Date("2025-12-31"), playerIds: [] },
  ];

  it("counts one session only once when multiple opted-in members participated", () => {
    expect(aggregateChallengeProgress(sessions, members, new Date("2026-01-01"), null, "sessions")).toBe(1);
  });

  it("counts distinct games rather than sessions for game challenges", () => {
    const extra = { id: "second", gameId: "g1", createdById: "b", createdAt: new Date("2026-02-02"), playerIds: ["a"] };
    expect(aggregateChallengeProgress([...sessions, extra], members, new Date("2026-01-01"), null, "games")).toBe(1);
  });

  it("honors challenge and opt-out intervals", () => {
    const left = [{ userId: "a", joinedAt: new Date("2026-01-01"), leftAt: new Date("2026-01-31") }];
    expect(aggregateChallengeProgress(sessions, left, new Date("2026-01-01"), new Date("2026-03-01"), "sessions")).toBe(0);
  });
});
