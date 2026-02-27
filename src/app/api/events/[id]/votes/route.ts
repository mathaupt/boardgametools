import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        invites: {
          select: { userId: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((invite) => invite.userId === session.user.id);
    const hasAccess = event.createdById === session.user.id || isInvited || event.isPublic;

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
        userId: session.user.id 
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
        userId: session.user.id
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
    console.error("Error creating vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        userId: session.user.id 
      }
    });

    if (deletedVote.count === 0) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Vote removed" });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
