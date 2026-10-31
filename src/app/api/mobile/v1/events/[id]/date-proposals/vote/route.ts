import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toDateVoteDto } from "@/lib/dto-mappers";
import { withEventMutation } from "@/lib/services/event-mutation.service";

type RouteContext = { params: Promise<{ id: string }> };

const validAvailabilities = ["yes", "maybe", "no"];

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const body = (await request.json()) as {
      votes?: { dateProposalId?: string; availability?: string }[];
    };
    const { votes } = body;

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      throw new ApiError(400, Errors.MISSING_REQUIRED_FIELDS);
    }

    for (const vote of votes) {
      if (!vote.dateProposalId) {
        throw new ApiError(400, Errors.MISSING_DATE_PROPOSAL_ID);
      }
      if (!vote.availability || !validAvailabilities.includes(vote.availability)) {
        throw new ApiError(400, Errors.INVALID_STATUS);
      }
    }

    const proposalIds = votes.map((v) => v.dateProposalId as string);
    if (new Set(proposalIds).size !== proposalIds.length) {
      throw new ApiError(400, "Terminvorschläge dürfen nicht doppelt enthalten sein.");
    }

    const results = await withEventMutation(
      { kind: "user", eventId: id, userId: session.user.id },
      "voteDate",
      async ({ tx }) => {
        const existingProposals = await tx.dateProposal.findMany({
          where: { id: { in: proposalIds }, eventId: id },
          select: { id: true },
        });
        if (existingProposals.length !== proposalIds.length) throw new ApiError(404, Errors.DATE_PROPOSAL_NOT_FOUND);

        const results = [];
        for (const vote of votes) {
          results.push(await tx.dateVote.upsert({
          where: {
            dateProposalId_userId: {
              dateProposalId: vote.dateProposalId as string,
              userId: session.user.id,
            },
          },
          update: { availability: vote.availability as string },
          create: {
            dateProposalId: vote.dateProposalId as string,
            userId: session.user.id,
            availability: vote.availability as string,
          },
          }));
        }
        return results;
      }
    );

    return NextResponse.json(results.map(toDateVoteDto));
  } catch (error) {
    return handleApiError(error);
  }
});
