import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// POST: Auf Terminvorschlag abstimmen (eingeloggter User)
// Body: { dateProposalId: string, availability: "yes" | "maybe" | "no" }
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
    const { dateProposalId, availability } = body;

    if (!dateProposalId || !availability) {
      return NextResponse.json(
        { error: "Missing required fields: dateProposalId, availability" },
        { status: 400 }
      );
    }

    if (!["yes", "maybe", "no"].includes(availability)) {
      return NextResponse.json(
        { error: "availability must be 'yes', 'maybe', or 'no'" },
        { status: 400 }
      );
    }

    // Prüfe ob Event existiert und User Zugang hat
    const event = await prisma.event.findUnique({
      where: { id },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((i) => i.userId === session.user.id);
    const hasAccess = event.createdById === session.user.id || isInvited;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prüfe ob DateProposal zum Event gehört
    const proposal = await prisma.dateProposal.findFirst({
      where: { id: dateProposalId, eventId: id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Date proposal not found for this event" },
        { status: 404 }
      );
    }

    // Upsert Vote
    const vote = await prisma.dateVote.upsert({
      where: {
        dateProposalId_userId: {
          dateProposalId,
          userId: session.user.id,
        },
      },
      update: { availability },
      create: {
        dateProposalId,
        userId: session.user.id,
        availability,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(vote, { status: 200 });
  } catch (error) {
    console.error("Error voting on date proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Bulk-Vote – mehrere Terminvorschläge auf einmal abstimmen
// Body: { votes: [{ dateProposalId: string, availability: "yes"|"maybe"|"no" }] }
export async function PUT(
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
    const { votes } = body;

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json(
        { error: "Provide a non-empty 'votes' array" },
        { status: 400 }
      );
    }

    // Prüfe ob Event existiert und User Zugang hat
    const event = await prisma.event.findUnique({
      where: { id },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((i) => i.userId === session.user.id);
    const hasAccess = event.createdById === session.user.id || isInvited;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Bulk upsert in transaction
    const results = await prisma.$transaction(
      votes.map((v: { dateProposalId: string; availability: string }) =>
        prisma.dateVote.upsert({
          where: {
            dateProposalId_userId: {
              dateProposalId: v.dateProposalId,
              userId: session.user.id,
            },
          },
          update: { availability: v.availability },
          create: {
            dateProposalId: v.dateProposalId,
            userId: session.user.id,
            availability: v.availability,
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error bulk voting on date proposals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
