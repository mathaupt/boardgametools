import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { Errors } from "@/lib/error-messages";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { withEventMutation } from "@/lib/services/event-mutation.service";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-vote:${ip}`, 20, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;
  try {
    const body = await request.json();
    const guestId = body?.guestId as string | undefined;
    const proposalId = body?.proposalId as string | undefined;

    const validationError = firstError(
      validateString(guestId, "guestId", { max: 100 }),
      validateString(proposalId, "proposalId", { max: 100 })
    );
    if (validationError) {
      throw new ApiError(400, validationError);
    }

    if (!guestId || !proposalId) {
      throw new ApiError(400, Errors.GUEST_ID_AND_PROPOSAL_REQUIRED);
    }

    const result = await withEventMutation(
      { kind: "public", token, guestId },
      "voteGame",
      async ({ tx, eventId }) => {
        const participant = await tx.guestParticipant.findFirst({ where: { id: guestId, eventId }, select: { id: true } });
        if (!participant) throw new ApiError(404, Errors.GUEST_NOT_FOUND_FOR_EVENT);
        const proposal = await tx.gameProposal.findFirst({ where: { id: proposalId, eventId }, select: { id: true } });
        if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);
        const existingVote = await tx.guestVote.findFirst({ where: { guestId, proposalId }, select: { id: true } });
        if (existingVote) throw new ApiError(400, Errors.GUEST_ALREADY_VOTED);
        await tx.guestVote.create({ data: { guestId, proposalId } });
        const counts = await tx.gameProposal.findUnique({ where: { id: proposalId }, select: { _count: { select: { votes: true, guestVotes: true } } } });
        return { message: Errors.VOTE_RECORDED, totalVotes: (counts?._count.votes ?? 0) + (counts?._count.guestVotes ?? 0), voteCounts: counts?._count ?? { votes: 0, guestVotes: 0 } };
      }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-vote-del:${ip}`, 20, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");
    const proposalId = searchParams.get("proposalId");

    const deleteValidationError = firstError(
      validateString(guestId, "guestId", { max: 100 }),
      validateString(proposalId, "proposalId", { max: 100 })
    );
    if (deleteValidationError) {
      throw new ApiError(400, deleteValidationError);
    }

    if (!guestId || !proposalId) {
      throw new ApiError(400, Errors.GUEST_ID_AND_PROPOSAL_REQUIRED);
    }

    const result = await withEventMutation(
      { kind: "public", token, guestId },
      "voteGame",
      async ({ tx, eventId }) => {
        const participant = await tx.guestParticipant.findFirst({ where: { id: guestId, eventId }, select: { id: true } });
        if (!participant) throw new ApiError(404, Errors.GUEST_NOT_FOUND_FOR_EVENT);
        const proposal = await tx.gameProposal.findFirst({ where: { id: proposalId, eventId }, select: { id: true } });
        if (!proposal) throw new ApiError(404, Errors.PROPOSAL_NOT_FOUND);
        const deleted = await tx.guestVote.deleteMany({ where: { guestId, proposalId } });
        if (!deleted.count) throw new ApiError(404, Errors.VOTE_NOT_FOUND);
        const counts = await tx.gameProposal.findUnique({ where: { id: proposalId }, select: { _count: { select: { votes: true, guestVotes: true } } } });
        return { message: Errors.VOTE_REMOVED, totalVotes: (counts?._count.votes ?? 0) + (counts?._count.guestVotes ?? 0), voteCounts: counts?._count ?? { votes: 0, guestVotes: 0 } };
      }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
