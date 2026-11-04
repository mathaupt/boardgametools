import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn(), create: vi.fn(), join: vi.fn(), leave: vi.fn(), error: vi.fn(), json: vi.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({ body, status: init?.status ?? 200, headers: init?.headers })) }));
vi.mock("next/server", () => ({ NextResponse: { json: mocks.json } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.auth, handleApiError: mocks.error }));
vi.mock("@/lib/services/group-challenge.service", () => ({ GroupChallengeService: { list: mocks.list, create: mocks.create, join: mocks.join, leave: mocks.leave } }));

import { GET, POST } from "@/app/api/groups/[id]/challenges/route";
import { POST as join } from "@/app/api/groups/[id]/challenges/[challengeId]/participation/route";
import { DELETE as leave } from "@/app/api/groups/[id]/challenges/[challengeId]/participation/route";

describe("group challenge APIs", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ userId: "member-1" }); mocks.list.mockResolvedValue([]); mocks.create.mockResolvedValue({ id: "challenge-1" }); });

  it("reads aggregate challenges for the authenticated member", async () => {
    await GET(new Request("http://localhost/api/groups/group-1/challenges") as never, { params: Promise.resolve({ id: "group-1" }) });
    expect(mocks.list).toHaveBeenCalledWith("group-1", "member-1");
  });

  it("validates challenge fields and creates only the fixed target types", async () => {
    const request = new Request("http://localhost/api/groups/group-1/challenges", { method: "POST", body: JSON.stringify({ title: "Zehn Runden", kind: "sessions", target: 10, endsAt: null }) }) as never;
    const response = await POST(request, { params: Promise.resolve({ id: "group-1" }) });
    expect(mocks.create).toHaveBeenCalledWith("group-1", "member-1", { title: "Zehn Runden", kind: "sessions", target: 10, endsAt: null });
    expect(response).toMatchObject({ status: 201 });
  });

  it("rejects malformed challenge bodies", async () => {
    const request = new Request("http://localhost/api/groups/group-1/challenges", { method: "POST", body: JSON.stringify({ title: "", kind: "ranking", target: 100 }) }) as never;
    const response = await POST(request, { params: Promise.resolve({ id: "group-1" }) });
    expect(response).toMatchObject({ status: 400 });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("routes opt-in and opt-out through the authenticated member identity", async () => {
    await join(new Request("http://localhost") as never, { params: Promise.resolve({ id: "group-1", challengeId: "challenge-1" }) });
    await leave(new Request("http://localhost") as never, { params: Promise.resolve({ id: "group-1", challengeId: "challenge-1" }) });
    expect(mocks.join).toHaveBeenCalledWith("group-1", "challenge-1", "member-1");
    expect(mocks.leave).toHaveBeenCalledWith("group-1", "challenge-1", "member-1");
  });
});
