import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    $transaction: vi.fn(),
    apiLog: { create: vi.fn() },
    gameSeries: { findFirst: vi.fn() },
    gameSeriesEntry: { updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/services", () => ({
  SeriesService: {
    list: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
  },
}));

import { GET as listSeries, POST as createSeries } from "@/app/api/mobile/v1/series/route";
import { GET as getSeries, PUT as updateSeries, DELETE as deleteSeries } from "@/app/api/mobile/v1/series/[id]/route";
import { POST as addEntry } from "@/app/api/mobile/v1/series/[id]/entries/route";
import { PUT as updateEntry, DELETE as deleteEntry } from "@/app/api/mobile/v1/series/[id]/entries/[entryId]/route";
import { PUT as reorderEntries } from "@/app/api/mobile/v1/series/[id]/entries/reorder/route";

import { apiAuth } from "@/lib/api-auth";
import { SeriesService } from "@/lib/services";
import prisma from "@/lib/db";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedList = vi.mocked(SeriesService.list);
const mockedCreate = vi.mocked(SeriesService.create);
const mockedGetById = vi.mocked(SeriesService.getById);
const mockedUpdate = vi.mocked(SeriesService.update);
const mockedDelete = vi.mocked(SeriesService.delete);
const mockedAddEntry = vi.mocked(SeriesService.addEntry);
const mockedUpdateEntry = vi.mocked(SeriesService.updateEntry);
const mockedDeleteEntry = vi.mocked(SeriesService.deleteEntry);
const mockedSeriesFindFirst = vi.mocked(prisma.gameSeries.findFirst);
const mockedUpdateMany = vi.mocked(prisma.gameSeriesEntry.updateMany);

function authUser() {
  return { user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } };
}

function req(method: string, url: string, body?: unknown) {
  return new NextRequest(url, { method, body: body ? JSON.stringify(body) : undefined });
}

const sampleSeries = {
  id: "s1",
  name: "EXIT",
  description: null,
  imageUrl: null,
  ownerId: "u1",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
  entries: [],
};

const sampleEntry = {
  id: "e1",
  seriesId: "s1",
  gameId: "g1",
  sortOrder: 0,
  played: false,
  playedAt: null,
  rating: null,
  difficulty: null,
  playTimeMinutes: null,
  successful: null,
  playerCount: null,
  score: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  game: { id: "g1", name: "Catan" },
};

describe("/api/mobile/v1/series", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApiAuth.mockResolvedValue(authUser() as never);
  });

  it("GET lists series", async () => {
    mockedList.mockResolvedValue([sampleSeries] as never);

    const res = await listSeries(req("GET", "http://localhost:3000/api/mobile/v1/series"), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([sampleSeries]);
  });

  it("POST creates a series", async () => {
    mockedCreate.mockResolvedValue(sampleSeries as never);

    const res = await createSeries(req("POST", "http://localhost:3000/api/mobile/v1/series", { name: "EXIT" }), {});
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(sampleSeries);
  });

  it("GET /:id returns a series", async () => {
    mockedGetById.mockResolvedValue({ ...sampleSeries, entries: [sampleEntry] } as never);

    const res = await getSeries(req("GET", "http://localhost:3000/api/mobile/v1/series/s1"), { params: Promise.resolve({ id: "s1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("s1");
  });

  it("PUT /:id updates a series", async () => {
    mockedUpdate.mockResolvedValue({ ...sampleSeries, name: "EXIT 2" } as never);

    const res = await updateSeries(
      req("PUT", "http://localhost:3000/api/mobile/v1/series/s1", { name: "EXIT 2" }),
      { params: Promise.resolve({ id: "s1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe("EXIT 2");
  });

  it("DELETE /:id deletes a series", async () => {
    mockedDelete.mockResolvedValue({ message: "Series deleted" } as never);

    const res = await deleteSeries(req("DELETE", "http://localhost:3000/api/mobile/v1/series/s1"), { params: Promise.resolve({ id: "s1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Series deleted");
  });

  it("POST /:id/entries adds an entry", async () => {
    mockedAddEntry.mockResolvedValue(sampleEntry as never);

    const res = await addEntry(
      req("POST", "http://localhost:3000/api/mobile/v1/series/s1/entries", { gameId: "g1" }),
      { params: Promise.resolve({ id: "s1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.gameId).toBe("g1");
  });

  it("PUT /:id/entries/:entryId updates an entry", async () => {
    mockedUpdateEntry.mockResolvedValue({ ...sampleEntry, played: true } as never);

    const res = await updateEntry(
      req("PUT", "http://localhost:3000/api/mobile/v1/series/s1/entries/e1", { played: true }),
      { params: Promise.resolve({ id: "s1", entryId: "e1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.played).toBe(true);
  });

  it("DELETE /:id/entries/:entryId removes an entry", async () => {
    mockedDeleteEntry.mockResolvedValue({ message: "Entry deleted" } as never);

    const res = await deleteEntry(
      req("DELETE", "http://localhost:3000/api/mobile/v1/series/s1/entries/e1"),
      { params: Promise.resolve({ id: "s1", entryId: "e1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Entry deleted");
  });

  it("PUT /:id/entries/reorder updates sortOrder", async () => {
    mockedSeriesFindFirst.mockResolvedValue({ id: "s1" } as never);
    mockedUpdateMany.mockResolvedValue({ count: 1 } as never);

    const res = await reorderEntries(
      req("PUT", "http://localhost:3000/api/mobile/v1/series/s1/entries/reorder", {
        entries: [{ id: "e1", sortOrder: 1 }, { id: "e2", sortOrder: 0 }],
      }),
      { params: Promise.resolve({ id: "s1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Reordered");
  });

  it("returns 401 when not authenticated", async () => {
    mockedApiAuth.mockResolvedValue(null as never);

    const res = await listSeries(req("GET", "http://localhost:3000/api/mobile/v1/series"), {});
    expect(res.status).toBe(401);
  });
});
