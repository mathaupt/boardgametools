import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: { apiLog: { create: vi.fn() } },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/sync-response", () => ({ buildSyncPayload: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { GET } from "@/app/api/mobile/v1/sync/route";
import { apiAuth } from "@/lib/api-auth";
import { buildSyncPayload } from "@/lib/sync-response";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedBuild = vi.mocked(buildSyncPayload);

const emptyPayload = {
  syncedAt: "2099-01-01T00:00:00.000Z",
  games: { created: [], updated: [], deleted: [] },
  sessions: { created: [], updated: [], deleted: [] },
  events: { created: [], updated: [], deleted: [] },
  dateProposals: { created: [], updated: [], deleted: [] },
  groups: { created: [], updated: [], deleted: [] },
  groupPolls: { created: [], updated: [], deleted: [] },
  groupComments: { created: [], updated: [], deleted: [] },
  eventProposals: { created: [], updated: [], deleted: [] },
  votes: { created: [], updated: [], deleted: [] },
  dateVotes: { created: [], updated: [], deleted: [] },
  groupPollVotes: { created: [], updated: [], deleted: [] },
  groupMembers: { created: [], updated: [], deleted: [] },
};

describe("GET /api/mobile/v1/sync", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns sync payload for authenticated user", async () => {
    mockedApiAuth.mockResolvedValue({ user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } } as never);
    mockedBuild.mockResolvedValue(emptyPayload as never);

    const res = await GET(new NextRequest("http://localhost:3000/api/mobile/v1/sync"), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.syncedAt).toBe("2099-01-01T00:00:00.000Z");
    expect(mockedBuild).toHaveBeenCalledWith("u1");
  });

  it("returns 401 when not authenticated", async () => {
    mockedApiAuth.mockResolvedValue(null as never);

    const res = await GET(new NextRequest("http://localhost:3000/api/mobile/v1/sync"), {});
    expect(res.status).toBe(401);
  });
});
