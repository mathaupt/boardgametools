import prisma from "@/lib/db";
import { cachedQuery, invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { ApiError } from "@/lib/require-auth";
import { validateString } from "@/lib/validation";

// ── Service ──────────────────────────────────────────────────────

export const TagService = {
  /** List all tags for a user (cached) */
  async list(userId: string) {
    return cachedQuery(
      () =>
        prisma.tag.findMany({
          where: { ownerId: userId },
          include: { _count: { select: { games: true } } },
          orderBy: { name: "asc" },
        }),
      ["user-tags", userId],
      { revalidate: 300, tags: [CacheTags.userTags(userId)] }
    );
  },

  /** Create a tag (or return existing) */
  async create(userId: string, name: string) {
    const error = validateString(name, "Name", { max: 50 });
    if (error) throw new ApiError(400, error);

    const trimmed = name.trim();

    const existing = await prisma.tag.findUnique({
      where: { name_ownerId: { name: trimmed, ownerId: userId } },
    });
    if (existing) return { tag: existing, created: false };

    const tag = await prisma.tag.create({
      data: { name: trimmed, ownerId: userId, source: "manual" },
    });

    invalidateTag(CacheTags.userTags(userId));
    return { tag, created: true };
  },

  /** Delete a tag */
  async delete(userId: string, tagId: string) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, ownerId: userId },
    });
    if (!tag) throw new ApiError(404, "Tag not found");

    await prisma.tag.delete({ where: { id: tagId } });
    invalidateTag(CacheTags.userTags(userId));
    return { message: "Tag deleted" };
  },

  /** Sync tags for a game (upsert tags + link to game in a single transaction) */
  async syncTags(userId: string, gameId: string, tagNames: string[], source: string = "bgg"): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const name of tagNames) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        const tag = await tx.tag.upsert({
          where: { name_ownerId: { name: trimmed, ownerId: userId } },
          create: { name: trimmed, ownerId: userId, source },
          update: {},
        });
        await tx.gameTag.upsert({
          where: { gameId_tagId: { gameId, tagId: tag.id } },
          create: { gameId, tagId: tag.id },
          update: {},
        });
      }
    });
  },
};
