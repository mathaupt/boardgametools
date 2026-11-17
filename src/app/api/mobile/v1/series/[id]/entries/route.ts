import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { createSeriesEntryResponse } from "@/lib/series/create-entry-response";

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, "Nicht angemeldet.");
    const response = await createSeriesEntryResponse(request, (await params).id, session.user.id);
    if (!response.ok) return response;
    const entry = await response.json();
    return NextResponse.json({ ...entry, collectionGameId: entry.gameId, gameId: entry.gameId ?? `temporary:${entry.id}` }, { status: response.status });
  } catch (error) { return handleApiError(error); }
});
