import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db";
import { withEventMutation } from "@/lib/services/event-mutation.service";

vi.mock("@/lib/db", () => ({ default: { $transaction: vi.fn() } }));
vi.mock("@/lib/cache", () => ({ invalidateTag: vi.fn() }));
vi.mock("@/lib/require-auth", () => ({
  ApiError: class ApiError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
}));

const event = {
  id: "event-1",
  createdById: "user-1",
  status: "voting",
  eventDate: new Date("2026-11-10T18:00:00.000Z"),
  selectedDate: null,
  selectedGameId: null,
  winningProposalId: null,
  deletedAt: null,
  isPublic: true,
  shareToken: "share-1",
  invites: [],
};

function transactionMock(overrides: Record<string, unknown> = {}) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: event.id }]),
    event: {
      findFirst: vi.fn().mockResolvedValue(event),
      update: vi.fn().mockResolvedValue(event),
    },
    ...overrides,
  };
  vi.mocked(prisma.$transaction).mockImplementation((async (callback: (tx: unknown) => unknown) => callback(tx)) as never);
  return tx;
}

describe("withEventMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("locks and reloads the event before executing an allowed write", async () => {
    const tx = transactionMock();
    const write = vi.fn().mockResolvedValue("saved");

    const result = await withEventMutation(
      { kind: "user", eventId: event.id, userId: "user-1" },
      "voteGame",
      write
    );

    expect(tx.$queryRaw).toHaveBeenCalledOnce();
    expect(tx.event.findFirst).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledOnce();
    expect(tx.event.update).toHaveBeenCalledOnce();
    expect(result).toBe("saved");
  });

  it("returns 409 and performs no write when the locked event is closed", async () => {
    const closedEvent = { ...event, status: "closed" };
    const tx = transactionMock({ event: {
      findFirst: vi.fn().mockResolvedValue(closedEvent),
      update: vi.fn(),
    } });
    const write = vi.fn();

    await expect(withEventMutation(
      { kind: "user", eventId: event.id, userId: "user-1" },
      "voteGame",
      write
    )).rejects.toMatchObject({ statusCode: 409 });

    expect(write).not.toHaveBeenCalled();
    expect(tx.event.update).not.toHaveBeenCalled();
  });

  it("returns 403 when a signed-in user has no event access", async () => {
    const tx = transactionMock({ event: {
      findFirst: vi.fn().mockResolvedValue({ ...event, isPublic: false }),
      update: vi.fn(),
    } });

    await expect(withEventMutation(
      { kind: "user", eventId: event.id, userId: "stranger" },
      "voteGame",
      vi.fn()
    )).rejects.toMatchObject({ statusCode: 403 });
    expect(tx.event.update).not.toHaveBeenCalled();
  });

  it("returns 404 when a public share is revoked before the mutation", async () => {
    const tx = transactionMock({
      $queryRaw: vi.fn().mockResolvedValue([]),
      event: { findFirst: vi.fn(), update: vi.fn() },
    });

    await expect(withEventMutation(
      { kind: "public", token: "revoked" },
      "join",
      vi.fn()
    )).rejects.toMatchObject({ statusCode: 404 });
    expect(tx.event.findFirst).not.toHaveBeenCalled();
  });
});
