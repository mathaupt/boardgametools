import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";
import * as PushService from "@/lib/services/push.service";
import logger from "@/lib/logger";

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

    // Prüfe ob Event existiert
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        invites: {
          select: { userId: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
    }

    const isInvited = event.invites.some((invite) => invite.userId === userId);
    const hasAccess = event.createdById === userId || isInvited || event.isPublic;

    if (!hasAccess) {
      return NextResponse.json({ error: Errors.ACCESS_DENIED }, { status: 403 });
    }

    // Prüfe ob Proposal existiert
    const proposal = await prisma.gameProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      return NextResponse.json({ error: Errors.PROPOSAL_NOT_FOUND }, { status: 404 });
    }

    // Prüfe ob User bereits gevotet hat
    const existingVote = await prisma.vote.findFirst({
      where: { 
        proposalId, 
        userId: userId 
      }
    });

    if (existingVote) {
      return NextResponse.json({ 
        error: Errors.ALREADY_VOTED 
      }, { status: 400 });
    }

    // Erstelle Vote
    const vote = await prisma.vote.create({
      data: {
        proposalId,
        userId: userId
      },
      include: {
        proposal: {
          include: {
            game: true,
            _count: { select: { votes: true } }
          }
        }
      }
    });

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

  const { id: _id } = await params;
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");

  if (!proposalId) {
    return NextResponse.json({ 
      error: Errors.MISSING_PROPOSAL_ID 
    }, { status: 400 });
  }

  try {
    // Lösche Vote des Users für dieses Proposal
    const deletedVote = await prisma.vote.deleteMany({
      where: { 
        proposalId, 
        userId: userId 
      }
    });

    if (deletedVote.count === 0) {
      return NextResponse.json({ error: Errors.VOTE_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ message: Errors.VOTE_REMOVED });
  } catch (error) {
    return handleApiError(error);
  }
});
