import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { fetchBGGGame } from "@/lib/bgg";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bggId } = await request.json();

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
      },
    });

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
}
