import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toVoteDto } from "@/lib/dto-mappers";
import { NOT_DELETED } from "@/lib/services/shared";
import { hasEventAccess } from "../_helpers";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const { proposalId } = (await request.json()) as { proposalId?: string };

    if (!proposalId) {
      throw new ApiError(400, Errors.MISSING_PROPOSAL_ID);
    }

    const event = await prisma.event.findFirst({
      where: { id, ...NOT_DELETED },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (!hasEventAccess(event, session.user.id)) {
      throw new ApiError(403, Errors.ACCESS_DENIED);
    }

    const proposal = await prisma.gameProposal.findFirst({
      where: { id: proposalId, eventId: id },
    });

    if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);

    const existing = await prisma.vote.findUnique({
      where: {
        proposalId_userId: { proposalId, userId: session.user.id },
      },
    });

    if (existing) throw new ApiError(400, Errors.ALREADY_VOTED);

    const vote = await prisma.vote.create({
      data: { proposalId, userId: session.user.id },
    });

    return NextResponse.json(toVoteDto(vote), { status: 201 });
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

    const event = await prisma.event.findFirst({
      where: { id, ...NOT_DELETED },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (!hasEventAccess(event, session.user.id)) {
      throw new ApiError(403, Errors.ACCESS_DENIED);
    }

    const proposal = await prisma.gameProposal.findFirst({
      where: { id: proposalId, eventId: id },
    });

    if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);

    const deleted = await prisma.vote.deleteMany({
      where: { proposalId, userId: session.user.id },
    });

    if (deleted.count === 0) throw new ApiError(404, Errors.VOTE_NOT_FOUND);

    return NextResponse.json({ message: Errors.VOTE_REMOVED });
  } catch (error) {
    return handleApiError(error);
  }
});
