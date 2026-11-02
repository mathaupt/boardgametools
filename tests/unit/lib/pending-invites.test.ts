import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, cachedQuery } = vi.hoisted(() => ({
  findMany: vi.fn(),
  cachedQuery: vi.fn((query: () => Promise<unknown>) => query()),
}));

vi.mock("@/lib/db", () => ({ default: { eventInvite: { findMany } } }));
vi.mock("@/lib/cache", () => ({ cachedQuery }));

import { getPendingInvites } from "@/lib/queries/pending-invites";

describe("getPendingInvites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries only future, pending invitations for the given user", async () => {
    const invites = [{ id: "invite-1" }];
    findMany.mockResolvedValue(invites);

    await expect(getPendingInvites("user-7")).resolves.toBe(invites);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId: "user-7",
        status: "pending",
        event: { eventDate: { gte: expect.any(Date) }, deletedAt: null },
      },
      orderBy: { event: { eventDate: "asc" } },
    }));
    expect(cachedQuery).toHaveBeenCalledWith(expect.any(Function), ["pending-invites", "user-7"], {
      revalidate: 30,
      tags: ["pending-invites-user-7"],
    });
  });

  it("returns an empty result when there are no pending invitations", async () => {
    findMany.mockResolvedValue([]);
    await expect(getPendingInvites("user-empty")).resolves.toEqual([]);
  });
});
