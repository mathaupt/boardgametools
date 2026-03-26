import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { searchBGGGames } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";
import logger from "@/lib/logger";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const { userId } = await requireAuth()

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    const results = await searchBGGGames(query);
    return NextResponse.json(results);
  } catch (error) {
    logger.error({ err: error }, "BGG search error");
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
});
