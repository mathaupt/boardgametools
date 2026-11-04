import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/require-auth", () => ({
  requireAuth: mocks.requireAuth,
  handleApiError: (error: { statusCode?: number; message?: string }) => ({ status: error.statusCode ?? 500, body: { error: error.message } }),
  ApiError: class ApiError extends Error { statusCode: number; constructor(statusCode: number, message: string) { super(message); this.statusCode = statusCode; } },
}));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/services/event-played-session.service", () => ({ EventPlayedSessionService: { create: mocks.create } }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) } }));

const routeLoaders = import.meta.glob("../../../src/app/api/events/[id]/played-sessions/route.ts");

describe("POST /api/events/:id/played-sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "owner", role: "USER", name: "Owner", email: "owner@example.invalid" });
    mocks.create.mockResolvedValue({ session: { id: "session-1" }, duplicate: false });
  });

  async function loadPost() {
    const loader = Object.values(routeLoaders)[0];
    expect(loader).toBeDefined();
    if (!loader) return null;
    return await loader() as { POST: (request: unknown, context: unknown) => Promise<{ status: number; body: unknown }> };
  }

  it("validates and creates a played session for the authenticated event creator", async () => {
    const route = await loadPost();
    if (!route) return;
    const body = { proposalId: "proposal-1", operationId: "operation-123", playedAt: "2026-11-04T18:00:00.000Z", players: [{ userId: "owner" }], guestPlayers: [] };
    const response = await route.POST({ json: async () => body }, { params: Promise.resolve({ id: "event-1" }) });

    expect(response).toEqual({ status: 201, body: { session: { id: "session-1" }, duplicate: false } });
    expect(mocks.create).toHaveBeenCalledWith("owner", "event-1", body);
  });

  it("rejects unauthenticated session creation", async () => {
    const route = await loadPost();
    if (!route) return;
    mocks.requireAuth.mockRejectedValueOnce({ statusCode: 401, message: "Unauthorized" });
    const response = await route.POST({ json: async () => ({}) }, { params: Promise.resolve({ id: "event-1" }) });
    expect(response.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects malformed submissions before the service is called", async () => {
    const route = await loadPost();
    if (!route) return;
    const response = await route.POST({ json: async () => ({ proposalId: "", operationId: "bad", playedAt: "invalid", players: [], guestPlayers: [] }) }, { params: Promise.resolve({ id: "event-1" }) });

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
