import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { isBggIdentifier } from "@/lib/bgg-versions";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { withApiLogging } from "@/lib/api-logger";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) || !Array.isArray((body as {bggIds?: unknown}).bggIds)) {
      return NextResponse.json({error: "Ungültige BGG-IDs."}, {status: 400});
    }
    const rawIds = (body as {bggIds: unknown[]}).bggIds;
    if (rawIds.length < 1 || rawIds.length > 50 || !rawIds.every(isBggIdentifier)) {
      return NextResponse.json({error: "Gib 1 bis 50 gültige BGG-IDs ein."}, {status: 400});
    }
    const bggIds = [...new Set(rawIds)];
    const limit = await checkRateLimitAsync(`bgg-presence:${userId}`, 60, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

    const games = await prisma.game.findMany({
      where: {ownerId: userId, deletedAt: null, bggId: {in: bggIds}},
      select: {id: true, name: true, bggId: true},
      orderBy: {id: "asc"},
    });
    const byBggId = new Map<string, {id: string; name: string}>();
    for (const game of games) if (game.bggId && !byBggId.has(game.bggId)) byBggId.set(game.bggId, {id: game.id, name: game.name});
    const matches = Object.fromEntries(bggIds.map(id => [id, byBggId.get(id) ?? null]));
    return NextResponse.json({matches}, {headers: {"Cache-Control": "private, no-store"}});
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({error: "Ungültige BGG-IDs."}, {status: 400});
    if (error && typeof error === "object" && "statusCode" in error) return handleApiError(error);
    return NextResponse.json({error: "Die Sammlung konnte nicht geprüft werden."}, {status: 500, headers: {"Cache-Control": "private, no-store"}});
  }
});
