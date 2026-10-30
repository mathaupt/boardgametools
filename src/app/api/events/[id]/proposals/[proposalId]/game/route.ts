import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { handleApiError, requireAuth } from "@/lib/require-auth";
import { EventProposalService } from "@/lib/services/event-proposal.service";

type RouteContext = { params: Promise<{ id: string; proposalId: string }> };

function privateNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { userId } = await requireAuth();
    const { id, proposalId } = await params;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(id) || !/^[A-Za-z0-9_-]{1,100}$/.test(proposalId)) {
      return privateNoStore(NextResponse.json({ error: "Ungültige Event- oder Vorschlags-ID." }, { status: 400 }));
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const limit = await checkRateLimitAsync(`event-proposal-detail:${ip}`, 60, 60_000);
    if (!limit.allowed) return privateNoStore(rateLimitResponse(limit.retryAfterMs));

    const detail = await EventProposalService.getGameDetail(
      { kind: "private", eventId: id, userId },
      proposalId,
    );
    return privateNoStore(NextResponse.json(detail));
  } catch (error) {
    return privateNoStore(handleApiError(error));
  }
});
