import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Auth/Next mocks (prevent ESM import chain from require-auth) ─
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));

// ── Mocks ────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  default: {
    game: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    tag: { upsert: vi.fn() },
    gameTag: { create: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_fn: () => Promise<unknown>, _keys: string[], _opts?: unknown) => _fn()),
  invalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-tags", () => ({
  CacheTags: {
    userGames: (id: string) => `games-${id}`,
    userTags: (id: string) => `tags-${id}`,
    userDashboard: (id: string) => `dash-${id}`,
    userStats: (id: string) => `stats-${id}`,
  },
}));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
  validateNumber: vi.fn(() => null),
  firstError: vi.fn((...args: unknown[]) => args.find(Boolean) || null),
}));

// ── Imports (after mocks) ────────────────────────────────────────

import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { firstError } from "@/lib/validation";
import { GameService } from "@/lib/services/game.service";
import { ApiError } from "@/lib/require-auth";

// ── Helpers ──────────────────────────────────────────────────────

const USER_ID = "user-1";
const GAME_ID = "game-1";

const fakeGame = {
  id: GAME_ID,
  name: "Catan",
  ownerId: USER_ID,
  _count: { sessions: 3 },
  tags: [],
};

// ── Tests ────────────────────────────────────────────────────────

describe("GameService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── list ─────────────────────────────────────────────────────

  describe("list", () => {
    it("returns all games (non-paginated, via cache)", async () => {
      vi.mocked(prisma.game.findMany).mockResolvedValue([fakeGame] as never);

      const result = await GameService.list(USER_ID);

      expect(prisma.game.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: USER_ID, deletedAt: null },
          orderBy: { name: "asc" },
        })
      );
      expect(result).toEqual([fakeGame]);
    });

    it("returns paginated result when page/limit provided", async () => {
      const games = [fakeGame];
      vi.mocked(prisma.game.findMany).mockResolvedValue(games as never);
      vi.mocked(prisma.game.count).mockResolvedValue(1);

      const result = await GameService.list(USER_ID, { page: 1, limit: 10 });

      expect(prisma.game.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
      expect(prisma.game.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: games,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  // ── getById ──────────────────────────────────────────────────

  describe("getById", () => {
    it("returns game with includes", async () => {
      vi.mocked(prisma.game.findFirst).mockResolvedValue(fakeGame as never);

      const result = await GameService.getById(USER_ID, GAME_ID);

      expect(prisma.game.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: GAME_ID, ownerId: USER_ID, deletedAt: null },
        })
      );
      expect(result).toEqual(fakeGame);
    });

    it("throws ApiError(404) when not found", async () => {
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null as never);

      await expect(GameService.getById(USER_ID, "nope")).rejects.toThrow(ApiError);
      await expect(GameService.getById(USER_ID, "nope")).rejects.toThrow("Game not found");
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe("create", () => {
    it("creates game with tags and invalidates caches", async () => {
      const createdGame = { id: GAME_ID, name: "Catan", ownerId: USER_ID };
      const tagRecord = { id: "tag-1", name: "Strategy" };
      const fullGame = { ...createdGame, tags: [{ tag: tagRecord }] };

      vi.mocked(prisma.game.create).mockResolvedValue(createdGame as never);
      vi.mocked(prisma.tag.upsert).mockResolvedValue(tagRecord as never);
      vi.mocked(prisma.gameTag.create).mockResolvedValue({} as never);
      vi.mocked(prisma.game.findUnique).mockResolvedValue(fullGame as never);

      const result = await GameService.create(USER_ID, {
        name: "Catan",
        tagNames: ["Strategy"],
      });

      expect(prisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: "Catan", ownerId: USER_ID }),
      });
      expect(prisma.tag.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.gameTag.create).toHaveBeenCalledWith({
        data: { gameId: GAME_ID, tagId: "tag-1" },
      });
      expect(prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: GAME_ID },
        include: { tags: { include: { tag: true } } },
      });
      expect(invalidateTag).toHaveBeenCalledTimes(4);
      expect(result).toEqual(fullGame);
    });

    it("throws ApiError(400) on validation error", async () => {
      vi.mocked(firstError).mockReturnValueOnce("Name is required" as never);

      await expect(
        GameService.create(USER_ID, { name: "" })
      ).rejects.toThrow(ApiError);

      vi.mocked(firstError).mockReturnValueOnce("Name is required" as never);

      await expect(
        GameService.create(USER_ID, { name: "" })
      ).rejects.toThrow("Name is required");

      expect(prisma.game.create).not.toHaveBeenCalled();
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe("update", () => {
    it("updates game and syncs tags", async () => {
      const existing = { id: GAME_ID, name: "Catan", ownerId: USER_ID };
      const updatedGame = { ...existing, name: "Catan: 5-6 Players" };
      const tagRecord = { id: "tag-2", name: "Expansion" };
      const fullGame = { ...updatedGame, tags: [{ tag: tagRecord }], _count: { sessions: 0 } };

      vi.mocked(prisma.game.findFirst).mockResolvedValue(existing as never);
      vi.mocked(prisma.game.update).mockResolvedValue(updatedGame as never);
      vi.mocked(prisma.gameTag.deleteMany).mockResolvedValue({ count: 0 } as never);
      vi.mocked(prisma.tag.upsert).mockResolvedValue(tagRecord as never);
      vi.mocked(prisma.gameTag.create).mockResolvedValue({} as never);
      vi.mocked(prisma.game.findUnique).mockResolvedValue(fullGame as never);

      const result = await GameService.update(USER_ID, GAME_ID, {
        name: "Catan: 5-6 Players",
        tagNames: ["Expansion"],
      });

      expect(prisma.game.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: GAME_ID, ownerId: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: GAME_ID },
        data: expect.objectContaining({ name: "Catan: 5-6 Players" }),
      });
      expect(prisma.gameTag.deleteMany).toHaveBeenCalledWith({ where: { gameId: GAME_ID } });
      expect(prisma.tag.upsert).toHaveBeenCalledTimes(1);
      expect(invalidateTag).toHaveBeenCalledTimes(4);
      expect(result).toEqual(fullGame);
    });

    it("throws ApiError(404) when game not found", async () => {
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null as never);

      await expect(
        GameService.update(USER_ID, "nope", { name: "X" })
      ).rejects.toThrow(ApiError);

      await expect(
        GameService.update(USER_ID, "nope", { name: "X" })
      ).rejects.toThrow("Game not found");
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe("delete", () => {
    it("soft-deletes game and invalidates caches", async () => {
      vi.mocked(prisma.game.findFirst).mockResolvedValue(fakeGame as never);
      vi.mocked(prisma.game.update).mockResolvedValue({} as never);

      const result = await GameService.delete(USER_ID, GAME_ID);

      expect(prisma.game.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: GAME_ID, ownerId: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: GAME_ID },
        data: { deletedAt: expect.any(Date) },
      });
      expect(invalidateTag).toHaveBeenCalledTimes(4);
      expect(result).toEqual({ message: "Game deleted" });
    });

    it("throws ApiError(404) when not found", async () => {
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null as never);

      await expect(GameService.delete(USER_ID, "nope")).rejects.toThrow(ApiError);
      await expect(GameService.delete(USER_ID, "nope")).rejects.toThrow("Game not found");
    });
  });

  // ── bulkDelete ───────────────────────────────────────────────

  describe("bulkDelete", () => {
    it("deletes multiple games and invalidates caches", async () => {
      vi.mocked(prisma.game.updateMany).mockResolvedValue({ count: 3 } as never);

      const ids = ["g1", "g2", "g3"];
      const result = await GameService.bulkDelete(USER_ID, ids);

      expect(prisma.game.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ids }, ownerId: USER_ID, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(invalidateTag).toHaveBeenCalledTimes(4);
      expect(result).toEqual({ deleted: 3 });
    });

    it("throws ApiError(400) on empty array", async () => {
      await expect(GameService.bulkDelete(USER_ID, [])).rejects.toThrow(ApiError);
      await expect(GameService.bulkDelete(USER_ID, [])).rejects.toThrow(
        "gameIds must be a non-empty array"
      );
    });
  });

  // ── _invalidateGameCaches ────────────────────────────────────

  describe("_invalidateGameCaches", () => {
    it("invalidates all four cache tags", () => {
      GameService._invalidateGameCaches(USER_ID);

      expect(invalidateTag).toHaveBeenCalledWith(`games-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledWith(`tags-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledWith(`dash-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledWith(`stats-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledTimes(4);
    });
  });
});
