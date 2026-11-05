import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";

describe("event duration migration", () => {
  afterAll(async () => prisma.$disconnect());

  it("stores an explicit non-null duration with a three-hour default for existing events", async () => {
    const columns = await prisma.$queryRaw<{ is_nullable: string; column_default: string | null }[]>`
      SELECT is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Event' AND column_name = 'durationMinutes'
    `;

    expect(columns).toEqual([{ is_nullable: "NO", column_default: "180" }]);
  });
});
