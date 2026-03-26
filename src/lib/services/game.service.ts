import prisma from "@/lib/db";
import { cachedQuery, invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { ApiError } from "@/lib/require-auth";
import { validateString, validateNumber, firstError } from "@/lib/validation";
import { NOT_DELETED, SAFE_USER_SELECT, buildPagination, paginatedResponse } from "./shared";
import { TagService } from "./tag.service";

// ── Types ────────────────────────────────────────────────────────

export interface CreateGameInput {
  name: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playTimeMinutes?: number;
  complexity?: number;
  bggId?: string;
  ean?: string;
  imageUrl?: string;
  tagNames?: string[];
}

export type UpdateGameInput = Partial<CreateGameInput>

// ── Service ──────────────────────────────────────────────────────

export const GameService = {
  /** List games for a user (optionally paginated) */
  async list(userId: string, opts?: { page?: number; limit?: number; include?: string }) {
    const where = { ownerId: userId, ...NOT_DELETED };
    const { page, limit, isPaginated, skip } = buildPagination(opts);
    const include = opts?.include;

    if (isPaginated) {
      const [games, total] = await Promise.all([
        prisma.game.findMany({
          where,
          orderBy: { name: "asc" },
          include: {
            _count: { select: { sessions: true } },
            ...(include === "sessions" ? { sessions: { orderBy: { playedAt: "desc" as const }, take: 5 } } : {}),
          },
          skip,
          take: limit,
        }),
        prisma.game.count({ where }),
      ]);
      return paginatedResponse(games, total, page, limit);
    }

    return cachedQuery(
      () =>
        prisma.game.findMany({
          where,
          orderBy: { name: "asc" },
          include: {
            _count: { select: { sessions: true } },
            tags: { include: { tag: true } },
            ...(include === "sessions" ? { sessions: { orderBy: { playedAt: "desc" as const }, take: 5 } } : {}),
          },
        }),
      ["user-games", userId, include ?? ""],
      { revalidate: 60, tags: [CacheTags.userGames(userId)] }
    );
  },

  /** Get a single game (owned by user) */
  async getById(userId: string, gameId: string) {
    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: userId, ...NOT_DELETED },
      include: {
        _count: { select: { sessions: true } },
        tags: { include: { tag: true } },
        sessions: {
          orderBy: { playedAt: "desc" },
          take: 10,
          include: {
            players: { include: { user: { select: SAFE_USER_SELECT } } },
          },
        },
      },
    });
    if (!game) throw new ApiError(404, "Game not found");
    return game;
  },

  /** Create a new game */
  async create(userId: string, input: CreateGameInput) {
    const validationError = firstError(
      validateString(input.name, "Name", { max: 200 }),
      validateString(input.description, "Beschreibung", { required: false, max: 2000 }),
      validateNumber(input.minPlayers, "Min. Spieler", { required: false, min: 1, max: 99 }),
      validateNumber(input.maxPlayers, "Max. Spieler", { required: false, min: 1, max: 99 }),
      validateNumber(input.playTimeMinutes, "Spieldauer", { required: false, min: 0, max: 9999 }),
      validateNumber(input.complexity, "Komplexität", { required: false, min: 1, max: 5 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    const game = await prisma.game.create({
      data: {
        name: input.name,
        description: input.description,
        minPlayers: input.minPlayers || 1,
        maxPlayers: input.maxPlayers || 4,
        playTimeMinutes: input.playTimeMinutes,
        complexity: input.complexity,
        bggId: input.bggId,
        ean: input.ean,
        imageUrl: input.imageUrl,
        ownerId: userId,
      },
    });

    // Link tags if provided
    if (Array.isArray(input.tagNames) && input.tagNames.length > 0) {
      await TagService.syncTags(userId, game.id, input.tagNames, "manual");
    }

    const result = await prisma.game.findUnique({
      where: { id: game.id },
      include: { tags: { include: { tag: true } } },
    });

    this._invalidateGameCaches(userId);
    return result;
  },

  /** Update an existing game */
  async update(userId: string, gameId: string, input: UpdateGameInput) {
    const existing = await prisma.game.findFirst({
      where: { id: gameId, ownerId: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Game not found");

    const validationError = firstError(
      input.name ? validateString(input.name, "Name", { max: 200 }) : null,
      validateString(input.description, "Beschreibung", { required: false, max: 2000 }),
      validateNumber(input.minPlayers, "Min. Spieler", { required: false, min: 1, max: 99 }),
      validateNumber(input.maxPlayers, "Max. Spieler", { required: false, min: 1, max: 99 }),
      validateNumber(input.playTimeMinutes, "Spieldauer", { required: false, min: 0, max: 9999 }),
      validateNumber(input.complexity, "Komplexität", { required: false, min: 1, max: 5 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    const _updated = await prisma.game.update({
      where: { id: gameId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.minPlayers !== undefined && { minPlayers: input.minPlayers }),
        ...(input.maxPlayers !== undefined && { maxPlayers: input.maxPlayers }),
        ...(input.playTimeMinutes !== undefined && { playTimeMinutes: input.playTimeMinutes }),
        ...(input.complexity !== undefined && { complexity: input.complexity }),
        ...(input.bggId !== undefined && { bggId: input.bggId }),
        ...(input.ean !== undefined && { ean: input.ean }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      },
    });

    // Sync tags if provided (wrapped in transaction for atomicity)
    if (Array.isArray(input.tagNames)) {
      await prisma.$transaction(async (tx) => {
        await tx.gameTag.deleteMany({ where: { gameId } });
        const tagIds: string[] = [];
        for (const tagName of input.tagNames!) {
          const trimmed = String(tagName).trim();
          if (!trimmed) continue;
          const tag = await tx.tag.upsert({
            where: { name_ownerId: { name: trimmed, ownerId: userId } },
            create: { name: trimmed, ownerId: userId, source: "manual" },
            update: {},
          });
          tagIds.push(tag.id);
        }
        if (tagIds.length > 0) {
          await tx.gameTag.createMany({
            data: tagIds.map((tagId) => ({ gameId, tagId })),
          });
        }
      });
    }

    const result = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        _count: { select: { sessions: true } },
        tags: { include: { tag: true } },
      },
    });

    this._invalidateGameCaches(userId);
    return result;
  },

  /** Soft-delete a game */
  async delete(userId: string, gameId: string) {
    const existing = await prisma.game.findFirst({
      where: { id: gameId, ownerId: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Game not found");

    await prisma.game.update({
      where: { id: gameId },
      data: { deletedAt: new Date() },
    });

    this._invalidateGameCaches(userId);
    return { message: "Game deleted" };
  },

  /** Bulk soft-delete games */
  async bulkDelete(userId: string, gameIds: string[]) {
    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      throw new ApiError(400, "gameIds must be a non-empty array");
    }

    const result = await prisma.game.updateMany({
      where: { id: { in: gameIds }, ownerId: userId, ...NOT_DELETED },
      data: { deletedAt: new Date() },
    });

    this._invalidateGameCaches(userId);
    return { deleted: result.count };
  },

  /** Invalidate all game-related caches for a user */
  _invalidateGameCaches(userId: string) {
    invalidateTag(CacheTags.userGames(userId));
    invalidateTag(CacheTags.userTags(userId));
    invalidateTag(CacheTags.userDashboard(userId));
    invalidateTag(CacheTags.userStats(userId));
  },
};
