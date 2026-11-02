import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { getGermanBggVersions, isBggIdentifier } from "@/lib/bgg-versions";
import { BggCatalogError } from "@/lib/bgg-catalog";
import { BggTransportError } from "@/lib/bgg-fetch";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    if (!isBggIdentifier(id)) return NextResponse.json({ error: "Ungültige BGG-ID." }, { status: 400 });
    const limit = await checkRateLimitAsync(`bgg-versions:${userId}`, 20, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);
    const versions = await getGermanBggVersions(id, request.signal);
    return NextResponse.json(versions, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof BggCatalogError || error instanceof BggTransportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleApiError(error);
  }
});
