import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toDateVoteDto } from "@/lib/dto-mappers";
import { NOT_DELETED } from "@/lib/services/shared";
import { hasEventAccess } from "../../_helpers";

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

    const event = await prisma.event.findFirst({
      where: { id, ...NOT_DELETED },
      include: { invites: { select: { userId: true } } },
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (!hasEventAccess(event, session.user.id)) {
      throw new ApiError(403, Errors.ACCESS_DENIED);
    }

    const proposalIds = [...new Set(votes.map((v) => v.dateProposalId).filter(Boolean))];

    if (proposalIds.length === 0) {
      throw new ApiError(400, Errors.MISSING_DATE_PROPOSAL_ID);
    }

    const existingProposals = await prisma.dateProposal.findMany({
      where: { id: { in: proposalIds as string[] }, eventId: id },
    });

    if (existingProposals.length !== proposalIds.length) {
      throw new ApiError(404, Errors.DATE_PROPOSAL_NOT_FOUND);
    }

    const results = await prisma.$transaction(
      votes.map((vote) =>
        prisma.dateVote.upsert({
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
        })
      )
    );

    return NextResponse.json(results.map(toDateVoteDto));
  } catch (error) {
    return handleApiError(error);
  }
});
