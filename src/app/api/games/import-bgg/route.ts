import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { fetchBGGGame } from "@/lib/bgg";
import { getGermanBggVersions, isBggIdentifier } from "@/lib/bgg-versions";
import { BggCatalogError } from "@/lib/bgg-catalog";
import { BggTransportError } from "@/lib/bgg-fetch";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { withApiLogging } from "@/lib/api-logger";
import { CacheTags } from "@/lib/cache-tags";
import { Errors } from "@/lib/error-messages";
import { TagService } from "@/lib/services";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Ungültige Importdaten." }, { status: 400 });
    }
    const { bggId: rawId, versionId: rawVersionId, ean } = body as Record<string, unknown>;
    const bggId = typeof rawId === "number" && Number.isSafeInteger(rawId) ? String(rawId) : rawId;
    const versionId = typeof rawVersionId === "number" && Number.isSafeInteger(rawVersionId) ? String(rawVersionId) : rawVersionId;

    if (!isBggIdentifier(bggId)) {
      return NextResponse.json({ error: Errors.BGG_ID_REQUIRED }, { status: 400 });
    }

    if (rawVersionId !== undefined && !isBggIdentifier(versionId)) {
      return NextResponse.json({ error: "Ungültige BGG-Ausgaben-ID." }, { status: 400 });
    }
    const limit = await checkRateLimitAsync(`bgg-import:${userId}`, 20, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

    const existingGame = await prisma.game.findFirst({
      where: { bggId: bggId.toString(), ownerId: userId, deletedAt: null },
    });

    if (existingGame) {
      return NextResponse.json(
        { error: Errors.GAME_ALREADY_EXISTS, game: existingGame },
        { status: 409 }
      );
    }

    const bggData = await fetchBGGGame(bggId.toString());

    if (!bggData) {
      return NextResponse.json({ error: Errors.GAME_NOT_FOUND_BGG }, { status: 404 });
    }

    const version = versionId === undefined ? null
      : (await getGermanBggVersions(bggId)).find(item => item.versionId === versionId);
    if (versionId !== undefined && !version) {
      return NextResponse.json({ error: "Diese deutsche Ausgabe gehört nicht zum gewählten BGG-Spiel oder ist nicht mehr verfügbar." }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        name: bggData.name,
        description: bggData.description,
        minPlayers: bggData.minPlayers,
        maxPlayers: bggData.maxPlayers,
        playTimeMinutes: bggData.playTimeMinutes,
        complexity: bggData.complexity ? Math.round(bggData.complexity) : null,
        bggId: bggData.bggId,
        imageUrl: version?.imageUrl ?? version?.thumbnailUrl ?? bggData.imageUrl,
        ownerId: userId,
        ...(ean ? { ean: ean.toString() } : {}),
      },
    });

    // Auto-create tags from BGG categories
    if (bggData.categories && bggData.categories.length > 0) {
      await TagService.syncTags(userId, game.id, bggData.categories);
    }

    invalidateTag(CacheTags.userGames(userId));
    invalidateTag(CacheTags.userTags(userId));
    invalidateTag(CacheTags.userDashboard(userId));

    return NextResponse.json(
      {
        message: Errors.GAME_IMPORTED,
        game,
        bggData: {
          categories: bggData.categories,
          mechanics: bggData.mechanics,
          designers: bggData.designers,
          rating: bggData.rating,
          yearPublished: bggData.yearPublished,
          versionId: version?.versionId ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Ungültige Importdaten." }, { status: 400 });
    if (error instanceof BggCatalogError || error instanceof BggTransportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleApiError(error);
  }
});
