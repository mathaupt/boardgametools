import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

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

    // Prüfe ob Event existiert und User Berechtigung hat
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

    // Prüfe ob Spiel dem User gehört
    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: userId, deletedAt: null }
    });

    if (!game) {
      return NextResponse.json({ error: Errors.GAME_NOT_FOUND }, { status: 404 });
    }

    // Prüfe ob Spiel bereits vorgeschlagen wurde
    const existingProposal = await prisma.gameProposal.findFirst({
      where: { eventId: id, gameId }
    });

    if (existingProposal) {
      return NextResponse.json({ 
        error: Errors.GAME_ALREADY_PROPOSED 
      }, { status: 400 });
    }

    // Erstelle Game Proposal
    const proposal = await prisma.gameProposal.create({
      data: {
        eventId: id,
        gameId,
        proposedById: userId
      },
      include: {
        game: true,
        proposedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { votes: true, guestVotes: true } }
      }
    });

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
    // Prüfe ob Proposal existiert und User Berechtigung hat
    const proposal = await prisma.gameProposal.findFirst({
      where: { 
        id: proposalId, 
        eventId: id,
        proposedById: userId 
      }
    });

    if (!proposal) {
      return NextResponse.json({ error: Errors.PROPOSAL_NOT_FOUND }, { status: 404 });
    }

    // Lösche Proposal und dazugehörige Votes
    await prisma.gameProposal.delete({
      where: { id: proposalId }
    });

    return NextResponse.json({ message: Errors.PROPOSAL_DELETED });
  } catch (error) {
    return handleApiError(error);
  }
});
