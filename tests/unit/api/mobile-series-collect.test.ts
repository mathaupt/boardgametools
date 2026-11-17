import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), entry: vi.fn(), update: vi.fn(), atomic: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/api-auth", () => ({ apiAuth: m.auth }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (fn: unknown) => fn }));
vi.mock("@/lib/cache", () => ({ invalidateTag: vi.fn() }));
vi.mock("@/lib/bgg-import-game", () => ({ createOrReuseBggGame: m.atomic }));
vi.mock("@/lib/db", () => ({ default: { gameSeriesEntry: { findFirst: m.entry, update: m.update } } }));
import { POST } from "@/app/api/mobile/v1/series/[id]/entries/[entryId]/collection/route";
const ctx = { params: Promise.resolve({ id: "series", entryId: "entry" }) };
const req = () => new NextRequest("http://localhost/api/mobile/v1/series/series/entries/entry/collection", { method: "POST" });
describe("native collection adoption", () => {
  beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ user: { id: "alice" } }); m.entry.mockResolvedValue({ id: "entry", gameId: null, bggId: "13", gameName: "EXIT", minPlayers: 1, maxPlayers: 4 }); m.atomic.mockResolvedValue({ game: { id: "owned" }, created: false }); m.update.mockResolvedValue({ id: "entry" }); });
  it("links an owned game without changing history or rating", async () => {
    expect((await POST(req(), ctx)).status).toBe(200);
    expect(m.atomic).toHaveBeenCalledWith("alice", "13", expect.objectContaining({ name: "EXIT" }));
    expect(m.update).toHaveBeenCalledWith({ where: { id: "entry" }, data: { gameId: "owned", source: "COLLECTION" } });
  });
  it("protects account and series boundaries", async () => {
    m.entry.mockResolvedValue(null);
    expect((await POST(req(), ctx)).status).toBe(404);
    expect(m.entry).toHaveBeenCalledWith({ where: { id: "entry", seriesId: "series", series: { ownerId: "alice", deletedAt: null } } });
    expect(m.atomic).not.toHaveBeenCalled();
  });
  it("requires authentication", async () => {
    m.auth.mockResolvedValue(null);
    expect((await POST(req(), ctx)).status).toBe(401);
    expect(m.entry).not.toHaveBeenCalled();
  });
});
