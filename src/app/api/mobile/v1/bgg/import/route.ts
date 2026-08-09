import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { fetchBGGGame } from "@/lib/bgg";
import { GameService } from "@/lib/services/game.service";
import { toGameDto } from "@/lib/dto-mappers";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const body = await request.json();
    const bggId = String(body.bggId || "").trim();
    if (!/^\d+$/.test(bggId)) {
      return NextResponse.json({ error: Errors.INVALID_BGG_ID }, { status: 400 });
    }

    const bggData = await fetchBGGGame(bggId);
    if (!bggData) {
      return NextResponse.json({ error: Errors.GAME_NOT_FOUND_BGG }, { status: 404 });
    }

    const game = await GameService.create(session.user.id, {
      name: bggData.name,
      description: bggData.description || undefined,
      minPlayers: bggData.minPlayers,
      maxPlayers: bggData.maxPlayers,
      playTimeMinutes: bggData.playTimeMinutes ?? undefined,
      complexity: bggData.complexity ? Math.round(bggData.complexity) : undefined,
      bggId,
      ean: undefined,
      imageUrl: bggData.imageUrl ?? undefined,
      tagNames: bggData.categories?.slice(0, 10),
    });

    if (!game) throw new ApiError(500, Errors.INTERNAL_SERVER_ERROR);
    return NextResponse.json(toGameDto(game), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
