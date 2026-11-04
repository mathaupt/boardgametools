import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (client: unknown) => unknown) => callback(db)),
  groupMember: { findUnique: vi.fn() },
  group: { findFirst: vi.fn() },
  groupChallenge: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  groupChallengeParticipant: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  gameSession: { findMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ default: db }));
vi.mock("@/lib/require-auth", () => ({ ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } } }));

import { GroupChallengeService } from "@/lib/services/group-challenge.service";

describe("GroupChallengeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.groupMember.findUnique.mockResolvedValue({ role: "member" });
    db.group.findFirst.mockResolvedValue({ id: "group-1" });
  });

  it("requires current membership before exposing group aggregates", async () => {
    db.groupMember.findUnique.mockResolvedValue(null);
    await expect(GroupChallengeService.list("group-1", "outsider")).rejects.toMatchObject({ statusCode: 404 });
    expect(db.groupChallenge.findMany).not.toHaveBeenCalled();
  });

  it("returns aggregate progress without participant IDs or contributions", async () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const joined = new Date("2026-01-01T00:00:00Z");
    db.groupChallenge.findMany.mockResolvedValue([{ id: "challenge-1", title: "Runden", kind: "sessions", target: 10, startsAt: start, endsAt: null, participants: [{ userId: "private-user", joinedAt: joined, leftAt: null }] }]);
    db.gameSession.findMany.mockResolvedValue([{ id: "session-1", gameId: "game-1", createdById: "private-user", createdAt: new Date("2026-02-01T00:00:00Z"), players: [] }]);
    const result = await GroupChallengeService.list("group-1", "private-user");
    expect(result).toEqual([{ id: "challenge-1", title: "Runden", kind: "sessions", target: 10, startsAt: start.toISOString(), endsAt: null, current: 1, completed: false, joined: true }]);
    expect(JSON.stringify(result)).not.toContain("private-user");
  });

  it("allows challenge creation only for group owners and admins", async () => {
    await expect(GroupChallengeService.create("group-1", "member-1", { title: "Spielzeit", kind: "sessions", target: 10 })).rejects.toMatchObject({ statusCode: 403 });
    expect(db.groupChallenge.create).not.toHaveBeenCalled();
  });
});
