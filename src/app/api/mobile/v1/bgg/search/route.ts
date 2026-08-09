import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { searchBGGGames } from "@/lib/bgg";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q || q.length < 2) {
      return NextResponse.json({ error: Errors.QUERY_MIN_LENGTH }, { status: 400 });
    }

    const results = await searchBGGGames(q);
    return NextResponse.json(results);
  } catch (error) {
    return handleApiError(error);
  }
});
