import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  gameSession: { count: vi.fn(), groupBy: vi.fn() },
  gameSeries: { count: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ default: db }));

import { ProfileService } from "@/lib/services/profile.service";
import { createProfileNonce, deriveProfileToken, hashProfileToken } from "@/lib/gamification/profile-token";

describe("ProfileService public projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.gameSession.count.mockResolvedValue(1);
    db.gameSession.groupBy.mockResolvedValue([{ gameId: "game-1" }]);
    db.gameSeries.count.mockResolvedValue(0);
  });

  it("returns a generic miss for malformed, disabled, revoked, and unknown share tokens", async () => {
    db.user.findFirst.mockResolvedValue(null);
    await expect(ProfileService.getPublicProfile("not-a-token")).resolves.toBeNull();
    await expect(ProfileService.getPublicProfile(deriveProfileToken("unknown", createProfileNonce()))).resolves.toBeNull();
    expect(db.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ publicProfileEnabled: true }) }));
  });

  it("projects only the display name, selected earned badges, and aggregate counts", async () => {
    const token = deriveProfileToken("user-1", createProfileNonce());
    db.user.findFirst.mockResolvedValue({ id: "user-1", name: "Spielerin", publicProfileFeaturedBadgeIds: ["first-session", "sessions-10"] });
    const profile = await ProfileService.getPublicProfile(token);
    expect(profile).toEqual({
      name: "Spielerin",
      badges: [expect.objectContaining({ id: "first-session" })],
      totals: { sessions: 1, gamesPlayed: 1, seriesCompleted: 0 },
    });
    expect(JSON.stringify(profile)).not.toMatch(/email|group|event|note|sessionId|userId/i);
    expect(db.user.findFirst).toHaveBeenCalledWith({
      where: { publicProfileTokenHash: hashProfileToken(token), publicProfileEnabled: true },
      select: { id: true, name: true, publicProfileFeaturedBadgeIds: true },
    });
  });

  it("rotates access with a fresh nonce and accepts only earned featured badges", async () => {
    vi.stubEnv("NEXTAUTH_SECRET", "profile-service-test-secret");
    db.user.findUnique.mockResolvedValue({ publicProfileTokenNonce: "old-nonce", publicProfileTokenHash: "old-hash" });
    await ProfileService.updateSharingSettings("user-1", { enabled: true, featuredBadgeIds: ["first-session", "sessions-10", "unknown"], rotate: true });
    const data = vi.mocked(db.user.update).mock.calls[0][0].data;
    expect(data.publicProfileTokenNonce).not.toBe("old-nonce");
    expect(data.publicProfileTokenHash).toBe(hashProfileToken(deriveProfileToken("user-1", data.publicProfileTokenNonce as string)));
    expect(data.publicProfileFeaturedBadgeIds).toEqual(["first-session"]);
    vi.unstubAllEnvs();
  });

  it("revokes the public URL and clears the bearer-token verifier", async () => {
    await ProfileService.updateSharingSettings("user-1", { enabled: false, featuredBadgeIds: [] });
    expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ publicProfileEnabled: false, publicProfileTokenHash: null, publicProfileTokenNonce: null }) }));
  });
});
