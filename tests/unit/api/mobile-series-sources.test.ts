import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), series: vi.fn(), find: vi.fn(), create: vi.fn(), game: vi.fn(), bgg: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/api-auth", () => ({ apiAuth: m.auth }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (fn: unknown) => fn }));
vi.mock("@/lib/cache", () => ({ invalidateTag: vi.fn() }));
vi.mock("@/lib/bgg", () => ({ fetchBGGGame: m.bgg }));
vi.mock("@/lib/services", () => ({ SeriesService: { addEntry: vi.fn().mockResolvedValue({ id: "old", gameId: "game" }) } }));
vi.mock("@/lib/db", () => ({ default: { gameSeries: { findFirst: m.series }, gameSeriesEntry: { findFirst: m.find, findUnique: m.find, create: m.create }, game: { findFirst: m.game } } }));
import { POST } from "@/app/api/mobile/v1/series/[id]/entries/route";
const ctx = { params: Promise.resolve({ id: "series" }) };
const request = (body: unknown) => new NextRequest("http://localhost/api/mobile/v1/series/series/entries", { method: "POST", body: JSON.stringify(body) });
describe("native series sources", () => {
  beforeEach(() => {
    vi.clearAllMocks(); m.auth.mockResolvedValue({ user: { id: "alice" } }); m.series.mockResolvedValue({ id: "series" }); m.find.mockResolvedValue(null);
    m.bgg.mockResolvedValue({ name: "EXIT", minPlayers: 1, maxPlayers: 4 });
    m.create.mockImplementation(({ data }: { data: object }) => ({ ...data, id: "entry", createdAt: new Date(), updatedAt: new Date(), game: null }));
  });
  it("creates a temporary snapshot without collection ownership", async () => {
    const response = await POST(request({ kind: "temporary", bggId: "13", reason: "BORROWED" }), ctx);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ gameId: "temporary:entry", collectionGameId: null, gameName: "EXIT", source: "TEMPORARY_BGG" });
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ gameId: null, source: "TEMPORARY_BGG", temporaryReason: "BORROWED" }) }));
  });
  it("rejects duplicate BGG identities", async () => {
    m.find.mockResolvedValue({ id: "existing" });
    expect((await POST(request({ kind: "temporary", bggId: "13" }), ctx)).status).toBe(409);
    expect(m.create).not.toHaveBeenCalled();
  });
  it("validates source and enforces own active series", async () => {
    expect((await POST(request({ kind: "bad", bggId: "13" }), ctx)).status).toBe(400);
    m.series.mockResolvedValue(null);
    expect((await POST(request({ kind: "temporary", bggId: "13" }), ctx)).status).toBe(404);
    expect(m.series).toHaveBeenCalledWith({ where: { id: "series", ownerId: "alice", deletedAt: null } });
  });
});

it("preserves the existing mobile explicit sortOrder contract", async () => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ user: { id: "alice" } }); m.series.mockResolvedValue({ id: "series" }); m.find.mockResolvedValue(null);
  m.bgg.mockResolvedValue({ name: "EXIT", minPlayers: 1, maxPlayers: 4 });
  m.create.mockResolvedValue({ id: "entry", gameId: null });
  expect((await POST(request({ kind: "temporary", bggId: "13", sortOrder: 7 }), ctx)).status).toBe(201);
  expect(m.create).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ sortOrder: 7 }) }));
});

it.each([-1, 10000, "7", 1.5])("rejects invalid explicit sortOrder %j", async sortOrder => {
  m.auth.mockResolvedValue({ user: { id: "alice" } }); m.series.mockResolvedValue({ id: "series" });
  expect((await POST(request({ kind: "temporary", bggId: "13", sortOrder }), ctx)).status).toBe(400);
});
