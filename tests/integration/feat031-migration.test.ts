import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";

describe("FEAT-031 optional event proposal migration", () => {
  afterAll(async () => prisma.$disconnect());

  it("allows event sessions without a proposal and keeps session idempotency unique", async () => {
    const proposal = await prisma.$queryRaw<{ is_nullable: string }[]>`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'EventPlayedSession' AND column_name = 'proposalId'
    `;
    expect(proposal).toEqual([{ is_nullable: "YES" }]);

    const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname IN (
        'EventPlayedSession_eventId_operationId_key', 'EventPlayedSession_sessionId_key'
      )
    `;
    expect(indexes.map(({ indexname }) => indexname).sort()).toEqual([
      "EventPlayedSession_eventId_operationId_key",
      "EventPlayedSession_sessionId_key",
    ]);
  });
});
