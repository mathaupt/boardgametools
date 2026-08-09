import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GameService, CreateGameInput } from "@/lib/services/game.service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toGameDto } from "@/lib/dto-mappers";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const games = await GameService.list(session.user.id);
    return NextResponse.json(Array.isArray(games) ? games.map(toGameDto) : games.data.map(toGameDto));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const body = (await request.json()) as CreateGameInput;
    const game = await GameService.create(session.user.id, body);
    if (!game) throw new ApiError(500, Errors.INTERNAL_SERVER_ERROR);
    return NextResponse.json(toGameDto(game), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
