import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn(), findFirst: vi.fn(), handleApiError: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.requireAuth, handleApiError: mocks.handleApiError }));
vi.mock("@/lib/db", () => ({ default: { event: { findFirst: mocks.findFirst } } }));
vi.mock("@/lib/error-messages", () => ({ Errors: { EVENT_NOT_FOUND: "Event nicht gefunden", ACCESS_DENIED: "Zugriff verweigert" } }));
import { GET } from "@/app/api/events/[id]/route";

const context = { params: Promise.resolve({ id: "event-1" }) };
const baseEvent = { id: "event-1", createdById: "owner", invites: [], proposals: [], guestParticipants: [] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuth.mockResolvedValue({ userId: "owner" });
  mocks.findFirst.mockResolvedValue(baseEvent);
  mocks.handleApiError.mockImplementation((error: Error) => ({ status: 500, body: { error: error.message } }));
});

describe("GET /api/events/[id]", () => {
  it("returns 404 for a missing event and 403 for a non-participant", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    expect(await GET({} as never, context)).toMatchObject({ status: 404, body: { error: "Event nicht gefunden" } });
    mocks.findFirst.mockResolvedValueOnce({ ...baseEvent, createdById: "other", invites: [{ userId: "someone-else" }] });
    expect(await GET({} as never, context)).toMatchObject({ status: 403, body: { error: "Zugriff verweigert" } });
  });

  it("merges BGG and guest proposal details and strips vote rows", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "guest-user" });
    const createdAt = new Date("2026-11-01T12:00:00Z");
    mocks.findFirst.mockResolvedValue({ ...baseEvent,
      createdById: "other",
      invites: [{ userId: "guest-user" }],
      proposals: [
        { id: "p1", game: null, bggId: "42", bggName: null, bggImageUrl: null, bggMinPlayers: 2, bggMaxPlayers: null, bggPlayTimeMinutes: 60, createdAt, proposedBy: null, guest: { id: "guest-1", nickname: "Mia" }, _count: { votes: 1, guestVotes: 2 }, votes: [{ id: "vote-1" }] },
        { id: "p2", game: { id: "game-1" }, bggId: "8", createdAt, proposedBy: { id: "user-1" }, guest: null, _count: { votes: 0, guestVotes: 0 }, votes: [] },
      ],
      guestParticipants: [{ id: "g1", votes: [{ id: "v1" }] }],
    });

    const response = await GET({} as never, { params: Promise.resolve({ id: "event-1" }) });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      currentUserId: "guest-user", isCreator: false,
      proposals: [
        { game: { id: "bgg-42", name: "Unbekanntes Spiel", imageUrl: null, minPlayers: 2, maxPlayers: null, playTimeMinutes: 60 }, proposedBy: { id: "guest-1", name: "Mia", email: "" }, totalVotes: 3, userHasVoted: true, votes: undefined },
        { game: { id: "game-1" }, proposedBy: { id: "user-1" }, totalVotes: 0, userHasVoted: false, votes: undefined },
      ],
      guestParticipants: [{ id: "g1", votes: undefined }],
    });
  });

  it("passes unexpected errors through the shared API handler", async () => {
    const error = new Error("database unavailable");
    mocks.findFirst.mockRejectedValue(error);
    expect(await GET({} as never, context)).toMatchObject({ status: 500 });
    expect(mocks.handleApiError).toHaveBeenCalledWith(error);
  });
});
