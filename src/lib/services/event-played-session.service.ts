import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import { gameTextForRead } from "@/lib/game-text";
import { ApiError } from "@/lib/require-auth";
import { validateString } from "@/lib/validation";
import { CacheTags } from "@/lib/cache-tags";
import { invalidateTag } from "@/lib/cache";
import { SessionService, type CreateEventSessionInput } from "@/lib/services/session.service";
import { fetchBGGGame } from "@/lib/bgg";

export type PlayedSessionSource =
  | { type: "proposal"; proposalId: string }
  | { type: "collection"; collectionGameId: string }
  | { type: "bgg"; bggId: string };

export interface PlayedSessionInput {
  source: PlayedSessionSource;
  operationId: string;
  playedAt: string;
  durationMinutes?: number | null;
  notes?: string | null;
  players: { userId: string; score?: number | null; isWinner?: boolean; placement?: number | null }[];
  guestPlayers: { guestId: string; score?: number | null; isWinner?: boolean; placement?: number | null }[];
}

const includeSession = {
  session: {
    include: {
      game: true,
      players: { include: { user: { select: { id: true, name: true } } } },
      guestPlayers: true,
    },
  },
} satisfies Prisma.EventPlayedSessionInclude;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const EventPlayedSessionService = {
  async create(userId: string, eventId: string, input: PlayedSessionInput) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        createdById: true,
        eventDate: true,
        invites: { select: { userId: true, status: true } },
        guestParticipants: { select: { id: true, nickname: true } },
      },
    });
    if (!event) throw new ApiError(404, "Event nicht gefunden.");
    if (event.createdById !== userId) throw new ApiError(403, "Nur der Ersteller kann gespielte Partien erfassen.");

    const operationId = input.operationId.trim();
    if (!/^[\w-]{8,100}$/.test(operationId)) throw new ApiError(400, "Ungültige Operations-ID.");
    const prior = await prisma.eventPlayedSession.findUnique({
      where: { eventId_operationId: { eventId, operationId } },
      include: includeSession,
    });
    if (prior) {
      if (prior.session.deletedAt) throw new ApiError(409, "Diese Partie wurde bereits gelöscht.");
      return { session: prior.session, duplicate: true };
    }

    if (!input.source || !input.playedAt || !Array.isArray(input.players) || !Array.isArray(input.guestPlayers)) {
      throw new ApiError(400, "Bitte Spiel, Datum und Teilnehmende angeben.");
    }
    const playedAt = new Date(input.playedAt);
    if (Number.isNaN(playedAt.getTime())) throw new ApiError(400, "Ungültiges Spieldatum.");
    if (input.durationMinutes != null && (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1 || input.durationMinutes > 1440)) {
      throw new ApiError(400, "Die Dauer muss zwischen 1 und 1440 Minuten liegen.");
    }
    const notesError = validateString(input.notes ?? undefined, "Notizen", { required: false, max: 2000 });
    if (notesError) throw new ApiError(400, notesError);
    if (input.players.length + input.guestPlayers.length < 1 || input.players.length + input.guestPlayers.length > 20) {
      throw new ApiError(400, "Eine Partie benötigt 1 bis 20 Teilnehmende.");
    }
    if (new Set(input.players.map((player) => player.userId)).size !== input.players.length ||
      new Set(input.guestPlayers.map((player) => player.guestId)).size !== input.guestPlayers.length) {
      throw new ApiError(400, "Teilnehmende dürfen nicht doppelt ausgewählt werden.");
    }

    const proposal = input.source.type === "proposal" ? await prisma.gameProposal.findFirst({
      where: { id: input.source.proposalId, eventId },
      select: {
        id: true, eventId: true, gameId: true, bggId: true, bggName: true, bggImageUrl: true,
        bggMinPlayers: true, bggMaxPlayers: true, bggPlayTimeMinutes: true,
        game: { select: { id: true, ownerId: true, deletedAt: true, name: true, bggId: true, imageUrl: true, minPlayers: true, maxPlayers: true, playTimeMinutes: true, complexity: true } },
      },
    }) : null;
    if (input.source.type === "proposal" && !proposal) throw new ApiError(404, "Spielvorschlag gehört nicht zu diesem Event oder wurde entfernt.");

    const gameSelect = { id: true, ownerId: true, deletedAt: true, name: true, bggId: true, imageUrl: true, minPlayers: true, maxPlayers: true, playTimeMinutes: true, complexity: true } as const;
    const collectionGame = input.source.type === "collection" ? await prisma.game.findFirst({
      where: { id: input.source.collectionGameId, ownerId: userId, deletedAt: null }, select: gameSelect,
    }) : null;
    if (input.source.type === "collection" && !collectionGame) throw new ApiError(404, "Sammlungsspiel nicht gefunden.");

    const bggGame = input.source.type === "bgg" ? await fetchBGGGame(input.source.bggId) : null;
    if (input.source.type === "bgg" && !bggGame) throw new ApiError(404, "BoardGameGeek-Spiel nicht gefunden.");
    const ownedBggGame = input.source.type === "bgg" ? await prisma.game.findFirst({
      where: { ownerId: userId, bggId: input.source.bggId, deletedAt: null }, select: gameSelect,
      orderBy: { createdAt: "asc" },
    }) : null;

    const allowedUsers = new Set([
      event.createdById,
      ...event.invites.filter((invite) => invite.status === "accepted" && invite.userId).map((invite) => invite.userId as string),
    ]);
    if (input.players.some((player) => !allowedUsers.has(player.userId))) {
      throw new ApiError(400, "Mindestens ein Mitspieler ist nicht als Teilnehmer eingeladen.");
    }
    const guestsById = new Map(event.guestParticipants.map((guest) => [guest.id, guest.nickname]));
    if (input.guestPlayers.some((guest) => !guestsById.has(guest.guestId))) {
      throw new ApiError(400, "Mindestens ein Gast gehört nicht zu diesem Event.");
    }

    const game = input.source.type === "proposal" ? proposal!.game : input.source.type === "collection" ? collectionGame : ownedBggGame;
    const bggName = input.source.type === "proposal" ? proposal!.bggName : input.source.type === "bgg" ? bggGame!.name : null;
    const bggId = input.source.type === "proposal" ? proposal!.bggId : input.source.type === "bgg" ? bggGame!.bggId : null;
    const bggImageUrl = input.source.type === "proposal" ? proposal!.bggImageUrl : input.source.type === "bgg" ? bggGame!.imageUrl : null;
    const bggMinPlayers = input.source.type === "proposal" ? proposal!.bggMinPlayers : input.source.type === "bgg" ? bggGame!.minPlayers : null;
    const bggMaxPlayers = input.source.type === "proposal" ? proposal!.bggMaxPlayers : input.source.type === "bgg" ? bggGame!.maxPlayers : null;
    const bggPlayTime = input.source.type === "proposal" ? proposal!.bggPlayTimeMinutes : input.source.type === "bgg" ? bggGame!.playTimeMinutes : null;
    const snapshot: CreateEventSessionInput = {
      gameId: game && game.ownerId === userId && game.deletedAt === null ? game.id : null,
      gameNameSnapshot: gameTextForRead(game?.name ?? bggName ?? "Unbekanntes Spiel"),
      gameBggIdSnapshot: game?.bggId ?? bggId,
      gameImageUrlSnapshot: game?.imageUrl ?? bggImageUrl,
      gameMinPlayersSnapshot: game?.minPlayers ?? bggMinPlayers,
      gameMaxPlayersSnapshot: game?.maxPlayers ?? bggMaxPlayers,
      gamePlayTimeMinutesSnapshot: game?.playTimeMinutes ?? bggPlayTime,
      gameComplexitySnapshot: game?.complexity ?? null,
      playedAt: playedAt.toISOString(),
      durationMinutes: input.durationMinutes ?? null,
      notes: input.notes?.trim() || null,
      players: input.players.map((player) => ({ ...player })),
      guestPlayers: input.guestPlayers.map((guest) => ({
        name: guestsById.get(guest.guestId)!,
        score: guest.score ?? null,
        isWinner: guest.isWinner ?? false,
        placement: guest.placement ?? null,
      })),
    };

    try {
      const result = await prisma.$transaction(async (tx) => {
        const createdSession = await SessionService.createFromEvent(tx, userId, snapshot);
        const link = await tx.eventPlayedSession.create({
          data: { eventId, proposalId: proposal?.id ?? null, sessionId: createdSession.id, operationId },
          include: includeSession,
        });
        return { session: link.session, duplicate: false };
      });
      SessionService._invalidateSessionCaches(userId);
      invalidateTag(CacheTags.userEvents(userId));
      return result;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const retry = await prisma.eventPlayedSession.findUnique({
        where: { eventId_operationId: { eventId, operationId } },
        include: includeSession,
      });
      if (!retry) throw error;
      if (retry.session.deletedAt) throw new ApiError(409, "Diese Partie wurde bereits gelöscht.");
      return { session: retry.session, duplicate: true };
    }
  },
};
