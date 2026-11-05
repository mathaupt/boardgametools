import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  eventFind: vi.fn(),
  inviteFind: vi.fn(),
  inviteCreate: vi.fn(),
  inviteUpdate: vi.fn(),
  inviteDelete: vi.fn(),
  userFind: vi.fn(),
  sendInvite: vi.fn(),
  sendResponse: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({
  requireAuth: mocks.auth,
  handleApiError: (error: { statusCode?: number; message?: string }) => Response.json({ error: error.message }, { status: error.statusCode ?? 500 }),
}));
vi.mock("@/lib/db", () => ({ default: {
  event: { findFirst: mocks.eventFind },
  eventInvite: { findFirst: mocks.inviteFind, create: mocks.inviteCreate, update: mocks.inviteUpdate, delete: mocks.inviteDelete },
  user: { findUnique: mocks.userFind },
} }));
vi.mock("@/lib/mailer", () => ({ sendEventInviteEmail: mocks.sendInvite, sendInviteResponseEmail: mocks.sendResponse }));
vi.mock("@/lib/public-link", () => ({ getPublicBaseUrl: vi.fn(async () => "https://example.test") }));
vi.mock("@/lib/crypto", () => ({ encryptId: vi.fn(() => "encrypted-invite") }));
vi.mock("@/lib/cache", () => ({ invalidateTag: mocks.invalidate }));

import { POST, PUT, DELETE } from "@/app/api/events/[id]/invites/route";

const context = { params: Promise.resolve({ id: "event-1" }) };
const request = (method: string, body?: unknown, url = "http://localhost/api/events/event-1/invites") => new Request(url, {
  method,
  ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
}) as never;

describe("event invite routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "creator", name: "Creator", email: "creator@example.test" });
    mocks.eventFind.mockResolvedValue({ id: "event-1", title: "Spielabend", eventDate: new Date("2026-12-01"), location: "Berlin", createdById: "creator" });
    mocks.inviteFind.mockResolvedValue(null);
    mocks.inviteCreate.mockResolvedValue({ id: "invite-1", userId: null, email: "guest@example.test" });
    mocks.inviteUpdate.mockResolvedValue({ id: "invite-1", status: "accepted" });
    mocks.userFind.mockResolvedValue(null);
    mocks.sendInvite.mockResolvedValue(undefined);
    mocks.sendResponse.mockResolvedValue(undefined);
  });

  it("validates invite target and creator permission before writing", async () => {
    expect((await POST(request("POST", {}), context)).status).toBe(400);
    mocks.eventFind.mockResolvedValue(null);
    expect((await POST(request("POST", { email: "guest@example.test" }), context)).status).toBe(404);
    expect(mocks.inviteCreate).not.toHaveBeenCalled();
  });

  it("rejects duplicate email and registered-user invitations", async () => {
    mocks.inviteFind.mockResolvedValue({ id: "existing" });
    expect((await POST(request("POST", { email: "guest@example.test" }), context)).status).toBe(400);

    mocks.inviteFind.mockResolvedValue(null);
    mocks.userFind.mockResolvedValue({ id: "user-2", email: "user@example.test" });
    mocks.inviteFind.mockResolvedValueOnce({ id: "existing-user" });
    expect((await POST(request("POST", { userId: "user-2" }), context)).status).toBe(400);
    expect(mocks.inviteCreate).not.toHaveBeenCalled();
  });

  it("creates an external invite, sends a public link, and tolerates mail failure", async () => {
    mocks.sendInvite.mockRejectedValue(new Error("smtp offline"));
    const response = await POST(request("POST", { email: "guest@example.test" }), context);
    expect(response.status).toBe(201);
    expect(mocks.inviteCreate).toHaveBeenCalledWith(expect.objectContaining({ data: { eventId: "event-1", userId: null, email: "guest@example.test", status: "pending" } }));
    expect(mocks.sendInvite).toHaveBeenCalledWith(expect.objectContaining({ eventUrl: "https://example.test/public/invite/encrypted-invite" }));
  });

  it("creates an account invite using the dashboard link and tolerates a missing user email", async () => {
    mocks.userFind.mockResolvedValue({ id: "user-2", email: "user@example.test" });
    mocks.inviteCreate.mockResolvedValue({ id: "invite-2", userId: "user-2", email: null });
    const response = await POST(request("POST", { userId: "user-2" }), context);
    expect(response.status).toBe(201);
    expect(mocks.sendInvite).toHaveBeenCalledWith(expect.objectContaining({ to: "user@example.test", eventUrl: "https://example.test/dashboard/events/event-1" }));

    mocks.userFind.mockResolvedValue({ id: "user-3", email: null });
    mocks.inviteCreate.mockResolvedValue({ id: "invite-3", userId: "user-3", email: null });
    await POST(request("POST", { userId: "user-3" }), context);
    expect(mocks.sendInvite).toHaveBeenCalledTimes(1);
  });

  it("validates response status and returns not found for a missing personal invite", async () => {
    expect((await PUT(request("PUT", { status: "pending" }), context)).status).toBe(400);
    mocks.inviteFind.mockResolvedValue(null);
    expect((await PUT(request("PUT", { status: "accepted" }), context)).status).toBe(404);
    expect(mocks.inviteUpdate).not.toHaveBeenCalled();
  });

  it("updates invite response and emails the organizer except when the responder is the creator", async () => {
    mocks.inviteFind.mockResolvedValue({ id: "invite-1" });
    mocks.eventFind.mockResolvedValue({ id: "event-1", title: "Spielabend", createdById: "organizer", createdBy: { email: "organizer@example.test", name: "Host" } });
    expect((await PUT(request("PUT", { status: "accepted" }), context)).status).toBe(200);
    expect(mocks.sendResponse).toHaveBeenCalledWith(expect.objectContaining({ to: "organizer@example.test", response: "accepted" }));

    mocks.eventFind.mockResolvedValue({ id: "event-1", title: "Spielabend", createdById: "creator", createdBy: { email: "organizer@example.test", name: "Host" } });
    await PUT(request("PUT", { status: "declined" }), context);
    expect(mocks.sendResponse).toHaveBeenCalledTimes(1);
  });

  it("requires an invite ID and verifies event ownership before deleting", async () => {
    expect((await DELETE(request("DELETE"), context)).status).toBe(400);
    const url = "http://localhost/api/events/event-1/invites?inviteId=invite-1";
    mocks.eventFind.mockResolvedValue(null);
    expect((await DELETE(request("DELETE", undefined, url), context)).status).toBe(404);
    mocks.eventFind.mockResolvedValue({ id: "event-1" });
    mocks.inviteFind.mockResolvedValue(null);
    expect((await DELETE(request("DELETE", undefined, url), context)).status).toBe(404);
    mocks.inviteFind.mockResolvedValue({ id: "invite-1" });
    expect((await DELETE(request("DELETE", undefined, url), context)).status).toBe(200);
    expect(mocks.inviteDelete).toHaveBeenCalledWith({ where: { id: "invite-1" } });
  });
});
