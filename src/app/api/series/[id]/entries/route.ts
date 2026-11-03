import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { fetchBGGGame } from "@/lib/bgg";
import { isBggIdentifier } from "@/lib/bgg-versions";
import { withApiLogging } from "@/lib/api-logger";
import { CacheTags } from "@/lib/cache-tags";
import { Errors } from "@/lib/error-messages";
import { createOrReuseBggGame } from "@/lib/bgg-import-game";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await requireAuth();

    const { id: seriesId } = await params;

    const series = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: userId, deletedAt: null },
    });

    if (!series) {
      return NextResponse.json({ error: Errors.SERIES_NOT_FOUND }, { status: 404 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({error: "Ungültige Eingabe."}, {status: 400});
    }
    const {gameId: rawGameId, bggId: rawBggId, difficulty} = body as Record<string, unknown>;
    const bggId = typeof rawBggId === "number" && Number.isSafeInteger(rawBggId) ? String(rawBggId) : rawBggId;
    if (rawGameId !== undefined && rawGameId !== null && (typeof rawGameId !== "string" || rawGameId.length === 0 || rawGameId.length > 100)) {
      return NextResponse.json({error: "Ungültige Spiel-ID."}, {status: 400});
    }
    if (rawBggId !== undefined && rawBggId !== null && !isBggIdentifier(bggId)) {
      return NextResponse.json({error: "Ungültige BGG-ID."}, {status: 400});
    }
    if (difficulty !== undefined && difficulty !== null && (typeof difficulty !== "string" || difficulty.length > 100)) {
      return NextResponse.json({error: "Ungültiger Schwierigkeitsgrad."}, {status: 400});
    }
    const gameId = rawGameId as string | undefined;
    const normalizedDifficulty = difficulty as string | null | undefined;
    let resolvedGameId = gameId;

    // If bggId provided, import or find the game first
    if (!resolvedGameId && bggId) {
      let game = await prisma.game.findFirst({
        where: { bggId: bggId.toString(), ownerId: userId, deletedAt: null },
      });

      if (!game) {
        const bggData = await fetchBGGGame(bggId.toString());
        if (!bggData) {
          return NextResponse.json({ error: Errors.GAME_NOT_FOUND_BGG }, { status: 404 });
        }

        const imported = await createOrReuseBggGame(userId, bggId.toString(), {
          name: bggData.name,
          description: bggData.description,
          minPlayers: bggData.minPlayers,
          maxPlayers: bggData.maxPlayers,
          playTimeMinutes: bggData.playTimeMinutes,
          complexity: bggData.complexity ? Math.round(bggData.complexity) : null,
          imageUrl: bggData.imageUrl,
        });
        game = imported.game;
      }

      resolvedGameId = game.id;
    }

    if (!resolvedGameId) {
      return NextResponse.json(
        { error: Errors.GAME_ID_OR_BGG_ID_REQUIRED },
        { status: 400 }
      );
    }

    // Check game exists and belongs to user
    const game = await prisma.game.findFirst({
      where: { id: resolvedGameId, ownerId: userId, deletedAt: null },
    });

    if (!game) {
      return NextResponse.json({ error: Errors.GAME_NOT_FOUND }, { status: 404 });
    }

    // Check if already in series
    const existingEntry = await prisma.gameSeriesEntry.findUnique({
      where: { seriesId_gameId: { seriesId, gameId: resolvedGameId } },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Dieses Spiel ist bereits in dieser Reihe." },
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

    let entry;
    try {
      entry = await prisma.gameSeriesEntry.create({
        data: {seriesId, gameId: resolvedGameId, sortOrder: nextOrder, difficulty: normalizedDifficulty || null},
        include: {game: {select: {id: true, name: true, imageUrl: true, minPlayers: true, maxPlayers: true, playTimeMinutes: true, complexity: true, bggId: true}}},
      });
    } catch (error) {
      if ((error as {code?: string})?.code === "P2002") {
        return NextResponse.json({error: "Dieses Spiel ist bereits in dieser Reihe."}, {status: 409});
      }
      throw error;
    }

    invalidateTag(CacheTags.userSeries(userId));

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
