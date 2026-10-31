import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { withEventMutation } from "@/lib/services/event-mutation.service";

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

    if (!dateProposalId || !availability) throw new ApiError(400, "Missing required fields: dateProposalId, availability");

    if (!["yes", "maybe", "no"].includes(availability)) {
      throw new ApiError(400, "availability must be 'yes', 'maybe', or 'no'");
    }

    const vote = await withEventMutation(
      { kind: "user", eventId: id, userId },
      "voteDate",
      async ({ tx }) => {
        const proposal = await tx.dateProposal.findFirst({ where: { id: dateProposalId, eventId: id }, select: { id: true } });
        if (!proposal) throw new ApiError(404, "Date proposal not found for this event");
        return tx.dateVote.upsert({
          where: { dateProposalId_userId: { dateProposalId, userId } },
          update: { availability },
          create: { dateProposalId, userId, availability },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
      }
    );

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

    if (!votes || !Array.isArray(votes) || votes.length === 0) throw new ApiError(400, "Provide a non-empty 'votes' array");

    const validAvailabilities = ["yes", "maybe", "no"];
    for (const v of votes) {
      if (!v.availability || !validAvailabilities.includes(v.availability)) {
        throw new ApiError(400, "availability must be 'yes', 'maybe', or 'no'");
      }
    }

    const proposalIds = votes.map((vote: { dateProposalId: string }) => vote.dateProposalId);
    if (proposalIds.some((proposalId: string) => !proposalId)) throw new ApiError(400, "Missing dateProposalId");
    if (new Set(proposalIds).size !== proposalIds.length) throw new ApiError(400, "Terminvorschläge dürfen nicht doppelt enthalten sein.");

    const results = await withEventMutation(
      { kind: "user", eventId: id, userId },
      "voteDate",
      async ({ tx }) => {
        const found = await tx.dateProposal.findMany({ where: { id: { in: proposalIds }, eventId: id }, select: { id: true } });
        if (found.length !== proposalIds.length) throw new ApiError(404, "Date proposal not found for this event");
        const results = [];
        for (const vote of votes as { dateProposalId: string; availability: string }[]) {
          results.push(await tx.dateVote.upsert({
          where: {
            dateProposalId_userId: { dateProposalId: vote.dateProposalId, userId },
          },
          update: { availability: vote.availability },
          create: {
            dateProposalId: vote.dateProposalId,
            userId,
            availability: vote.availability,
          },
          }));
        }
        return results;
      }
    );

    return NextResponse.json(results);
  } catch (error) {
    return handleApiError(error);
  }
});
