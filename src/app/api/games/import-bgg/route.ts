import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { fetchBGGGame } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";
import { CacheTags } from "@/lib/cache-tags";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bggId, ean } = await request.json();

    if (!bggId) {
      return NextResponse.json({ error: "BGG ID is required" }, { status: 400 });
    }

    const existingGame = await prisma.game.findFirst({
      where: { bggId: bggId.toString(), ownerId: session.user.id },
    });

    if (existingGame) {
      return NextResponse.json(
        { error: "Game already exists in your collection", game: existingGame },
        { status: 409 }
      );
    }

    const bggData = await fetchBGGGame(bggId.toString());

    if (!bggData) {
      return NextResponse.json({ error: "Game not found on BGG" }, { status: 404 });
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
        ownerId: session.user.id,
        ...(ean ? { ean: ean.toString() } : {}),
      },
    });

    // Auto-create tags from BGG categories
    if (bggData.categories && bggData.categories.length > 0) {
      for (const categoryName of bggData.categories) {
        const trimmed = categoryName.trim();
        if (!trimmed) continue;
        const tag = await prisma.tag.upsert({
          where: { name_ownerId: { name: trimmed, ownerId: session.user.id } },
          create: { name: trimmed, ownerId: session.user.id, source: "bgg" },
          update: {},
        });
        await prisma.gameTag.upsert({
          where: { gameId_tagId: { gameId: game.id, tagId: tag.id } },
          create: { gameId: game.id, tagId: tag.id },
          update: {},
        });
      }
    }

    invalidateTag(CacheTags.userGames(session.user.id));
    invalidateTag(CacheTags.userTags(session.user.id));
    invalidateTag(CacheTags.userDashboard(session.user.id));

    return NextResponse.json(
      {
        message: "Game imported successfully",
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
    console.error("Error importing game from BGG:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
