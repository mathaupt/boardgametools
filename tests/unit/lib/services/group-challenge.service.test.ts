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

  it("hides groups after membership has been removed", async () => {
    db.group.findFirst.mockResolvedValue(null);
    await expect(GroupChallengeService.list("group-1", "member-1")).rejects.toMatchObject({ statusCode: 404 });
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

  it("returns an empty challenge list without querying sessions when there are no participants", async () => {
    db.groupChallenge.findMany.mockResolvedValue([]);
    await expect(GroupChallengeService.list("group-1", "member-1")).resolves.toEqual([]);
    expect(db.gameSession.findMany).not.toHaveBeenCalled();
  });

  it("caps game progress at the target and includes participants only during their active interval", async () => {
    const startsAt = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date("2026-06-01T00:00:00Z");
    db.groupChallenge.findMany.mockResolvedValue([{
      id: "challenge-1", title: "Spiele", kind: "games", target: 5, startsAt, endsAt,
      participants: [
        { userId: "active", joinedAt: new Date("2026-02-01T00:00:00Z"), leftAt: new Date("2026-05-01T00:00:00Z") },
        { userId: "current", joinedAt: startsAt, leftAt: null },
      ],
    }]);
    db.gameSession.findMany.mockResolvedValue(Array.from({ length: 8 }, (_, index) => ({
      id: `session-${index}`, gameId: `game-${index}`, gameNameSnapshot: null,
      createdById: "active", createdAt: new Date("2026-03-01T00:00:00Z"), players: [],
    })));

    const [challenge] = await GroupChallengeService.list("group-1", "current");

    expect(challenge).toMatchObject({ current: 5, completed: true, joined: true, endsAt: endsAt.toISOString() });
    expect(db.gameSession.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }));
  });

  it("allows challenge creation only for group owners and admins", async () => {
    await expect(GroupChallengeService.create("group-1", "member-1", { title: "Spielzeit", kind: "sessions", target: 10 })).rejects.toMatchObject({ statusCode: 403 });
    expect(db.groupChallenge.create).not.toHaveBeenCalled();
  });

  it("rejects invalid titles, targets, kinds, and past end dates before opening a transaction", async () => {
    const base = { title: "Runden", kind: "sessions" as const, target: 10 };
    await expect(GroupChallengeService.create("group-1", "owner", { ...base, title: "   " })).rejects.toMatchObject({ statusCode: 400 });
    await expect(GroupChallengeService.create("group-1", "owner", { ...base, title: "x".repeat(81) })).rejects.toMatchObject({ statusCode: 400 });
    await expect(GroupChallengeService.create("group-1", "owner", { ...base, target: 5 })).rejects.toMatchObject({ statusCode: 400 });
    await expect(GroupChallengeService.create("group-1", "owner", { title: "Runden", kind: "unknown" as never, target: 10 })).rejects.toMatchObject({ statusCode: 400 });
    await expect(GroupChallengeService.create("group-1", "owner", { ...base, endsAt: new Date("2020-01-01T00:00:00Z") })).rejects.toMatchObject({ statusCode: 400 });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("trims valid titles and permits owners and admins to create fixed-target challenges", async () => {
    db.groupMember.findUnique.mockResolvedValue({ role: "admin" });
    db.groupChallenge.create.mockResolvedValue({ id: "created" });

    await expect(GroupChallengeService.create("group-1", "admin-1", { title: "  Zehn Runden  ", kind: "sessions", target: 10, endsAt: null }))
      .resolves.toEqual({ id: "created" });

    expect(db.groupChallenge.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: "Zehn Runden", createdById: "admin-1", endsAt: null }) }));
  });

  it("rejects joining missing or previously left challenges and treats active joins as idempotent", async () => {
    db.groupChallenge.findFirst.mockResolvedValue(null);
    await expect(GroupChallengeService.join("group-1", "missing", "member-1")).rejects.toMatchObject({ statusCode: 404 });

    db.groupChallenge.findFirst.mockResolvedValue({ id: "challenge-1" });
    db.groupChallengeParticipant.findUnique.mockResolvedValue({ leftAt: new Date() });
    await expect(GroupChallengeService.join("group-1", "challenge-1", "member-1")).rejects.toMatchObject({ statusCode: 409 });

    db.groupChallengeParticipant.findUnique.mockResolvedValue({ leftAt: null });
    await expect(GroupChallengeService.join("group-1", "challenge-1", "member-1")).resolves.toEqual({ joined: true });
    expect(db.groupChallengeParticipant.create).not.toHaveBeenCalled();
  });

  it("adds a new participant and permits leaving only an active participation", async () => {
    db.groupChallenge.findFirst.mockResolvedValue({ id: "challenge-1" });
    db.groupChallengeParticipant.findUnique.mockResolvedValue(null);
    db.groupChallengeParticipant.findFirst.mockResolvedValue({ id: "participant-1" });

    await expect(GroupChallengeService.join("group-1", "challenge-1", "member-1")).resolves.toEqual({ joined: true });
    await expect(GroupChallengeService.leave("group-1", "challenge-1", "member-1")).resolves.toEqual({ joined: false });
    expect(db.groupChallengeParticipant.create).toHaveBeenCalledWith({ data: { challengeId: "challenge-1", userId: "member-1" } });
    expect(db.groupChallengeParticipant.update).toHaveBeenCalledWith({ where: { id: "participant-1" }, data: { leftAt: expect.any(Date) } });
  });
});
