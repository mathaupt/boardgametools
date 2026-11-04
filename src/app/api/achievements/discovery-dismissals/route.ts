import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError, requireAuth } from "@/lib/require-auth";
import { AchievementService } from "@/lib/services/achievement.service";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body: unknown = await request.json();
    const gameId = typeof body === "object" && body !== null && "gameId" in body
      ? (body as { gameId?: unknown }).gameId
      : undefined;

    if (typeof gameId !== "string" || !gameId.trim()) {
      return NextResponse.json({ error: "Spiel-ID ist erforderlich." }, { status: 400 });
    }
    if (gameId.length > 100) {
      return NextResponse.json({ error: "Ungültige Spiel-ID." }, { status: 400 });
    }

    await AchievementService.dismissDiscoveryGame(userId, gameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
