import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { fetchBGGGame } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";
import logger from "@/lib/logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId: _userId } = await requireAuth()

  const { id } = await params;

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: Errors.INVALID_BGG_ID }, { status: 400 });
  }

  try {
    const gameData = await fetchBGGGame(id);

    if (!gameData) {
      return NextResponse.json({ error: Errors.GAME_NOT_FOUND_BGG }, { status: 404 });
    }

    return NextResponse.json(gameData);
  } catch (error) {
    logger.error({ err: error }, "Error fetching BGG game");
    return NextResponse.json({ error: Errors.FAILED_TO_FETCH_GAME }, { status: 500 });
  }
});
