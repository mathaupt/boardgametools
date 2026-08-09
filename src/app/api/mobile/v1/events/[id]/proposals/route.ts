import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { NOT_DELETED } from "@/lib/services/shared";
import { hasEventAccess, mapProposal, proposalInclude } from "../_helpers";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(_request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const event = await prisma.event.findFirst({
      where: { id, ...NOT_DELETED },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (!hasEventAccess(event, session.user.id)) {
      throw new ApiError(403, Errors.ACCESS_DENIED);
    }

    const proposals = await prisma.gameProposal.findMany({
      where: { eventId: id },
      include: proposalInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      proposals.map((proposal) => mapProposal(proposal, session.user.id))
    );
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const body = (await request.json()) as { gameId?: string };
    const { gameId } = body;

    if (!gameId) {
      throw new ApiError(400, Errors.MISSING_GAME_ID);
    }

    const event = await prisma.event.findFirst({
      where: { id, ...NOT_DELETED },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (!hasEventAccess(event, session.user.id)) {
      throw new ApiError(403, Errors.ACCESS_DENIED);
    }

    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: session.user.id, deletedAt: null },
    });

    if (!game) throw new ApiError(404, Errors.GAME_NOT_FOUND);

    const existing = await prisma.gameProposal.findFirst({
      where: { eventId: id, gameId },
    });

    if (existing) throw new ApiError(400, Errors.GAME_ALREADY_PROPOSED);

    const proposal = await prisma.gameProposal.create({
      data: {
        eventId: id,
        gameId,
        proposedById: session.user.id,
      },
      include: proposalInclude,
    });

    return NextResponse.json(
      mapProposal(proposal, session.user.id),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get("proposalId");

    if (!proposalId) {
      throw new ApiError(400, Errors.MISSING_PROPOSAL_ID);
    }

    const proposal = await prisma.gameProposal.findFirst({
      where: { id: proposalId, eventId: id, proposedById: session.user.id },
    });

    if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);

    await prisma.gameProposal.delete({ where: { id: proposalId } });

    return NextResponse.json({ message: Errors.PROPOSAL_DELETED });
  } catch (error) {
    return handleApiError(error);
  }
});
