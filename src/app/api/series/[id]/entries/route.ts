import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { fetchBGGGame } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";
import { CacheTags } from "@/lib/cache-tags";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: seriesId } = await params;

  const series = await prisma.gameSeries.findFirst({
    where: { id: seriesId, ownerId: session.user.id, deletedAt: null },
  });

  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { gameId, bggId, difficulty } = body;

    let resolvedGameId = gameId;

    // If bggId provided, import or find the game first
    if (!resolvedGameId && bggId) {
      let game = await prisma.game.findFirst({
        where: { bggId: bggId.toString(), ownerId: session.user.id, deletedAt: null },
      });

      if (!game) {
        const bggData = await fetchBGGGame(bggId.toString());
        if (!bggData) {
          return NextResponse.json({ error: "Game not found on BGG" }, { status: 404 });
        }

        game = await prisma.game.create({
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
      }

      resolvedGameId = game.id;
    }

    if (!resolvedGameId) {
      return NextResponse.json(
        { error: "Either gameId or bggId is required" },
        { status: 400 }
      );
    }

    // Check game exists and belongs to user
    const game = await prisma.game.findFirst({
      where: { id: resolvedGameId, ownerId: session.user.id, deletedAt: null },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if already in series
    const existingEntry = await prisma.gameSeriesEntry.findUnique({
      where: { seriesId_gameId: { seriesId, gameId: resolvedGameId } },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Game is already in this series" },
        { status: 409 }
      );
    }

    // Get next sort order
    const maxEntry = await prisma.gameSeriesEntry.findFirst({
      where: { seriesId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextOrder = (maxEntry?.sortOrder ?? -1) + 1;

    const entry = await prisma.gameSeriesEntry.create({
      data: {
        seriesId,
        gameId: resolvedGameId,
        sortOrder: nextOrder,
        difficulty: difficulty || null,
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            minPlayers: true,
            maxPlayers: true,
            playTimeMinutes: true,
            complexity: true,
            bggId: true,
          },
        },
      },
    });

    invalidateTag(CacheTags.userSeries(session.user.id));

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error adding entry to series:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
