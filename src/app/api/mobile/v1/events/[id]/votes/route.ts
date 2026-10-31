import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toVoteDto } from "@/lib/dto-mappers";
import { withEventMutation } from "@/lib/services/event-mutation.service";

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

    const vote = await withEventMutation(
      { kind: "user", eventId: id, userId: session.user.id },
      "voteGame",
      async ({ tx }) => {
        const proposal = await tx.gameProposal.findFirst({ where: { id: proposalId, eventId: id }, select: { id: true } });
        if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);
        const existing = await tx.vote.findUnique({ where: { proposalId_userId: { proposalId, userId: session.user.id } } });
        if (existing) throw new ApiError(400, Errors.ALREADY_VOTED);
        return tx.vote.create({ data: { proposalId, userId: session.user.id } });
      }
    );

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

    await withEventMutation(
      { kind: "user", eventId: id, userId: session.user.id },
      "voteGame",
      async ({ tx }) => {
        const proposal = await tx.gameProposal.findFirst({ where: { id: proposalId, eventId: id }, select: { id: true } });
        if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);
        const deleted = await tx.vote.deleteMany({ where: { proposalId, userId: session.user.id } });
        if (deleted.count === 0) throw new ApiError(404, Errors.VOTE_NOT_FOUND);
      }
    );

    return NextResponse.json({ message: Errors.VOTE_REMOVED });
  } catch (error) {
    return handleApiError(error);
  }
});
