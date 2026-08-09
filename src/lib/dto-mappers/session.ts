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
  gameId: string;
  playedAt: Date;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  players?: { id: string; userId: string; score: number | null; isWinner: boolean; placement: number | null }[];
}): SessionDTO {
  return {
    id: session.id,
    gameId: session.gameId,
    playedAt: iso(session.playedAt) as string,
    durationMinutes: session.durationMinutes,
    notes: session.notes,
    players: session.players?.map(toSessionPlayerDto) ?? [],
    createdAt: iso(session.createdAt) as string,
    updatedAt: iso(session.createdAt) as string,
    deletedAt: iso(session.deletedAt),
  };
}
