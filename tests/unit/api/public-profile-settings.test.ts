import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), get: vi.fn(), update: vi.fn(), error: vi.fn(), json: vi.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({ body, status: init?.status ?? 200, headers: init?.headers })) }));
vi.mock("next/server", () => ({ NextResponse: { json: mocks.json } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.auth, handleApiError: mocks.error }));
vi.mock("@/lib/services/profile.service", () => ({ ProfileService: { getSharingSettings: mocks.get, updateSharingSettings: mocks.update } }));

import { GET, PATCH } from "@/app/api/users/me/public-profile/route";

describe("/api/users/me/public-profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.get.mockResolvedValue({ enabled: false, featuredBadgeIds: [], shareUrl: null, earnedBadges: [] });
    mocks.update.mockResolvedValue({ enabled: true, featuredBadgeIds: ["first-session"], shareUrl: "https://example.invalid/profile/token" });
  });

  it("returns private, non-cacheable settings for the current user", async () => {
    const response = await GET();
    expect(mocks.get).toHaveBeenCalledWith("user-1");
    expect(response).toMatchObject({ headers: { "Cache-Control": "private, no-store" } });
  });

  it("rejects invalid update input before changing data", async () => {
    const response = await PATCH(new Request("http://localhost/api/users/me/public-profile", { method: "PATCH", body: JSON.stringify({ enabled: true, featuredBadgeIds: [1] }) }) as never);
    expect(response).toMatchObject({ status: 400 });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates only the authenticated user's sharing settings", async () => {
    const response = await PATCH(new Request("http://localhost/api/users/me/public-profile", { method: "PATCH", body: JSON.stringify({ enabled: true, featuredBadgeIds: ["first-session"], rotate: true }) }) as never);
    expect(mocks.update).toHaveBeenCalledWith("user-1", { enabled: true, featuredBadgeIds: ["first-session"], rotate: true });
    expect(response).toMatchObject({ status: 200 });
  });
});
