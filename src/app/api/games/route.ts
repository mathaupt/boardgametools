import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { GameService } from "@/lib/services";
import { parseGameListQuery } from "@/lib/game-list-query";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include") ?? undefined;
    const usesListQuery = ["page", "limit", "q", "tag", "players", "complexity", "sort"].some((key) => searchParams.has(key));
    const result = await GameService.list(userId, usesListQuery
      ? { ...parseGameListQuery(searchParams), include }
      : { page: 0, limit: 0, include });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const result = await GameService.create(userId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
