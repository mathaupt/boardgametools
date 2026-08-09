import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { NOT_DELETED } from "@/lib/services/shared";
import { toSessionDto } from "@/lib/dto-mappers";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(_request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const sessions = await prisma.gameSession.findMany({
      where: { gameId: id, createdById: session.user.id, ...NOT_DELETED },
      include: { players: { select: { id: true, userId: true, score: true, isWinner: true, placement: true } } },
      orderBy: { playedAt: "desc" },
    });

    return NextResponse.json(sessions.map(toSessionDto));
  } catch (error) {
    return handleApiError(error);
  }
});
