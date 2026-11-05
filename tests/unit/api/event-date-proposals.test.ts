import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    dateProposal: { upsert: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), findFirst: vi.fn() },
    dateVote: { upsert: vi.fn() },
  };
  const event = { createdById: "user-1", selectedDate: null as Date | null };
  return {
    auth: vi.fn(),
    event,
    tx,
    eventFind: vi.fn(),
    proposalsFind: vi.fn(),
    mutation: vi.fn(),
  };
});

vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({
  requireAuth: mocks.auth,
  ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } },
  handleApiError: (error: { statusCode?: number; message?: string }) => Response.json({ error: error.message }, { status: error.statusCode ?? 500 }),
}));
vi.mock("@/lib/db", () => ({ default: { event: { findFirst: mocks.eventFind }, dateProposal: { findMany: mocks.proposalsFind } } }));
vi.mock("@/lib/services/event-mutation.service", () => ({ withEventMutation: mocks.mutation }));

import { GET, POST, DELETE } from "@/app/api/events/[id]/date-proposals/route";
import { POST as vote, PUT as bulkVote } from "@/app/api/events/[id]/date-proposals/vote/route";

const params = { params: Promise.resolve({ id: "event-1" }) };
const request = (method: string, body?: unknown) => new Request("http://localhost/api/events/event-1/date-proposals", {
  method,
  ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
}) as never;

describe("event date proposal routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.event.createdById = "user-1";
    mocks.event.selectedDate = null;
    mocks.eventFind.mockResolvedValue({ id: "event-1", createdById: "user-1", invites: [{ userId: "user-2" }] });
    mocks.proposalsFind.mockResolvedValue([]);
    mocks.tx.dateProposal.upsert.mockResolvedValue({ id: "proposal-1" });
    mocks.tx.dateProposal.findMany.mockResolvedValue([{ id: "proposal-1" }]);
    mocks.tx.dateVote.upsert.mockResolvedValue({ id: "vote-1" });
    mocks.mutation.mockImplementation(async (_actor, _action, callback) => callback({ tx: mocks.tx, event: mocks.event }));
  });

  it("allows an invited participant to read proposals but denies unknown users", async () => {
    const allowed = await GET(request("GET"), params);
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toEqual([]);

    mocks.eventFind.mockResolvedValueOnce({ id: "event-1", createdById: "creator", invites: [] });
    const denied = await GET(request("GET"), params);
    expect(denied.status).toBe(403);
    expect(mocks.proposalsFind).toHaveBeenCalledTimes(1);
  });

  it("distinguishes missing events while reading proposals", async () => {
    mocks.eventFind.mockResolvedValue(null);
    expect((await GET(request("GET"), params)).status).toBe(404);
  });

  it("rejects absent, reversed, oversized, and empty date ranges", async () => {
    expect((await POST(request("POST", {}), params)).status).toBe(400);
    expect((await POST(request("POST", { dates: [] }), params)).status).toBe(400);
    expect((await POST(request("POST", { startDate: "2026-04-02", endDate: "2026-04-01" }), params)).status).toBe(400);
    expect((await POST(request("POST", { startDate: "2026-01-01", endDate: "2027-01-02" }), params)).status).toBe(400);
    expect((await POST(request("POST", { startDate: "2026-01-01", endDate: "2026-01-01", weekdays: [2] }), params)).status).toBe(400);
    expect(mocks.mutation).not.toHaveBeenCalled();
  });

  it("normalizes direct dates and upserts a valid date range", async () => {
    const response = await POST(request("POST", { dates: ["2026-03-04T18:30:00Z"] }), params);
    expect(response.status).toBe(201);
    expect(mocks.tx.dateProposal.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { eventId_date: { eventId: "event-1", date: new Date("2026-03-04T00:00:00.000Z") } } }));
    expect(mocks.tx.dateProposal.findMany).toHaveBeenCalledTimes(1);
  });

  it("enforces creator and finalization rules and deletes all proposals when allowed", async () => {
    mocks.event.createdById = "other-user";
    expect((await POST(request("POST", { dates: ["2026-03-04"] }), params)).status).toBe(403);

    mocks.event.createdById = "user-1";
    mocks.event.selectedDate = new Date();
    expect((await POST(request("POST", { dates: ["2026-03-04"] }), params)).status).toBe(409);
    expect((await DELETE(request("DELETE"), params)).status).toBe(409);

    mocks.event.selectedDate = null;
    expect((await DELETE(request("DELETE"), params)).status).toBe(200);
    expect(mocks.tx.dateProposal.deleteMany).toHaveBeenCalledWith({ where: { eventId: "event-1" } });
  });

  it("validates single date votes and requires a proposal in the same event", async () => {
    expect((await vote(request("POST", {}), params)).status).toBe(400);
    expect((await vote(request("POST", { dateProposalId: "p1", availability: "later" }), params)).status).toBe(400);
    mocks.tx.dateProposal.findFirst.mockResolvedValue(null);
    expect((await vote(request("POST", { dateProposalId: "p1", availability: "yes" }), params)).status).toBe(404);

    mocks.tx.dateProposal.findFirst.mockResolvedValue({ id: "p1" });
    expect((await vote(request("POST", { dateProposalId: "p1", availability: "maybe" }), params)).status).toBe(200);
    expect(mocks.tx.dateVote.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { availability: "maybe" } }));
  });

  it("validates bulk votes before writing and upserts each unique proposal", async () => {
    expect((await bulkVote(request("PUT", { votes: [] }), params)).status).toBe(400);
    expect((await bulkVote(request("PUT", { votes: [{ dateProposalId: "p1", availability: "unknown" }] }), params)).status).toBe(400);
    expect((await bulkVote(request("PUT", { votes: [{ availability: "yes" }] }), params)).status).toBe(400);
    expect((await bulkVote(request("PUT", { votes: [{ dateProposalId: "p1", availability: "yes" }, { dateProposalId: "p1", availability: "no" }] }), params)).status).toBe(400);

    mocks.tx.dateProposal.findMany.mockResolvedValue([{ id: "p1" }]);
    const response = await bulkVote(request("PUT", { votes: [{ dateProposalId: "p1", availability: "yes" }] }), params);
    expect(response.status).toBe(200);
    expect(mocks.tx.dateVote.upsert).toHaveBeenCalledTimes(1);
  });
});
