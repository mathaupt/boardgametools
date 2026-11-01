import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { findPublicEventByToken } from "@/lib/event-share";
import { evaluateEventState } from "@/lib/events/event-state";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { BggCatalogError, getBggCatalogDetail, searchBggCatalog } from "@/lib/bgg-catalog";

type RouteContext = { params: Promise<{ token: string }> };
const noStore = { "Cache-Control": "private, no-store" };

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: RouteContext) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimitAsync(`pub-bgg:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    const response = rateLimitResponse(limit.retryAfterMs);
    response.headers.set("Cache-Control", noStore["Cache-Control"]);
    return response;
  }

  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const queries = searchParams.getAll("query");
  const bggIds = searchParams.getAll("bggId");
  if (queries.length > 1 || bggIds.length > 1) {
    return NextResponse.json({ error: "Pro Parameter darf nur ein Wert angegeben werden." }, { status: 400, headers: noStore });
  }
  const query = queries[0] ?? null;
  const bggId = bggIds[0] ?? null;
  if ((query === null) === (bggId === null)) {
    return NextResponse.json({ error: "Genau eine Suche oder BGG-ID ist erforderlich." }, { status: 400, headers: noStore });
  }

  const cleanQuery = query?.trim();
  if (cleanQuery !== undefined && (cleanQuery.length < 2 || cleanQuery.length > 200)) {
    return NextResponse.json({ error: "Der Suchbegriff muss zwischen 2 und 200 Zeichen lang sein." }, { status: 400, headers: noStore });
  }
  if (bggId !== null && !/^\d{1,12}$/.test(bggId)) {
    return NextResponse.json({ error: "Die BGG-ID ist ungültig." }, { status: 400, headers: noStore });
  }

  const event = await findPublicEventByToken(token);
  if (!event) return NextResponse.json({ error: "Event nicht gefunden." }, { status: 404, headers: noStore });
  const state = evaluateEventState({
    status: event.status,
    eventDate: event.eventDate,
    selectedDate: event.selectedDate,
    selectedGameId: event.selectedGameId,
    winningProposalId: event.winningProposalId,
    deletedAt: event.deletedAt,
  }, new Date());
  if (!state.available.proposeGame) {
    return NextResponse.json({ error: state.blockedReason ?? "Für dieses Event sind keine neuen Vorschläge möglich." }, { status: 409, headers: noStore });
  }

  try {
    const result = cleanQuery !== undefined
      ? await searchBggCatalog(cleanQuery, request.signal)
      : await getBggCatalogDetail(bggId!, request.signal);
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    if (error instanceof BggCatalogError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: noStore });
    }
    return NextResponse.json({ error: "Die BGG-Suche ist fehlgeschlagen." }, { status: 503, headers: noStore });
  }
});
