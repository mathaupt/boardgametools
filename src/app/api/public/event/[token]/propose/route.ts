import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
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
  const { allowed, retryAfterMs } = checkRateLimit(`pub-propose:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 401 });
  }

  const { token } = await params;
  try {
    const body = await request.json();
    const { gameId } = body ?? {};

    const validationError = validateString(gameId, "gameId", { min: 1, max: 100 });
    if (validationError) throw new ApiError(400, validationError);

    const proposal = await withEventMutation(
      { kind: "public", token, userId: session.user.id },
      "proposeGame",
      async ({ tx, eventId }) => {
        const game = await tx.game.findFirst({ where: { id: gameId, ownerId: session.user!.id, deletedAt: null } });
        if (!game) throw new ApiError(404, Errors.GAME_NOT_FOUND);
        const existingProposal = await tx.gameProposal.findFirst({ where: { eventId, gameId } });
        if (existingProposal) throw new ApiError(400, Errors.GAME_ALREADY_PROPOSED);
        return tx.gameProposal.create({
          data: { eventId, gameId, proposedById: session.user!.id },
          include: {
            game: true,
            proposedBy: { select: { id: true, name: true, email: true } },
            _count: { select: { votes: true, guestVotes: true } },
          },
        });
      }
    );

    return NextResponse.json({
      ...proposal,
      totalVotes: proposal._count.votes + proposal._count.guestVotes,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
