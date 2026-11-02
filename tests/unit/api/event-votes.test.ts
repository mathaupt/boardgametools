import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest } from "./helpers";

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  handleApiError: vi.fn((error: any) => ({ status: error.statusCode ?? 500, body: { error: error.message } })),
  proposalFindFirst: vi.fn(),
  voteFindFirst: vi.fn(),
  voteCreate: vi.fn(),
  voteDeleteMany: vi.fn(),
  userFindUnique: vi.fn(),
  notifyNewVote: vi.fn(),
  withEventMutation: vi.fn(),
}));

vi.mock("next/server", () => ({ NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) } }));
vi.mock("@/lib/require-auth", () => ({
  requireAuth: state.requireAuth,
  handleApiError: state.handleApiError,
  ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } },
}));
vi.mock("@/lib/db", () => ({ default: { user: { findUnique: state.userFindUnique } } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/services/push.service", () => ({ notifyNewVote: state.notifyNewVote }));
vi.mock("@/lib/logger", () => ({ default: { error: vi.fn() } }));
vi.mock("@/lib/services/event-mutation.service", () => ({ withEventMutation: state.withEventMutation }));

import { DELETE, POST } from "@/app/api/events/[id]/votes/route";

const event = { id: "event-1", createdById: "owner-1", title: "Spieleabend" };
const vote = { id: "vote-1", proposalId: "proposal-1", userId: "voter-1" };

function setupMutation() {
  const tx = {
    gameProposal: { findFirst: state.proposalFindFirst },
    vote: { findFirst: state.voteFindFirst, create: state.voteCreate, deleteMany: state.voteDeleteMany },
  };
  state.withEventMutation.mockImplementation(async (_identity, _permission, callback) => callback({ tx, event }));
  return tx;
}

describe("event vote API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.requireAuth.mockResolvedValue({ userId: "voter-1" });
    state.proposalFindFirst.mockResolvedValue({ id: "proposal-1" });
    state.voteFindFirst.mockResolvedValue(null);
    state.voteCreate.mockResolvedValue(vote);
    state.voteDeleteMany.mockResolvedValue({ count: 1 });
    state.withEventMutation.mockReset();
    state.userFindUnique.mockResolvedValue({ name: "Mara", email: "mara@example.com" });
    state.notifyNewVote.mockResolvedValue(undefined);
    setupMutation();
  });

  it("rejects a POST without proposalId", async () => {
    const response = await (POST as any)(createMockRequest("POST", "http://localhost/api/events/event-1/votes", { body: {} }), { params: Promise.resolve({ id: "event-1" }) });
    expect(response.status).toBe(400);
    expect(state.withEventMutation).not.toHaveBeenCalled();
  });

  it("creates a vote in the guarded event mutation and notifies its creator", async () => {
    const response = await (POST as any)(createMockRequest("POST", "http://localhost/api/events/event-1/votes", { body: { proposalId: "proposal-1" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(response).toEqual({ body: vote, status: 201 });
    expect(state.withEventMutation).toHaveBeenCalledWith({ kind: "user", eventId: "event-1", userId: "voter-1" }, "voteGame", expect.any(Function));
    expect(state.voteCreate).toHaveBeenCalledWith(expect.objectContaining({ data: { proposalId: "proposal-1", userId: "voter-1" } }));
    expect(state.notifyNewVote).toHaveBeenCalledWith("owner-1", "event-1", "Spieleabend", "Mara");
  });

  it("does not notify the creator when they cast their own vote", async () => {
    state.requireAuth.mockResolvedValue({ userId: "owner-1" });
    const response = await (POST as any)(createMockRequest("POST", "http://localhost/api/events/event-1/votes", { body: { proposalId: "proposal-1" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(response.status).toBe(201);
    expect(state.notifyNewVote).not.toHaveBeenCalled();
    expect(state.userFindUnique).not.toHaveBeenCalled();
  });

  it("maps missing proposals and duplicate votes through the API error handler", async () => {
    state.proposalFindFirst.mockResolvedValueOnce(null);
    const missing = await (POST as any)(createMockRequest("POST", "http://localhost/api/events/event-1/votes", { body: { proposalId: "missing" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(missing.status).toBe(404);

    state.voteFindFirst.mockResolvedValueOnce({ id: "already-voted" });
    const duplicate = await (POST as any)(createMockRequest("POST", "http://localhost/api/events/event-1/votes", { body: { proposalId: "proposal-1" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(duplicate.status).toBe(400);
    expect(state.voteCreate).not.toHaveBeenCalled();
  });

  it("tolerates push notification failures after a vote is saved", async () => {
    state.notifyNewVote.mockRejectedValueOnce(new Error("Push unavailable"));
    const response = await (POST as any)(createMockRequest("POST", "http://localhost/api/events/event-1/votes", { body: { proposalId: "proposal-1" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(response.status).toBe(201);
  });

  it("rejects DELETE without an id, for unknown proposals, or without an existing vote", async () => {
    const missingId = await (DELETE as any)(createMockRequest("DELETE", "http://localhost/api/events/event-1/votes"), { params: Promise.resolve({ id: "event-1" }) });
    expect(missingId.status).toBe(400);

    state.proposalFindFirst.mockResolvedValueOnce(null);
    const missingProposal = await (DELETE as any)(createMockRequest("DELETE", "http://localhost/api/events/event-1/votes", { searchParams: { proposalId: "missing" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(missingProposal.status).toBe(404);

    state.voteDeleteMany.mockResolvedValueOnce({ count: 0 });
    const missingVote = await (DELETE as any)(createMockRequest("DELETE", "http://localhost/api/events/event-1/votes", { searchParams: { proposalId: "proposal-1" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(missingVote.status).toBe(404);
  });

  it("deletes an existing vote and returns the confirmation", async () => {
    const response = await (DELETE as any)(createMockRequest("DELETE", "http://localhost/api/events/event-1/votes", { searchParams: { proposalId: "proposal-1" } }), { params: Promise.resolve({ id: "event-1" }) });
    expect(response.status).toBe(200);
    expect(response.body.message).toBeTruthy();
    expect(state.voteDeleteMany).toHaveBeenCalledWith({ where: { proposalId: "proposal-1", userId: "voter-1" } });
  });
});
