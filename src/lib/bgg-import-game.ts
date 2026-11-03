import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import { ApiError } from "@/lib/require-auth";

type NewGameData = Omit<Prisma.GameUncheckedCreateInput, "ownerId" | "bggId">;
/** Rechecks ownership atomically after the external BGG request, without overwriting user edits. */
export async function createOrReuseBggGame(ownerId: string, bggId: string, data: NewGameData) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.game.findFirst({
          where: { ownerId, bggId, deletedAt: null },
          orderBy: { id: "asc" },
        });
        if (existing) return { game: existing, created: false };
        const game = await tx.game.create({ data: { ...data, ownerId, bggId } });
        return { game, created: true };
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if ((error as {code?: string})?.code !== "P2034") throw error;
      if (attempt === 3) throw new ApiError(503, "Der Import wird gerade bearbeitet. Bitte versuche es erneut.");
    }
  }
  throw new ApiError(503, "Der Import wird gerade bearbeitet. Bitte versuche es erneut.");
}

