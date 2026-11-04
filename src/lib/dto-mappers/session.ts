import type { SessionDTO, SessionPlayerDTO } from "@/lib/sync-types";
import { iso } from "./utils";

export function toSessionPlayerDto(player: {
  id?: string;
  userId: string;
  score: number | null;
  isWinner: boolean;
  placement: number | null;
}): SessionPlayerDTO {
  return {
    id: player.id ?? null,
    userId: player.userId,
    score: player.score,
    isWinner: player.isWinner,
    placement: player.placement,
  };
}

export function toSessionDto(session: {
  id: string;
  gameId: string | null;
  gameNameSnapshot?: string | null;
  gameBggIdSnapshot?: string | null;
  gameImageUrlSnapshot?: string | null;
  gameMinPlayersSnapshot?: number | null;
  gameMaxPlayersSnapshot?: number | null;
  gamePlayTimeMinutesSnapshot?: number | null;
  gameComplexitySnapshot?: number | null;
  playedAt: Date;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  players?: { id: string; userId: string; score: number | null; isWinner: boolean; placement: number | null }[];
  guestPlayers?: { id: string; name: string; score: number | null; isWinner: boolean; placement: number | null }[];
}): SessionDTO {
  return {
    id: session.id,
    gameId: session.gameId,
    gameNameSnapshot: session.gameNameSnapshot ?? null,
    gameBggIdSnapshot: session.gameBggIdSnapshot ?? null,
    gameImageUrlSnapshot: session.gameImageUrlSnapshot ?? null,
    gameMinPlayersSnapshot: session.gameMinPlayersSnapshot ?? null,
    gameMaxPlayersSnapshot: session.gameMaxPlayersSnapshot ?? null,
    gamePlayTimeMinutesSnapshot: session.gamePlayTimeMinutesSnapshot ?? null,
    gameComplexitySnapshot: session.gameComplexitySnapshot ?? null,
    playedAt: iso(session.playedAt) as string,
    durationMinutes: session.durationMinutes,
    notes: session.notes,
    players: session.players?.map(toSessionPlayerDto) ?? [],
    guestPlayers: session.guestPlayers?.map((player) => ({ ...player })) ?? [],
    createdAt: iso(session.createdAt) as string,
    updatedAt: iso(session.createdAt) as string,
    deletedAt: iso(session.deletedAt),
  };
}
