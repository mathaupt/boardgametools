import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventFindFirst: vi.fn(),
  proposalFindFirst: vi.fn(),
  playedFindUnique: vi.fn(),
  playedCreate: vi.fn(),
  createFromEvent: vi.fn(),
  invalidateSessionCaches: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const tx = {
    event: { findFirst: mocks.eventFindFirst },
    gameProposal: { findFirst: mocks.proposalFindFirst },
    eventPlayedSession: { findUnique: mocks.playedFindUnique, create: mocks.playedCreate },
  };
  return { default: { ...tx, $transaction: mocks.transaction } };
});
vi.mock("@/lib/cache", () => ({ invalidateTag: vi.fn() }));
vi.mock("@/lib/cache-tags", () => ({ CacheTags: { userSessions: () => "sessions", userStats: () => "stats", userDashboard: () => "dashboard", userEvents: () => "events" } }));
vi.mock("@/lib/services/session.service", () => ({ SessionService: { createFromEvent: mocks.createFromEvent, _invalidateSessionCaches: mocks.invalidateSessionCaches } }));
vi.mock("@/lib/require-auth", () => ({ ApiError: class ApiError extends Error { statusCode: number; constructor(statusCode: number, message: string) { super(message); this.statusCode = statusCode; } } }));

const serviceLoaders = import.meta.glob("../../../../src/lib/services/event-played-session.service.ts");

describe("EventPlayedSessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      event: { findFirst: mocks.eventFindFirst },
      gameProposal: { findFirst: mocks.proposalFindFirst },
      eventPlayedSession: { findUnique: mocks.playedFindUnique, create: mocks.playedCreate },
    }));
    mocks.eventFindFirst.mockResolvedValue({
      id: "event-1", createdById: "owner", eventDate: new Date("2026-11-04T18:00:00Z"),
      invites: [{ userId: "invitee", status: "accepted" }],
      guestParticipants: [{ id: "guest-1", nickname: "Mia" }],
    });
    mocks.playedFindUnique.mockResolvedValue(null);
    mocks.proposalFindFirst.mockResolvedValue({
      id: "proposal-1", eventId: "event-1", gameId: null, bggId: "42", bggName: "BGG-Abenteuer",
      bggImageUrl: "https://cf.geekdo-images.com/game.jpg", bggMinPlayers: 2, bggMaxPlayers: 5,
      bggPlayTimeMinutes: 75, game: null,
    });
    mocks.createFromEvent.mockResolvedValue({ id: "session-1", deletedAt: null });
    mocks.playedCreate.mockResolvedValue({ id: "link-1", session: { id: "session-1" } });
  });

  async function loadService() {
    const loader = Object.values(serviceLoaders)[0];
    expect(loader).toBeDefined();
    if (!loader) return null;
    return await loader() as { EventPlayedSessionService: { create: (...args: unknown[]) => Promise<unknown> } };
  }

  it("creates a BGG-only snapshot session and links it atomically to its event proposal", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;

    const result = await featureModule.EventPlayedSessionService.create("owner", "event-1", {
      proposalId: "proposal-1", operationId: "operation-1", playedAt: "2026-11-04T18:00:00.000Z",
      durationMinutes: 80, notes: "Notiz", players: [{ userId: "invitee", score: 8, placement: 1, isWinner: true }],
      guestPlayers: [{ guestId: "guest-1", score: 6, placement: 2 }],
    } as never);

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.createFromEvent).toHaveBeenCalledWith(expect.any(Object), "owner", expect.objectContaining({
      gameId: null, gameNameSnapshot: "BGG-Abenteuer", gameBggIdSnapshot: "42", gameImageUrlSnapshot: "https://cf.geekdo-images.com/game.jpg",
      players: [{ userId: "invitee", score: 8, placement: 1, isWinner: true }],
      guestPlayers: [{ name: "Mia", score: 6, placement: 2, isWinner: false }],
    }));
    expect(mocks.playedCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ eventId: "event-1", proposalId: "proposal-1", operationId: "operation-1", sessionId: "session-1" }),
    }));
    expect(result).toMatchObject({ session: { id: "session-1" }, duplicate: false });
  });

  it("rejects non-creators and does not open a write transaction", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.eventFindFirst.mockResolvedValueOnce({ id: "event-1", createdById: "other" });

    await expect(featureModule.EventPlayedSessionService.create("invitee", "event-1", {} as never))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a participant who is not an accepted invite", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", {
      proposalId: "proposal-1", operationId: "operation-123", playedAt: "2026-11-04T18:00:00.000Z",
      players: [{ userId: "stranger" }], guestPlayers: [],
    } as never)).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a proposal that does not belong to the event", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.proposalFindFirst.mockResolvedValueOnce(null);
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", {
      proposalId: "foreign-proposal", operationId: "operation-123", playedAt: "2026-11-04T18:00:00.000Z",
      players: [{ userId: "invitee" }], guestPlayers: [],
    } as never)).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns the prior session for a repeated operation without creating another", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.playedFindUnique.mockResolvedValueOnce({ session: { id: "existing-session", deletedAt: null } });

    const result = await featureModule.EventPlayedSessionService.create("owner", "event-1", {
      proposalId: "proposal-1", operationId: "operation-1",
    } as never);

    expect(result).toMatchObject({ session: { id: "existing-session" }, duplicate: true });
    expect(mocks.createFromEvent).not.toHaveBeenCalled();
    expect(mocks.playedCreate).not.toHaveBeenCalled();
  });
});
