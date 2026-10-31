import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { Errors } from "@/lib/error-messages";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { withEventMutation } from "@/lib/services/event-mutation.service";

type RouteContext = { params: Promise<{ token: string }> };

// POST: Gast stimmt über Terminvorschläge ab
// Body: { guestId: string, votes: [{ dateProposalId: string, availability: "yes"|"maybe"|"no" }] }
export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-date-vote:${ip}`, 20, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;

  try {
    const body = await request.json();
    const { guestId, votes } = body;

    const guestIdError = validateString(guestId, "guestId", { max: 100 });
    if (guestIdError) throw new ApiError(400, guestIdError);

    if (!guestId || !votes || !Array.isArray(votes) || votes.length === 0) {
      throw new ApiError(400, Errors.MISSING_GUEST_VOTES);
    }

    if (votes.length > 366) {
      throw new ApiError(400, "Too many votes");
    }

    const validAvailabilities = ["yes", "maybe", "no"];
    for (const v of votes) {
      if (!v.availability || !validAvailabilities.includes(v.availability)) {
        throw new ApiError(400, "availability must be 'yes', 'maybe', or 'no'");
      }
    }

    const proposalIds = votes.map((vote: { dateProposalId?: string }) => vote.dateProposalId);
    if (proposalIds.some((proposalId) => !proposalId)) throw new ApiError(400, Errors.MISSING_DATE_PROPOSAL_ID);
    if (new Set(proposalIds).size !== proposalIds.length) throw new ApiError(400, "Terminvorschläge dürfen nicht doppelt enthalten sein.");

    const results = await withEventMutation(
      { kind: "public", token, guestId },
      "voteDate",
      async ({ tx, eventId }) => {
        const guest = await tx.guestParticipant.findFirst({ where: { id: guestId, eventId }, select: { id: true } });
        if (!guest) throw new ApiError(404, Errors.GUEST_NOT_FOUND_FOR_EVENT);
        const found = await tx.dateProposal.findMany({
          where: { id: { in: proposalIds as string[] }, eventId },
          select: { id: true },
        });
        if (found.length !== proposalIds.length) throw new ApiError(404, Errors.DATE_PROPOSAL_NOT_FOUND);
        const results = [];
        for (const vote of votes as { dateProposalId: string; availability: string }[]) {
          results.push(await tx.guestDateVote.upsert({
          where: {
            dateProposalId_guestId: {
              dateProposalId: vote.dateProposalId,
              guestId,
            },
          },
          update: { availability: vote.availability },
          create: {
            dateProposalId: vote.dateProposalId,
            guestId,
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
