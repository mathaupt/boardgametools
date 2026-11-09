import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventFindFirst: vi.fn(),
  proposalFindFirst: vi.fn(),
  gameFindFirst: vi.fn(),
  fetchBGGGame: vi.fn(),
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
    game: { findFirst: mocks.gameFindFirst },
    eventPlayedSession: { findUnique: mocks.playedFindUnique, create: mocks.playedCreate },
  };
  return { default: { ...tx, $transaction: mocks.transaction } };
});
vi.mock("@/lib/cache", () => ({ invalidateTag: vi.fn() }));
vi.mock("@/lib/bgg", () => ({ fetchBGGGame: mocks.fetchBGGGame }));
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
      game: { findFirst: mocks.gameFindFirst },
      eventPlayedSession: { findUnique: mocks.playedFindUnique, create: mocks.playedCreate },
    }));
    mocks.eventFindFirst.mockResolvedValue({
      id: "event-1", createdById: "owner", eventDate: new Date("2026-11-04T18:00:00Z"),
      invites: [{ userId: "invitee", status: "accepted" }],
      guestParticipants: [{ id: "guest-1", nickname: "Mia" }],
    });
    mocks.playedFindUnique.mockResolvedValue(null);
    mocks.gameFindFirst.mockResolvedValue(null);
    mocks.fetchBGGGame.mockResolvedValue({ bggId: "42", name: "BGG-Abenteuer", imageUrl: "https://cf.geekdo-images.com/game.jpg", minPlayers: 2, maxPlayers: 5, playTimeMinutes: 75, complexity: 2.3, description: "Beschreibung" });
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
      source: { type: "proposal", proposalId: "proposal-1" }, operationId: "operation-1", playedAt: "2026-11-04T18:00:00.000Z",
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
      source: { type: "proposal", proposalId: "proposal-1" }, operationId: "operation-123", playedAt: "2026-11-04T18:00:00.000Z",
      players: [{ userId: "stranger" }], guestPlayers: [],
    } as never)).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a proposal that does not belong to the event", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.proposalFindFirst.mockResolvedValueOnce(null);
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "proposal", proposalId: "foreign-proposal" }, operationId: "operation-123", playedAt: "2026-11-04T18:00:00.000Z",
      players: [{ userId: "invitee" }], guestPlayers: [],
    } as never)).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns the prior session for a repeated operation without creating another", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.playedFindUnique.mockResolvedValueOnce({ session: { id: "existing-session", deletedAt: null } });

    const result = await featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "proposal", proposalId: "proposal-1" }, operationId: "operation-1",
    } as never);

    expect(result).toMatchObject({ session: { id: "existing-session" }, duplicate: true });
    expect(mocks.createFromEvent).not.toHaveBeenCalled();
    expect(mocks.playedCreate).not.toHaveBeenCalled();
  });

  it("rejects absent events, invalid operations, and deleted idempotency targets", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.eventFindFirst.mockResolvedValueOnce(null);
    await expect(featureModule.EventPlayedSessionService.create("owner", "missing", {} as never)).rejects.toMatchObject({ statusCode: 404 });
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", { operationId: "short" } as never)).rejects.toMatchObject({ statusCode: 400 });
    mocks.playedFindUnique.mockResolvedValueOnce({ session: { id: "deleted", deletedAt: new Date() } });
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", { operationId: "operation-123" } as never)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("validates required data, dates, duration, notes, participant bounds, and duplicates", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    const valid = { source: { type: "proposal", proposalId: "proposal-1" }, operationId: "operation-123", playedAt: "2026-11-04T18:00:00.000Z", players: [{ userId: "owner" }], guestPlayers: [] };
    const invalidInputs = [
      { ...valid, source: { type: "proposal", proposalId: "" }, players: [] },
      { ...valid, playedAt: "not-a-date" },
      { ...valid, durationMinutes: 0 },
      { ...valid, durationMinutes: 1441 },
      { ...valid, durationMinutes: 1.5 },
      { ...valid, notes: "x".repeat(2001) },
      { ...valid, players: [], guestPlayers: [] },
      { ...valid, players: Array.from({ length: 21 }, (_, i) => ({ userId: `u-${i}` })) },
      { ...valid, players: [{ userId: "owner" }, { userId: "owner" }] },
      { ...valid, guestPlayers: [{ guestId: "guest-1" }, { guestId: "guest-1" }] },
    ];
    for (const input of invalidInputs) {
      await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", input as never)).rejects.toMatchObject({ statusCode: 400 });
    }
  });

  it("rejects unknown event guests and snapshots an available collection game", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "proposal", proposalId: "proposal-1" }, operationId: "operation-123", playedAt: "2026-11-04T18:00:00.000Z",
      players: [{ userId: "owner" }], guestPlayers: [{ guestId: "not-here" }],
    } as never)).rejects.toMatchObject({ statusCode: 400 });
    mocks.proposalFindFirst.mockResolvedValueOnce({ id: "proposal-1", bggId: null, bggName: null, game: { id: "game-1", ownerId: "owner", deletedAt: null, name: "  Catan  ", bggId: "13", imageUrl: null, minPlayers: null, maxPlayers: null, playTimeMinutes: null, complexity: null } });
    await featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "proposal", proposalId: "proposal-1" }, operationId: "operation-124", playedAt: "2026-11-04T18:00:00.000Z",
      players: [{ userId: "owner" }], guestPlayers: [],
    } as never);
    expect(mocks.createFromEvent).toHaveBeenLastCalledWith(expect.any(Object), "owner", expect.objectContaining({ gameId: "game-1", gameNameSnapshot: "  Catan  ", gameBggIdSnapshot: "13", gameMinPlayersSnapshot: undefined, notes: null }));
  });

  it("snapshots an owned collection game and creates an unproposed event link", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.gameFindFirst.mockResolvedValueOnce({ id: "game-1", ownerId: "owner", deletedAt: null, name: "Catan", bggId: "13", imageUrl: null, minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60, complexity: 2 });
    await featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "collection", collectionGameId: "game-1" }, operationId: "operation-125", playedAt: "2026-11-04T18:00:00.000Z", players: [{ userId: "owner" }], guestPlayers: [],
    } as never);
    expect(mocks.gameFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "game-1", ownerId: "owner", deletedAt: null } }));
    expect(mocks.createFromEvent).toHaveBeenCalledWith(expect.any(Object), "owner", expect.objectContaining({ gameId: "game-1", gameNameSnapshot: "Catan" }));
    expect(mocks.playedCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ proposalId: null }) }));
  });

  it("hides collection games that are foreign or soft-deleted", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    mocks.gameFindFirst.mockResolvedValueOnce(null);
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "collection", collectionGameId: "foreign" }, operationId: "operation-128", playedAt: "2026-11-04T18:00:00.000Z", players: [{ userId: "owner" }], guestPlayers: [],
    } as never)).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("resolves BGG metadata server-side and rejects unknown IDs without writing", async () => {
    const featureModule = await loadService();
    if (!featureModule) return;
    await featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "bgg", bggId: "42" }, operationId: "operation-126", playedAt: "2026-11-04T18:00:00.000Z", players: [{ userId: "owner" }], guestPlayers: [],
    } as never);
    expect(mocks.fetchBGGGame).toHaveBeenCalledWith("42");
    expect(mocks.createFromEvent).toHaveBeenCalledWith(expect.any(Object), "owner", expect.objectContaining({ gameId: null, gameNameSnapshot: "BGG-Abenteuer", gameBggIdSnapshot: "42" }));
    expect(mocks.playedCreate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ proposalId: null }) }));
    mocks.fetchBGGGame.mockResolvedValueOnce(null);
    await expect(featureModule.EventPlayedSessionService.create("owner", "event-1", {
      source: { type: "bgg", bggId: "404" }, operationId: "operation-127", playedAt: "2026-11-04T18:00:00.000Z", players: [{ userId: "owner" }], guestPlayers: [],
    } as never)).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
