import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

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
        error: "Missing required field: proposalId" 
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
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((invite) => invite.userId === userId);
    const hasAccess = event.createdById === userId || isInvited || event.isPublic;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prüfe ob Proposal existiert
    const proposal = await prisma.gameProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
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
        error: "User has already voted for this proposal" 
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
      error: "Missing required parameter: proposalId" 
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
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Vote removed" });
  } catch (error) {
    return handleApiError(error);
  }
});
