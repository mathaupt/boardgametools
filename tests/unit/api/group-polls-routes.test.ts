import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  memberFind: vi.fn(),
  pollFindMany: vi.fn(),
  pollCreate: vi.fn(),
  pollFind: vi.fn(),
  pollUpdate: vi.fn(),
  pollDelete: vi.fn(),
  groupFind: vi.fn(),
}));

vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.auth, handleApiError: (error: { statusCode?: number; message?: string }) => Response.json({ error: error.message }, { status: error.statusCode ?? 500 }) }));
vi.mock("@/lib/db", () => ({ default: {
  groupMember: { findFirst: mocks.memberFind },
  groupPoll: { findMany: mocks.pollFindMany, create: mocks.pollCreate, findFirst: mocks.pollFind, update: mocks.pollUpdate, delete: mocks.pollDelete },
  group: { findFirst: mocks.groupFind },
} }));

import { GET as listPolls, POST as createPoll } from "@/app/api/groups/[id]/polls/route";
import { GET as getPoll, PUT as updatePoll, DELETE as deletePoll } from "@/app/api/groups/[id]/polls/[pollId]/route";

const listContext = { params: Promise.resolve({ id: "group-1" }) };
const detailContext = { params: Promise.resolve({ id: "group-1", pollId: "poll-1" }) };
const request = (method: string, body?: unknown) => new Request("http://localhost/api/groups/group-1/polls", {
  method,
  ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
}) as never;

describe("group poll routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.memberFind.mockResolvedValue({ id: "member-1" });
    mocks.pollFindMany.mockResolvedValue([]);
    mocks.pollCreate.mockResolvedValue({ id: "poll-1" });
    mocks.pollFind.mockResolvedValue({ id: "poll-1", createdById: "user-1" });
    mocks.pollUpdate.mockResolvedValue({ id: "poll-1", status: "closed" });
    mocks.groupFind.mockResolvedValue({ id: "group-1", ownerId: "owner" });
  });

  it("requires membership to list or create group polls", async () => {
    mocks.memberFind.mockResolvedValue(null);
    expect((await listPolls(request("GET"), listContext)).status).toBe(403);
    expect((await createPoll(request("POST", { title: "Plan", options: ["A", "B"] }), listContext)).status).toBe(403);
    expect(mocks.pollFindMany).not.toHaveBeenCalled();
  });

  it("lists polls for a member and validates poll title and options", async () => {
    expect((await listPolls(request("GET"), listContext)).status).toBe(200);
    expect((await createPoll(request("POST", {}), listContext)).status).toBe(400);
    expect((await createPoll(request("POST", { title: "x".repeat(201), options: ["A", "B"] }), listContext)).status).toBe(400);
    expect((await createPoll(request("POST", { title: "Plan", options: ["A", "x".repeat(501)] }), listContext)).status).toBe(400);
  });

  it("creates a poll with ordered options and default single-choice type", async () => {
    const response = await createPoll(request("POST", { title: "Termin", options: ["Freitag", "Samstag"] }), listContext);
    expect(response.status).toBe(201);
    expect(mocks.pollCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "single", options: { create: [{ text: "Freitag", sortOrder: 0 }, { text: "Samstag", sortOrder: 1 }] } }) }));
  });

  it("requires membership and returns 404 when a requested poll is missing", async () => {
    mocks.memberFind.mockResolvedValue(null);
    expect((await getPoll(request("GET"), detailContext)).status).toBe(403);
    mocks.memberFind.mockResolvedValue({ id: "member-1" });
    mocks.pollFind.mockResolvedValue(null);
    expect((await getPoll(request("GET"), detailContext)).status).toBe(404);
  });

  it("returns a poll to members and permits only its creator or group owner to update it", async () => {
    expect((await getPoll(request("GET"), detailContext)).status).toBe(200);
    mocks.pollFind.mockResolvedValue({ id: "poll-1", createdById: "other" });
    mocks.groupFind.mockResolvedValue({ ownerId: "owner" });
    expect((await updatePoll(request("PUT", { status: "closed" }), detailContext)).status).toBe(403);

    mocks.groupFind.mockResolvedValue({ ownerId: "user-1" });
    expect((await updatePoll(request("PUT", { status: "invalid" }), detailContext)).status).toBe(400);
    expect((await updatePoll(request("PUT", { status: "closed" }), detailContext)).status).toBe(200);
    expect(mocks.pollUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "closed", closedAt: expect.any(Date) } }));
  });

  it("reopens an owned poll without a close timestamp and protects deletion", async () => {
    mocks.pollFind.mockResolvedValue({ id: "poll-1", createdById: "user-1" });
    expect((await updatePoll(request("PUT", { status: "open" }), detailContext)).status).toBe(200);
    expect(mocks.pollUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "open", closedAt: null } }));

    mocks.pollFind.mockResolvedValueOnce(null);
    expect((await deletePoll(request("DELETE"), detailContext)).status).toBe(404);
    mocks.pollFind.mockResolvedValueOnce({ id: "poll-1", createdById: "other" });
    mocks.groupFind.mockResolvedValue({ ownerId: "other-owner" });
    expect((await deletePoll(request("DELETE"), detailContext)).status).toBe(403);
    mocks.groupFind.mockResolvedValue({ ownerId: "user-1" });
    expect((await deletePoll(request("DELETE"), detailContext)).status).toBe(200);
    expect(mocks.pollDelete).toHaveBeenCalledWith({ where: { id: "poll-1" } });
  });
});
