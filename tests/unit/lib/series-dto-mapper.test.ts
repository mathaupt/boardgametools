import { describe, expect, it } from "vitest";
import { toSeriesDto, toSeriesEntryDto } from "@/lib/dto-mappers/series";

const createdAt = new Date("2026-01-02T03:04:05.000Z");
const updatedAt = new Date("2026-02-03T04:05:06.000Z");

describe("series DTO mappers", () => {
  it("maps a series with no entries and nullable metadata", () => {
    expect(toSeriesDto({
      id: "series-1",
      name: "EXIT",
      description: null,
      imageUrl: null,
      ownerId: "user-1",
      createdAt,
      updatedAt,
      deletedAt: null,
      entries: [],
    } as never)).toEqual({
      id: "series-1",
      name: "EXIT",
      description: null,
      imageUrl: null,
      ownerId: "user-1",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      deletedAt: null,
      entries: [],
    });
  });

  it("serializes entry dates, nullable results, and game image metadata", () => {
    expect(toSeriesEntryDto({
      id: "entry-1",
      seriesId: "series-1",
      gameId: "game-1",
      sortOrder: 2,
      played: true,
      playedAt: null,
      rating: null,
      difficulty: null,
      playTimeMinutes: null,
      successful: null,
      playerCount: null,
      score: null,
      createdAt,
      updatedAt,
      game: { imageUrl: "/cover.jpg" },
    } as never)).toEqual({
      id: "entry-1",
      seriesId: "series-1",
      gameId: "game-1",
      sortOrder: 2,
      played: true,
      playedAt: null,
      rating: null,
      difficulty: null,
      playTimeMinutes: null,
      successful: null,
      playerCount: null,
      score: null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      game: { imageUrl: "/cover.jpg" },
    });
  });

  it("preserves an entry played date and omits missing game data", () => {
    const playedAt = new Date("2026-03-04T05:06:07.000Z");
    const dto = toSeriesEntryDto({
      id: "entry-2",
      seriesId: "series-1",
      gameId: "game-2",
      sortOrder: 0,
      played: false,
      playedAt,
      rating: 8,
      difficulty: "medium",
      playTimeMinutes: 45,
      successful: true,
      playerCount: 3,
      score: 12,
      createdAt,
      updatedAt,
      game: null,
    } as never);

    expect(dto.playedAt).toBe(playedAt.toISOString());
    expect(dto.game).toBeUndefined();
    expect(dto.rating).toBe(8);
  });
});
