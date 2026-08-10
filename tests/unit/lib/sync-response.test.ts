import { describe, it, expect, vi, beforeEach } from "vitest";

const gameFindMany = vi.hoisted(() => vi.fn());
const gameSessionFindMany = vi.hoisted(() => vi.fn());
const eventFindMany = vi.hoisted(() => vi.fn());
const groupFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  default: {
    groupMember: { findMany: vi.fn().mockResolvedValue([]) },
    group: { findMany: groupFindMany },
    eventInvite: { findMany: vi.fn().mockResolvedValue([]) },
    event: { findMany: eventFindMany },
    game: { findMany: gameFindMany },
    gameSession: { findMany: gameSessionFindMany },
    dateProposal: { findMany: vi.fn().mockResolvedValue([]) },
    gameProposal: { findMany: vi.fn().mockResolvedValue([]) },
    vote: { findMany: vi.fn().mockResolvedValue([]) },
    dateVote: { findMany: vi.fn().mockResolvedValue([]) },
    groupPoll: { findMany: vi.fn().mockResolvedValue([]) },
    groupComment: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { buildSyncPayload } from "@/lib/sync-response";

const activeGame = {
  id: "g-active",
  name: "Catan",
  description: null,
  minPlayers: 2,
  maxPlayers: 4,
  playTimeMinutes: 60,
  complexity: 2,
  bggId: null,
  ean: null,
  imageUrl: null,
  ownerId: "u1",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  deletedAt: null,
  tags: [],
};

const deletedGame = { id: "g-deleted" };

describe("buildSyncPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameFindMany.mockReset().mockResolvedValueOnce([activeGame]).mockResolvedValueOnce([deletedGame]);
    gameSessionFindMany.mockReset().mockResolvedValue([]);
    eventFindMany.mockReset().mockResolvedValue([]);
    groupFindMany.mockReset().mockResolvedValue([]);
  });

  it("includes active items and their deleted IDs", async () => {
    const payload = await buildSyncPayload("u1");

    expect(payload.games.created).toHaveLength(1);
    expect(payload.games.created[0].id).toBe("g-active");
    expect(payload.games.deleted).toEqual(["g-deleted"]);

    expect(gameFindMany).toHaveBeenCalledTimes(2);
    expect(gameFindMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { ownerId: "u1", deletedAt: null },
      })
    );
    expect(gameFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { ownerId: "u1", deletedAt: { not: null } },
        select: { id: true },
      })
    );
  });
});
