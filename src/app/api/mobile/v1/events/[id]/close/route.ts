import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toEventDto } from "@/lib/dto-mappers";
import { EventService } from "@/lib/services/event.service";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const { selectedGameId, winningProposalId } = (await request.json()) as {
      selectedGameId?: string;
      winningProposalId?: string;
    };

    const event = await EventService.close(
      session.user.id,
      id,
      selectedGameId,
      winningProposalId
    );

    return NextResponse.json(toEventDto(event));
  } catch (error) {
    return handleApiError(error);
  }
});
