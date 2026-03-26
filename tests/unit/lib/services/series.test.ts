import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Auth/Next mocks (prevent ESM import chain from require-auth) ─
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));

// ── Mocks ────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  default: {
    gameSeries: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    game: { findFirst: vi.fn() },
    gameSeriesEntry: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fns: unknown[]) => Promise.all(fns)),
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_fn: () => Promise<unknown>, _keys: string[], _opts?: unknown) => _fn()),
  invalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-tags", () => ({
  CacheTags: {
    userSeries: (id: string) => `series-${id}`,
  },
}));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
  firstError: vi.fn((...args: unknown[]) => args.find(Boolean) || null),
}));

// ── Imports (after mocks) ────────────────────────────────────────

import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { firstError } from "@/lib/validation";
import { SeriesService } from "@/lib/services/series.service";
import { ApiError } from "@/lib/require-auth";

// ── Helpers ──────────────────────────────────────────────────────

const USER_ID = "user-1";
const SERIES_ID = "series-1";
const ENTRY_ID = "entry-1";
const GAME_ID = "game-1";

const fakeSeries = {
  id: SERIES_ID,
  name: "EXIT Games",
  ownerId: USER_ID,
  entries: [
    { id: ENTRY_ID, gameId: GAME_ID, sortOrder: 0, played: true, game: { imageUrl: null } },
    { id: "entry-2", gameId: "game-2", sortOrder: 1, played: false, game: { imageUrl: null } },
  ],
};

const fakeGame = { id: GAME_ID, name: "Catan", ownerId: USER_ID };

const fakeEntry = {
  id: ENTRY_ID,
  seriesId: SERIES_ID,
  gameId: GAME_ID,
  sortOrder: 0,
  played: false,
  game: fakeGame,
};

// ── Tests ────────────────────────────────────────────────────────

