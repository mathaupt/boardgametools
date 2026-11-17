import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { fetchBGGGame } from "@/lib/bgg";
import { getGermanBggVersions, isBggIdentifier } from "@/lib/bgg-versions";
import { createOrReuseBggGame } from "@/lib/bgg-import-game";
import { toGameDto } from "@/lib/dto-mappers";
import { TagService } from "@/lib/services";
import { invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { BggCatalogError } from "@/lib/bgg-catalog";
import { BggTransportError } from "@/lib/bgg-fetch";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "Ungültige Importdaten.");
    const { bggId, versionId } = body as Record<string, unknown>;
    if (!isBggIdentifier(bggId) || (versionId !== undefined && !isBggIdentifier(versionId))) {
      throw new ApiError(400, "Ungültige BGG-ID oder Ausgaben-ID.");
    }
    const userId = session.user.id;
    const limit = await checkRateLimitAsync(`bgg-import:${userId}`, 20, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);
    const data = await fetchBGGGame(bggId);
    if (!data) throw new ApiError(404, Errors.GAME_NOT_FOUND_BGG);
    const version = versionId === undefined ? null : (await getGermanBggVersions(bggId, request.signal)).find(item => item.versionId === versionId);
    if (versionId !== undefined && !version) throw new ApiError(400, "Diese deutsche Ausgabe gehört nicht zum gewählten Spiel.");
    const result = await createOrReuseBggGame(userId, bggId, {
      name: data.name, description: data.description,
      minPlayers: data.minPlayers, maxPlayers: data.maxPlayers,
      playTimeMinutes: data.playTimeMinutes,
      complexity: data.complexity ? Math.round(data.complexity) : null,
      imageUrl: version?.imageUrl ?? version?.thumbnailUrl ?? data.imageUrl,
    });
    if (result.created) {
      if (data.categories?.length) await TagService.syncTags(userId, result.game.id, data.categories.slice(0, 10));
      invalidateTag(CacheTags.userGames(userId));
      invalidateTag(CacheTags.userTags(userId));
      invalidateTag(CacheTags.userDashboard(userId));
    }
    return NextResponse.json(toGameDto(result.game), { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Ungültige Importdaten." }, { status: 400 });
    if (error instanceof BggCatalogError || error instanceof BggTransportError) return NextResponse.json({ error: error.message }, { status: error.status });
    return handleApiError(error);
  }
});
