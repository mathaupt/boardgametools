import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GameService, UpdateGameInput } from "@/lib/services/game.service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toGameDto } from "@/lib/dto-mappers";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(_request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const game = await GameService.getById(session.user.id, id);
    return NextResponse.json(toGameDto(game));
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const body = (await request.json()) as UpdateGameInput;
    const game = await GameService.update(session.user.id, id, body);
    if (!game) throw new ApiError(500, Errors.INTERNAL_SERVER_ERROR);
    return NextResponse.json(toGameDto(game));
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = PUT;

export const DELETE = withApiLogging(async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(_request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    await GameService.delete(session.user.id, id);
    return NextResponse.json({ message: "Spiel gelöscht" });
  } catch (error) {
    return handleApiError(error);
  }
});
