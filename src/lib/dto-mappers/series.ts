import { Prisma } from "@/generated/prisma/client";
import type { SeriesDTO, SeriesEntryDTO } from "@/lib/sync-types";

type SeriesEntryWithGame = Prisma.GameSeriesEntryGetPayload<{
  include: { game: { select: { imageUrl: true } } };
}>;

type SeriesWithEntries = Prisma.GameSeriesGetPayload<{
  include: { entries: { include: { game: { select: { imageUrl: true } } } } };
}>;

export function toSeriesEntryDto(entry: SeriesEntryWithGame): SeriesEntryDTO {
  return {
    id: entry.id,
    seriesId: entry.seriesId,
    gameId: entry.gameId,
    sortOrder: entry.sortOrder,
    played: entry.played,
    playedAt: entry.playedAt?.toISOString() ?? null,
    rating: entry.rating,
    difficulty: entry.difficulty,
    playTimeMinutes: entry.playTimeMinutes,
    successful: entry.successful,
    playerCount: entry.playerCount,
    score: entry.score,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    game: entry.game ? { imageUrl: entry.game.imageUrl } : undefined,
  };
}

export function toSeriesDto(series: SeriesWithEntries): SeriesDTO {
  return {
    id: series.id,
    name: series.name,
    description: series.description,
    imageUrl: series.imageUrl,
    ownerId: series.ownerId,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
    deletedAt: series.deletedAt?.toISOString() ?? null,
    entries: series.entries.map(toSeriesEntryDto),
  };
}
