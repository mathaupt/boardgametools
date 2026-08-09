import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export interface DashboardDTO {
  games: number;
  sessions: number;
  events: number;
  totalDurationMinutes: number;
}

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    const [games, sessions, events, aggregate] = await prisma.$transaction([
      prisma.game.count({ where: { ownerId: session.user.id, deletedAt: null } }),
      prisma.gameSession.count({ where: { createdById: session.user.id, deletedAt: null } }),
      prisma.event.count({ where: { createdById: session.user.id, deletedAt: null } }),
      prisma.gameSession.aggregate({
        where: { createdById: session.user.id, deletedAt: null },
        _sum: { durationMinutes: true },
      }),
    ]);

    const dto: DashboardDTO = {
      games,
      sessions,
      events,
      totalDurationMinutes: aggregate._sum.durationMinutes ?? 0,
    };

    return NextResponse.json(dto);
  } catch (error) {
    return handleApiError(error);
  }
});
