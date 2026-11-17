import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), versions: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/api-auth", () => ({ apiAuth: m.auth }));
vi.mock("@/lib/db", () => ({ default: { game: { findMany: m.find } } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (fn: unknown) => fn }));
vi.mock("@/lib/bgg-versions", async original => ({ ...await original<typeof import("@/lib/bgg-versions")>(), getGermanBggVersions: m.versions }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimitAsync: vi.fn().mockResolvedValue({ allowed: true }) }));
import { POST } from "@/app/api/mobile/v1/bgg/presence/route";
import { GET } from "@/app/api/mobile/v1/bgg/[id]/versions/route";
const request = (body: unknown) => new NextRequest("http://localhost/api/mobile/v1/bgg/presence", { method: "POST", body: JSON.stringify(body) });
describe("private mobile catalog", () => {
  beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ user: { id: "alice" } }); m.find.mockResolvedValue([{ id: "mine", name: "Mein Spiel", bggId: "13" }]); m.versions.mockResolvedValue([]); });
  it("returns complete own presence including explicit absence", async () => {
    const response = await POST(request({ bggIds: ["13", "42"] }), { params: Promise.resolve({}) });
    expect(await response.json()).toEqual({ matches: { "13": { id: "mine", name: "Mein Spiel" }, "42": null } });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: "alice", deletedAt: null, bggId: { in: ["13", "42"] } } }));
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it.each([[], Array(51).fill("13"), ["bad"]])("rejects unbounded or invalid IDs", async bggIds => {
    expect((await POST(request({ bggIds }), { params: Promise.resolve({}) })).status).toBe(400);
    expect(m.find).not.toHaveBeenCalled();
  });
  it("requires auth for presence and versions", async () => {
    m.auth.mockResolvedValue(null);
    expect((await POST(request({ bggIds: ["13"] }), { params: Promise.resolve({}) })).status).toBe(401);
    expect((await GET(new NextRequest("http://localhost"), { params: Promise.resolve({ id: "13" }) })).status).toBe(401);
  });
  it("loads only validated German versions", async () => {
    const response = await GET(new NextRequest("http://localhost"), { params: Promise.resolve({ id: "13" }) });
    expect(response.status).toBe(200);
    expect(m.versions).toHaveBeenCalledWith("13", expect.any(AbortSignal));
    expect((await GET(new NextRequest("http://localhost"), { params: Promise.resolve({ id: "x" }) })).status).toBe(400);
  });
});
