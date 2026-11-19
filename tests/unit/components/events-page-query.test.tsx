import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  cachedQuery: vi.fn((query: () => Promise<unknown>) => query()),
  getPendingInvites: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ default: { event: { findMany: mocks.findMany } } }));
vi.mock("@/lib/cache", () => ({ cachedQuery: mocks.cachedQuery }));
vi.mock("@/lib/cache-tags", () => ({ CacheTags: { userEvents: (id: string) => `user-events-${id}` } }));
vi.mock("@/lib/queries/pending-invites", () => ({ getPendingInvites: mocks.getPendingInvites }));
vi.mock("@/components/dashboard/events-overview", () => ({ EventsOverview: () => null }));

import EventsPage from "@/app/(dashboard)/dashboard/events/page";

describe("EventsPage query", () => {
  it("lädt nur Übersichtsfelder und höchstens drei Vorschläge pro eigenem Event", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1" } });
    mocks.findMany.mockResolvedValue([]);

    await EventsPage();

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { createdById: "owner-1", deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        eventDate: true,
        location: true,
        selectedGame: { select: { name: true } },
        winningProposal: { select: { bggName: true } },
        _count: { select: { proposals: true, invites: true } },
        proposals: {
          take: 3,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            bggName: true,
            bggImageUrl: true,
            game: { select: { name: true, imageUrl: true } },
            _count: { select: { votes: true, guestVotes: true } },
          },
        },
      },
      orderBy: { eventDate: "desc" },
      take: 20,
    });
    expect(mocks.getPendingInvites).toHaveBeenCalledWith("owner-1");
  });
});
