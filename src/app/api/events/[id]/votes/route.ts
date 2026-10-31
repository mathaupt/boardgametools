import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";
import * as PushService from "@/lib/services/push.service";
import logger from "@/lib/logger";
import { withEventMutation } from "@/lib/services/event-mutation.service";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const body = await request.json();
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json({ 
        error: Errors.MISSING_PROPOSAL_ID 
      }, { status: 400 });
    }

    const { event, vote } = await withEventMutation(
      { kind: "user", eventId: id, userId },
      "voteGame",
      async ({ tx, event }) => {
        const proposal = await tx.gameProposal.findFirst({ where: { id: proposalId, eventId: id } });
        if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);
        const existingVote = await tx.vote.findFirst({ where: { proposalId, userId } });
        if (existingVote) throw new ApiError(400, Errors.ALREADY_VOTED);
        const vote = await tx.vote.create({
          data: { proposalId, userId },
          include: { proposal: { include: { game: true, _count: { select: { votes: true } } } } },
        });
        return { event, vote };
      }
    );

    // Notify the event creator about the new vote (not the voter itself)
    if (event.createdById !== userId) {
      try {
        const voter = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        const voterName = voter?.name || voter?.email || "Jemand";
        await PushService.notifyNewVote(event.createdById, id, event.title, voterName);
      } catch (pushErr) {
        logger.error({ err: pushErr }, "Failed to send new vote push");
      }
    }

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");

  if (!proposalId) {
    return NextResponse.json({ 
      error: Errors.MISSING_PROPOSAL_ID 
    }, { status: 400 });
  }

  try {
    await withEventMutation(
      { kind: "user", eventId: id, userId },
      "voteGame",
      async ({ tx }) => {
        const proposal = await tx.gameProposal.findFirst({ where: { id: proposalId, eventId: id }, select: { id: true } });
        if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);
        const deletedVote = await tx.vote.deleteMany({ where: { proposalId, userId } });
        if (deletedVote.count === 0) throw new ApiError(404, Errors.VOTE_NOT_FOUND);
      }
    );

    return NextResponse.json({ message: Errors.VOTE_REMOVED });
  } catch (error) {
    return handleApiError(error);
  }
});
