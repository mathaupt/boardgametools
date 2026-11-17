import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), fetch: vi.fn(), atomic: vi.fn(), tags: vi.fn(), versions: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: {} }));
vi.mock("@/lib/services/game.service", () => ({ GameService: { create: vi.fn().mockResolvedValue({ id: "duplicate", name: "BGG Titel", createdAt: new Date(), updatedAt: new Date() }) } }));
vi.mock("@/lib/api-auth", () => ({ apiAuth: m.auth }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (fn: unknown) => fn }));
vi.mock("@/lib/bgg", () => ({ fetchBGGGame: m.fetch }));
vi.mock("@/lib/bgg-import-game", () => ({ createOrReuseBggGame: m.atomic }));
vi.mock("@/lib/services", () => ({ TagService: { syncTags: m.tags } }));
vi.mock("@/lib/cache", () => ({ invalidateTag: vi.fn() }));
vi.mock("@/lib/bgg-versions", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/bgg-versions")>(), getGermanBggVersions: m.versions }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimitAsync: vi.fn().mockResolvedValue({ allowed: true }) }));
import { POST } from "@/app/api/mobile/v1/bgg/import/route";
const game = { id: "existing", name: "Mein Titel", minPlayers: 2, maxPlayers: 4, createdAt: new Date(), updatedAt: new Date(), ownerId: "alice", deletedAt: null };
const request = (body: unknown) => new NextRequest("http://localhost/api/mobile/v1/bgg/import", { method: "POST", body: JSON.stringify(body) });
describe("mobile atomic BGG import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.auth.mockResolvedValue({ user: { id: "alice" } });
    m.fetch.mockResolvedValue({ name: "BGG Titel", minPlayers: 2, maxPlayers: 4, categories: ["Strategie"] });
    m.atomic.mockResolvedValue({ game, created: false });
    m.versions.mockResolvedValue([{ versionId: "42", name: "Deutsch", imageUrl: "https://cf.geekdo-images.com/de.png" }]);
  });
  it("reuses the atomic owned result without overwriting user data or tags", async () => {
    const response = await POST(request({ bggId: "13" }), { params: Promise.resolve({}) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: "existing", name: "Mein Titel" });
    expect(m.atomic).toHaveBeenCalledWith("alice", "13", expect.any(Object));
    expect(m.tags).not.toHaveBeenCalled();
  });
  it("returns 201 for a newly created game and initializes its tags", async () => {
    m.atomic.mockResolvedValue({ game, created: true });
    expect((await POST(request({ bggId: "13", versionId: "42" }), { params: Promise.resolve({}) })).status).toBe(201);
    expect(m.atomic).toHaveBeenCalledWith("alice", "13", expect.objectContaining({ imageUrl: "https://cf.geekdo-images.com/de.png" }));
    expect(m.tags).toHaveBeenCalledWith("alice", "existing", ["Strategie"]);
  });
  it("rejects versions belonging to another game before writing", async () => {
    m.versions.mockResolvedValue([]);
    expect((await POST(request({ bggId: "13", versionId: "42" }), { params: Promise.resolve({}) })).status).toBe(400);
    expect(m.atomic).not.toHaveBeenCalled();
  });
  it.each([null, [], { bggId: "0" }, { bggId: "13", versionId: "oops" }])("rejects malformed input %j", async body => {
    expect((await POST(request(body), { params: Promise.resolve({}) })).status).toBe(400);
    expect(m.atomic).not.toHaveBeenCalled();
  });
  it("requires authentication", async () => {
    m.auth.mockResolvedValue(null);
    expect((await POST(request({ bggId: "13" }), { params: Promise.resolve({}) })).status).toBe(401);
    expect(m.fetch).not.toHaveBeenCalled();
  });
});
