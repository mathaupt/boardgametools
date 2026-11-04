import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";

describe("FEAT-029 event session migration", () => {
  afterAll(async () => prisma.$disconnect());

  it("supports nullable collection games, snapshots, guest players and idempotent event links", async () => {
    const columns = await prisma.$queryRaw<{ column_name: string; is_nullable: string }[]>`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'GameSession'
        AND column_name IN ('gameId', 'gameNameSnapshot', 'gameBggIdSnapshot', 'gameImageUrlSnapshot', 'gameMinPlayersSnapshot', 'gameMaxPlayersSnapshot', 'gamePlayTimeMinutesSnapshot', 'gameComplexitySnapshot')
    `;
    expect(columns).toHaveLength(8);
    expect(columns.find((column) => column.column_name === "gameId")?.is_nullable).toBe("YES");

    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('SessionGuestPlayer', 'EventPlayedSession')
    `;
    expect(tables.map(({ table_name }) => table_name).sort()).toEqual(["EventPlayedSession", "SessionGuestPlayer"]);

    const constraints = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
        AND indexname IN ('EventPlayedSession_eventId_operationId_key', 'EventPlayedSession_sessionId_key')
    `;
    expect(constraints.map(({ indexname }) => indexname).sort()).toEqual([
      "EventPlayedSession_eventId_operationId_key",
      "EventPlayedSession_sessionId_key",
    ]);
  });
});
