import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

// POST: Auf Terminvorschlag abstimmen (eingeloggter User)
// Body: { dateProposalId: string, availability: "yes" | "maybe" | "no" }
export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

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
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((i) => i.userId === userId);
    const hasAccess = event.createdById === userId || isInvited;

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
          userId: userId,
        },
      },
      update: { availability },
      create: {
        dateProposalId,
        userId: userId,
        availability,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(vote, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT: Bulk-Vote – mehrere Terminvorschläge auf einmal abstimmen
// Body: { votes: [{ dateProposalId: string, availability: "yes"|"maybe"|"no" }] }
export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

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

    const validAvailabilities = ["yes", "maybe", "no"];
    for (const v of votes) {
      if (!v.availability || !validAvailabilities.includes(v.availability)) {
        return NextResponse.json(
          { error: "availability must be 'yes', 'maybe', or 'no'" },
          { status: 400 }
        );
      }
    }

    // Prüfe ob Event existiert und User Zugang hat
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((i) => i.userId === userId);
    const hasAccess = event.createdById === userId || isInvited;

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
              userId: userId,
            },
          },
          update: { availability: v.availability },
          create: {
            dateProposalId: v.dateProposalId,
            userId: userId,
            availability: v.availability,
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    return handleApiError(error);
  }
});
