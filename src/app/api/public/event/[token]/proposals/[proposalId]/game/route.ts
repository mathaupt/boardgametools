import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/require-auth";
import { EventProposalService } from "@/lib/services/event-proposal.service";

type RouteContext = { params: Promise<{ token: string; proposalId: string }> };

function privateNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { token, proposalId } = await params;
    if (!/^[A-Za-z0-9_-]{1,512}$/.test(token) || !/^[A-Za-z0-9_-]{1,100}$/.test(proposalId)) {
      return privateNoStore(NextResponse.json({ error: "Ungültiger Event-Link oder Vorschlags-ID." }, { status: 400 }));
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const limit = await checkRateLimitAsync(`public-event-proposal-detail:${ip}`, 60, 60_000);
    if (!limit.allowed) return privateNoStore(rateLimitResponse(limit.retryAfterMs));

    const detail = await EventProposalService.getGameDetail({ kind: "public", token }, proposalId);
    return privateNoStore(NextResponse.json(detail));
  } catch (error) {
    return privateNoStore(handleApiError(error));
  }
});
