import prisma from "@/lib/db";
import { cachedQuery, invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { ApiError } from "@/lib/require-auth";
import { validateString } from "@/lib/validation";
import { NOT_DELETED, SAFE_USER_SELECT, buildPagination, paginatedResponse } from "./shared";

// ── Types ────────────────────────────────────────────────────────

interface SessionPlayerInput {
  userId: string;
  score?: number | null;
  isWinner?: boolean;
  placement?: number | null;
}

export interface CreateSessionInput {
  gameId: string;
  playedAt: string;
  durationMinutes?: number | string;
  notes?: string;
  players: SessionPlayerInput[];
}

export interface UpdateSessionInput {
  playedAt?: string;
  durationMinutes?: number | string | null;
  notes?: string;
  players?: SessionPlayerInput[];
}

// ── Service ──────────────────────────────────────────────────────

const includeRelations = {
  game: true as const,
  players: {
    include: { user: { select: SAFE_USER_SELECT } },
  },
};

export const SessionService = {
  /** List sessions for a user (optionally paginated) */
  async list(userId: string, opts?: { page?: number; limit?: number }) {
    const where = { createdById: userId, ...NOT_DELETED };
    const { page, limit, isPaginated, skip } = buildPagination(opts);

    if (isPaginated) {
      const [sessions, total] = await Promise.all([
        prisma.gameSession.findMany({
          where,
          include: includeRelations,
          orderBy: { playedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.gameSession.count({ where }),
      ]);
      return paginatedResponse(sessions, total, page, limit);
    }

    return cachedQuery(
      () =>
        prisma.gameSession.findMany({
          where,
          include: includeRelations,
          orderBy: { playedAt: "desc" },
        }),
      ["user-sessions", userId],
      { revalidate: 60, tags: [CacheTags.userSessions(userId)] }
    );
  },

  /** Get a single session */
  async getById(userId: string, sessionId: string) {
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, createdById: userId, ...NOT_DELETED },
      include: {
        ...includeRelations,
        ratings: {
          include: { user: { select: SAFE_USER_SELECT } },
        },
      },
    });
    if (!session) throw new ApiError(404, "Session not found");
    return session;
  },

  /** Create a new session */
  async create(userId: string, input: CreateSessionInput) {
    if (!input.gameId || !input.playedAt || !input.players?.length) {
      throw new ApiError(400, "Missing required fields: gameId, playedAt, players");
    }

    const notesError = validateString(input.notes, "Notizen", { required: false, max: 2000 });
    if (notesError) throw new ApiError(400, notesError);

    // Verify game ownership
    const game = await prisma.game.findFirst({
      where: { id: input.gameId, ownerId: userId, ...NOT_DELETED },
    });
    if (!game) throw new ApiError(404, "Game not found");

    const newSession = await prisma.gameSession.create({
      data: {
        gameId: input.gameId,
        playedAt: new Date(input.playedAt),
        durationMinutes: input.durationMinutes ? parseInt(String(input.durationMinutes)) : null,
        notes: input.notes,
        createdById: userId,
        players: {
          create: input.players.map((p) => ({
            userId: p.userId,
            score: p.score ?? null,
            isWinner: p.isWinner ?? false,
            placement: p.placement ?? null,
          })),
        },
      },
      include: includeRelations,
    });

    this._invalidateSessionCaches(userId);
    return newSession;
  },

  /** Update an existing session */
  async update(userId: string, sessionId: string, input: UpdateSessionInput) {
    const existing = await prisma.gameSession.findFirst({
      where: { id: sessionId, createdById: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Session not found");

    if (input.notes !== undefined) {
      const notesError = validateString(input.notes, "Notizen", { required: false, max: 2000 });
      if (notesError) throw new ApiError(400, notesError);
    }

    // Use transaction for atomic update with players
    const updated = await prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.update({
        where: { id: sessionId },
        data: {
          ...(input.playedAt !== undefined && { playedAt: new Date(input.playedAt) }),
          ...(input.durationMinutes !== undefined && {
            durationMinutes: input.durationMinutes ? parseInt(String(input.durationMinutes)) : null,
          }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
      });

      if (input.players) {
        await tx.sessionPlayer.deleteMany({ where: { sessionId } });
        await tx.sessionPlayer.createMany({
          data: input.players.map((p) => ({
            sessionId,
            userId: p.userId,
            score: p.score ?? null,
            isWinner: p.isWinner ?? false,
            placement: p.placement ?? null,
          })),
        });
      }

      return tx.gameSession.findUnique({
        where: { id: sessionId },
        include: includeRelations,
      });
    });

    this._invalidateSessionCaches(userId);
    return updated;
  },

  /** Soft-delete a session */
  async delete(userId: string, sessionId: string) {
    const existing = await prisma.gameSession.findFirst({
      where: { id: sessionId, createdById: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Session not found");

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });

    this._invalidateSessionCaches(userId);
    return { message: "Session deleted" };
  },

  /** Invalidate all session-related caches */
  _invalidateSessionCaches(userId: string) {
    invalidateTag(CacheTags.userSessions(userId));
    invalidateTag(CacheTags.userStats(userId));
    invalidateTag(CacheTags.userDashboard(userId));
  },
};
