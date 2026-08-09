import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    const [ownedGames, sessions, events, groups] = await prisma.$transaction([
      prisma.game.count({ where: { ownerId: session.user.id, deletedAt: null } }),
      prisma.gameSession.count({ where: { createdById: session.user.id } }),
      prisma.event.count({ where: { createdById: session.user.id } }),
      prisma.group.count({ where: { ownerId: session.user.id } }),
    ]);

    return NextResponse.json({
      user: session.user,
      totals: { ownedGames, sessions, events, groups },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
