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
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ 
        error: Errors.MISSING_GAME_ID 
      }, { status: 400 });
    }

    const { event, proposal } = await withEventMutation(
      { kind: "user", eventId: id, userId },
      "proposeGame",
      async ({ tx, event }) => {
        const game = await tx.game.findFirst({ where: { id: gameId, ownerId: userId, deletedAt: null } });
        if (!game) throw new ApiError(404, Errors.GAME_NOT_FOUND);
        const existingProposal = await tx.gameProposal.findFirst({ where: { eventId: id, gameId } });
        if (existingProposal) throw new ApiError(400, Errors.GAME_ALREADY_PROPOSED);
        const proposal = await tx.gameProposal.create({
          data: { eventId: id, gameId, proposedById: userId },
          include: {
            game: true,
            proposedBy: { select: { id: true, name: true, email: true } },
            _count: { select: { votes: true, guestVotes: true } },
          },
        });
        return { event, proposal };
      }
    );

    // Notify the event creator about the new proposal
    if (event.createdById !== userId) {
      try {
        const proposer = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        const proposerName = proposer?.name || proposer?.email || "Jemand";
        const gameName = proposal.game?.name || proposal.bggName || "Unbekannt";
        await PushService.notifyNewGameProposal(event.createdById, id, event.title, proposerName, gameName);
      } catch (pushErr) {
        logger.error({ err: pushErr }, "Failed to send new proposal push");
      }
    }

    return NextResponse.json({
      ...proposal,
      totalVotes: proposal._count.votes + proposal._count.guestVotes,
    }, { status: 201 });
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
      "proposeGame",
      async ({ tx }) => {
        const proposal = await tx.gameProposal.findFirst({
          where: { id: proposalId, eventId: id, proposedById: userId },
          select: { id: true },
        });
        if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);
        await tx.gameProposal.delete({ where: { id: proposalId } });
      }
    );

    return NextResponse.json({ message: Errors.PROPOSAL_DELETED });
  } catch (error) {
    return handleApiError(error);
  }
});
