import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { searchBGGGames } from "@/lib/bgg";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const body = await request.json();
    const ean = String(body.ean || "").trim();
    if (!ean || ean.length < 8) {
      return NextResponse.json({ error: "Ungültige EAN" }, { status: 400 });
    }

    const results = await searchBGGGames(ean);
    if (results.length === 0) {
      return NextResponse.json({ error: "Kein Spiel mit dieser EAN gefunden" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    return handleApiError(error);
  }
});
