import { describe, expect, it } from "vitest";
import { toSessionDto } from "@/lib/dto-mappers/session";

describe("toSessionDto snapshots", () => {
  it("keeps event-only game snapshots and named guest players without a collection game", () => {
    const dto = toSessionDto({
      id: "session-1",
      gameId: null,
      gameNameSnapshot: "BGG-Abenteuer",
      gameBggIdSnapshot: "42",
      gameImageUrlSnapshot: "https://cf.geekdo-images.com/game.jpg",
      gameMinPlayersSnapshot: 2,
      gameMaxPlayersSnapshot: 5,
      gamePlayTimeMinutesSnapshot: 75,
      gameComplexitySnapshot: 2.4,
      playedAt: new Date("2026-11-04T18:00:00Z"),
      durationMinutes: 80,
      notes: "private",
      createdAt: new Date("2026-11-04T18:00:00Z"),
      deletedAt: null,
      players: [],
      guestPlayers: [{ id: "guest-player-1", name: "Alex", score: 9, isWinner: true, placement: 1 }],
    } as never);

    expect(dto).toMatchObject({
      gameId: null,
      gameNameSnapshot: "BGG-Abenteuer",
      gameBggIdSnapshot: "42",
      gameImageUrlSnapshot: "https://cf.geekdo-images.com/game.jpg",
      gameMinPlayersSnapshot: 2,
      gameMaxPlayersSnapshot: 5,
      gamePlayTimeMinutesSnapshot: 75,
      gameComplexitySnapshot: 2.4,
      guestPlayers: [{ id: "guest-player-1", name: "Alex", score: 9, isWinner: true, placement: 1 }],
    });
  });
});
