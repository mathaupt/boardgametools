import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { createOrReuseBggGame } from "@/lib/bgg-import-game";
import { invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, "Nicht angemeldet.");
    const userId = session.user.id;
    const { id: seriesId, entryId } = await params;
    const entry = await prisma.gameSeriesEntry.findFirst({ where: { id: entryId, seriesId, series: { ownerId: userId, deletedAt: null } } });
    if (!entry) throw new ApiError(404, "Reihenspiel nicht gefunden.");
    if (entry.gameId) return NextResponse.json({ message: "Das Spiel ist bereits in deiner Sammlung." });
    if (!entry.bggId) throw new ApiError(400, "Für die Übernahme fehlt die BGG-ID.");
    const { game } = await createOrReuseBggGame(userId, entry.bggId, {
      name: entry.gameName, description: entry.gameDescription, imageUrl: entry.gameImageUrl,
      minPlayers: entry.minPlayers, maxPlayers: entry.maxPlayers,
      playTimeMinutes: entry.gamePlayTimeMinutes, complexity: entry.complexity,
    });
    await prisma.gameSeriesEntry.update({ where: { id: entryId }, data: { gameId: game.id, source: "COLLECTION" } });
    invalidateTag(CacheTags.userGames(userId));
    invalidateTag(CacheTags.userSeries(userId));
    invalidateTag(CacheTags.userDashboard(userId));
    return NextResponse.json({ message: "Spiel in die Sammlung übernommen." });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") return NextResponse.json({ error: "Das Spiel ist bereits mit dieser Reihe verknüpft." }, { status: 409 });
    return handleApiError(error);
  }
});