describe("SeriesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── list ─────────────────────────────────────────────────────

  describe("list", () => {
    it("returns all series with _count (entries, played)", async () => {
      vi.mocked(prisma.gameSeries.findMany).mockResolvedValue([fakeSeries] as never);

      const result = await SeriesService.list(USER_ID);

      expect(prisma.gameSeries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: USER_ID, deletedAt: null },
          orderBy: { name: "asc" },
        })
      );
      expect(result).toEqual([
        expect.objectContaining({
          id: SERIES_ID,
          name: "EXIT Games",
          _count: { entries: 2, played: 1 },
        }),
      ]);
    });
  });

  // ── getById ──────────────────────────────────────────────────

  describe("getById", () => {
    it("returns series with entries", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);

      const result = await SeriesService.getById(USER_ID, SERIES_ID);

      expect(prisma.gameSeries.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: SERIES_ID, ownerId: USER_ID, deletedAt: null },
        })
      );
      expect(result).toEqual(fakeSeries);
    });

    it("throws ApiError(404) when not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(null as never);

      await expect(SeriesService.getById(USER_ID, "nope")).rejects.toThrow(ApiError);
      await expect(SeriesService.getById(USER_ID, "nope")).rejects.toThrow("Series not found");
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe("create", () => {
    it("creates series and invalidates cache", async () => {
      const createdSeries = { id: SERIES_ID, name: "EXIT Games", ownerId: USER_ID };
      vi.mocked(prisma.gameSeries.create).mockResolvedValue(createdSeries as never);

      const result = await SeriesService.create(USER_ID, { name: "EXIT Games" });

      expect(prisma.gameSeries.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: "EXIT Games", ownerId: USER_ID }),
      });
      expect(invalidateTag).toHaveBeenCalledWith(`series-${USER_ID}`);
      expect(result).toEqual(createdSeries);
    });

    it("throws ApiError(400) on validation error", async () => {
      vi.mocked(firstError).mockReturnValueOnce("Name is required" as never);

      await expect(
        SeriesService.create(USER_ID, { name: "" })
      ).rejects.toThrow(ApiError);

      vi.mocked(firstError).mockReturnValueOnce("Name is required" as never);

      await expect(
        SeriesService.create(USER_ID, { name: "" })
      ).rejects.toThrow("Name is required");

      expect(prisma.gameSeries.create).not.toHaveBeenCalled();
    });

    it("throws ApiError(400) when name is blank (secondary check)", async () => {
      await expect(
        SeriesService.create(USER_ID, { name: "   " })
      ).rejects.toThrow(ApiError);

      await expect(
        SeriesService.create(USER_ID, { name: "   " })
      ).rejects.toThrow("Name is required");

      expect(prisma.gameSeries.create).not.toHaveBeenCalled();
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe("update", () => {
    it("updates series and invalidates cache", async () => {
      const existing = { id: SERIES_ID, name: "EXIT Games", ownerId: USER_ID };
      const updatedSeries = { ...existing, name: "EXIT Games v2", entries: [] };

      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(existing as never);
      vi.mocked(prisma.gameSeries.update).mockResolvedValue(updatedSeries as never);

      const result = await SeriesService.update(USER_ID, SERIES_ID, { name: "EXIT Games v2" });

      expect(prisma.gameSeries.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: SERIES_ID, ownerId: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.gameSeries.update).toHaveBeenCalledWith({
        where: { id: SERIES_ID },
        data: expect.objectContaining({ name: "EXIT Games v2" }),
        include: expect.any(Object),
      });
      expect(invalidateTag).toHaveBeenCalledWith(`series-${USER_ID}`);
      expect(result).toEqual(updatedSeries);
    });

    it("throws ApiError(404) when series not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(null as never);

      await expect(
        SeriesService.update(USER_ID, "nope", { name: "X" })
      ).rejects.toThrow(ApiError);

      await expect(
        SeriesService.update(USER_ID, "nope", { name: "X" })
      ).rejects.toThrow("Series not found");
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe("delete", () => {
    it("soft-deletes series and invalidates cache", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.gameSeries.update).mockResolvedValue({} as never);

      const result = await SeriesService.delete(USER_ID, SERIES_ID);

      expect(prisma.gameSeries.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: SERIES_ID, ownerId: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.gameSeries.update).toHaveBeenCalledWith({
        where: { id: SERIES_ID },
        data: { deletedAt: expect.any(Date) },
      });
      expect(invalidateTag).toHaveBeenCalledWith(`series-${USER_ID}`);
      expect(result).toEqual({ message: "Series deleted" });
    });

    it("throws ApiError(404) when not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(null as never);

      await expect(SeriesService.delete(USER_ID, "nope")).rejects.toThrow(ApiError);
      await expect(SeriesService.delete(USER_ID, "nope")).rejects.toThrow("Series not found");
    });
  });

  // ── addEntry ─────────────────────────────────────────────────

  describe("addEntry", () => {
    it("adds entry with auto-calculated sortOrder and invalidates cache", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.game.findFirst).mockResolvedValue(fakeGame as never);
      vi.mocked(prisma.gameSeriesEntry.findFirst).mockResolvedValue(null as never);
      vi.mocked(prisma.gameSeriesEntry.create).mockResolvedValue(fakeEntry as never);

      const result = await SeriesService.addEntry(USER_ID, SERIES_ID, { gameId: GAME_ID });

      expect(prisma.gameSeries.findFirst).toHaveBeenCalled();
      expect(prisma.game.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: GAME_ID, ownerId: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.gameSeriesEntry.create).toHaveBeenCalledWith({
        data: { seriesId: SERIES_ID, gameId: GAME_ID, sortOrder: 0 },
        include: { game: true },
      });
      expect(invalidateTag).toHaveBeenCalledWith(`series-${USER_ID}`);
      expect(result).toEqual(fakeEntry);
    });

    it("throws ApiError(404) when series not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(null as never);

      await expect(
        SeriesService.addEntry(USER_ID, "nope", { gameId: GAME_ID })
      ).rejects.toThrow(ApiError);
      await expect(
        SeriesService.addEntry(USER_ID, "nope", { gameId: GAME_ID })
      ).rejects.toThrow("Series not found");
    });

    it("throws ApiError(404) when game not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null as never);

      await expect(
        SeriesService.addEntry(USER_ID, SERIES_ID, { gameId: "nope" })
      ).rejects.toThrow(ApiError);
      await expect(
        SeriesService.addEntry(USER_ID, SERIES_ID, { gameId: "nope" })
      ).rejects.toThrow("Game not found");
    });
  });

  // ── updateEntry ──────────────────────────────────────────────

  describe("updateEntry", () => {
    it("updates entry and invalidates cache", async () => {
      const updatedEntry = { ...fakeEntry, played: true };

      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.gameSeriesEntry.findFirst).mockResolvedValue(fakeEntry as never);
      vi.mocked(prisma.gameSeriesEntry.update).mockResolvedValue(updatedEntry as never);

      const result = await SeriesService.updateEntry(USER_ID, SERIES_ID, ENTRY_ID, { played: true });

      expect(prisma.gameSeriesEntry.update).toHaveBeenCalledWith({
        where: { id: ENTRY_ID },
        data: expect.objectContaining({ played: true }),
        include: { game: true },
      });
      expect(invalidateTag).toHaveBeenCalledWith(`series-${USER_ID}`);
      expect(result).toEqual(updatedEntry);
    });

    it("throws ApiError(404) when series not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(null as never);

      await expect(
        SeriesService.updateEntry(USER_ID, "nope", ENTRY_ID, { played: true })
      ).rejects.toThrow(ApiError);
      await expect(
        SeriesService.updateEntry(USER_ID, "nope", ENTRY_ID, { played: true })
      ).rejects.toThrow("Series not found");
    });

    it("throws ApiError(404) when entry not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.gameSeriesEntry.findFirst).mockResolvedValue(null as never);

      await expect(
        SeriesService.updateEntry(USER_ID, SERIES_ID, "nope", { played: true })
      ).rejects.toThrow(ApiError);
      await expect(
        SeriesService.updateEntry(USER_ID, SERIES_ID, "nope", { played: true })
      ).rejects.toThrow("Entry not found");
    });
  });

  // ── deleteEntry ──────────────────────────────────────────────

  describe("deleteEntry", () => {
    it("deletes entry and invalidates cache", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.gameSeriesEntry.findFirst).mockResolvedValue(fakeEntry as never);
      vi.mocked(prisma.gameSeriesEntry.delete).mockResolvedValue(fakeEntry as never);

      const result = await SeriesService.deleteEntry(USER_ID, SERIES_ID, ENTRY_ID);

      expect(prisma.gameSeriesEntry.delete).toHaveBeenCalledWith({ where: { id: ENTRY_ID } });
      expect(invalidateTag).toHaveBeenCalledWith(`series-${USER_ID}`);
      expect(result).toEqual({ message: "Entry deleted" });
    });

    it("throws ApiError(404) when entry not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.gameSeriesEntry.findFirst).mockResolvedValue(null as never);

      await expect(
        SeriesService.deleteEntry(USER_ID, SERIES_ID, "nope")
      ).rejects.toThrow(ApiError);
      await expect(
        SeriesService.deleteEntry(USER_ID, SERIES_ID, "nope")
      ).rejects.toThrow("Entry not found");
    });
  });

  // ── reorderEntries ───────────────────────────────────────────

  describe("reorderEntries", () => {
    it("reorders entries via $transaction and invalidates cache", async () => {
      const entryIds = [ENTRY_ID, "entry-2"];

      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.gameSeriesEntry.count).mockResolvedValue(2 as never);
      vi.mocked(prisma.gameSeriesEntry.update).mockResolvedValue({} as never);

      const result = await SeriesService.reorderEntries(USER_ID, SERIES_ID, entryIds);

      expect(prisma.gameSeriesEntry.count).toHaveBeenCalledWith({
        where: { id: { in: entryIds }, seriesId: SERIES_ID },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(invalidateTag).toHaveBeenCalledWith(`series-${USER_ID}`);
      expect(result).toEqual({ message: "Entries reordered" });
    });

    it("throws ApiError(404) when series not found", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(null as never);

      await expect(
        SeriesService.reorderEntries(USER_ID, "nope", [ENTRY_ID])
      ).rejects.toThrow(ApiError);
      await expect(
        SeriesService.reorderEntries(USER_ID, "nope", [ENTRY_ID])
      ).rejects.toThrow("Series not found");
    });

    it("throws ApiError(400) when entryIds don't match series entries", async () => {
      vi.mocked(prisma.gameSeries.findFirst).mockResolvedValue(fakeSeries as never);
      vi.mocked(prisma.gameSeriesEntry.count).mockResolvedValue(1 as never);

      await expect(
        SeriesService.reorderEntries(USER_ID, SERIES_ID, [ENTRY_ID, "entry-2"])
      ).rejects.toThrow(ApiError);
      await expect(
        SeriesService.reorderEntries(USER_ID, SERIES_ID, [ENTRY_ID, "entry-2"])
      ).rejects.toThrow("Invalid entry IDs");
    });
  });
});
