import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { fetchBGGGame } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";
import { CacheTags } from "@/lib/cache-tags";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const { userId } = await requireAuth();

  try {
    const { bggId, ean } = await request.json();

    if (!bggId) {
      return NextResponse.json({ error: Errors.BGG_ID_REQUIRED }, { status: 400 });
    }

    const existingGame = await prisma.game.findFirst({
      where: { bggId: bggId.toString(), ownerId: userId, deletedAt: null },
    });

    if (existingGame) {
      return NextResponse.json(
        { error: Errors.GAME_ALREADY_EXISTS, game: existingGame },
        { status: 409 }
      );
    }

    const bggData = await fetchBGGGame(bggId.toString());

    if (!bggData) {
      return NextResponse.json({ error: Errors.GAME_NOT_FOUND_BGG }, { status: 404 });
    }

    const game = await prisma.game.create({
      data: {
        name: bggData.name,
        description: bggData.description,
        minPlayers: bggData.minPlayers,
        maxPlayers: bggData.maxPlayers,
        playTimeMinutes: bggData.playTimeMinutes,
        complexity: bggData.complexity ? Math.round(bggData.complexity) : null,
        bggId: bggData.bggId,
        imageUrl: bggData.imageUrl,
        ownerId: userId,
        ...(ean ? { ean: ean.toString() } : {}),
      },
    });

    // Auto-create tags from BGG categories (batched in a single transaction)
    if (bggData.categories && bggData.categories.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const categoryName of bggData.categories) {
          const trimmed = categoryName.trim();
          if (!trimmed) continue;
          const tag = await tx.tag.upsert({
            where: { name_ownerId: { name: trimmed, ownerId: userId } },
            create: { name: trimmed, ownerId: userId, source: "bgg" },
            update: {},
          });
          await tx.gameTag.upsert({
            where: { gameId_tagId: { gameId: game.id, tagId: tag.id } },
            create: { gameId: game.id, tagId: tag.id },
            update: {},
          });
        }
      });
    }

    invalidateTag(CacheTags.userGames(userId));
    invalidateTag(CacheTags.userTags(userId));
    invalidateTag(CacheTags.userDashboard(userId));

    return NextResponse.json(
      {
        message: Errors.GAME_IMPORTED,
        game,
        bggData: {
          categories: bggData.categories,
          mechanics: bggData.mechanics,
          designers: bggData.designers,
          rating: bggData.rating,
          yearPublished: bggData.yearPublished,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
