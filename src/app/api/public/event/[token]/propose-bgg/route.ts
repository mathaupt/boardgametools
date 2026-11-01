import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";
import { fetchBGGGame } from "@/lib/bgg";
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
  const { allowed, retryAfterMs } = checkRateLimit(`pub-propose-bgg:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const session = await auth();
  const { token } = await params;
  const eventId = await resolveEventIdFromToken(token);

  if (!eventId) {
    return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { bggId, guestId } = body ?? {};

    const validationError = firstError(
      validateString(bggId == null ? "" : String(bggId), "bggId", { min: 1, max: 20 }),
      validateString(guestId, "guestId", { required: false, max: 100 })
    );
    if (validationError) {
      throw new ApiError(400, validationError);
    }
    if (!/^\d{1,12}$/.test(String(bggId))) {
      throw new ApiError(400, "Die BGG-ID muss aus 1 bis 12 Ziffern bestehen.");
    }

    // Must be either a logged-in user or a registered guest
    if (!session?.user?.id && !guestId) {
      throw new ApiError(401, "Bitte als Gast registrieren oder einloggen");
    }

    const eventId = await resolveEventIdFromToken(token);
    if (!eventId) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (guestId) {
      const guest = await prisma.guestParticipant.findFirst({ where: { id: guestId, eventId }, select: { id: true } });
      if (!guest) throw new ApiError(404, Errors.GUEST_NOT_FOUND_FOR_EVENT);
    }

    // Fetch game data from BGG using the robust library function (handles 202, retries, auth token)
    const bggGame = await fetchBGGGame(String(bggId));

    if (!bggGame) {
      throw new ApiError(404, "Spiel konnte auf BGG nicht gefunden werden. Bitte versuche es erneut.");
    }

    const proposal = await withEventMutation(
      { kind: "public", token, userId: session?.user?.id, guestId: guestId ?? undefined },
      "proposeGame",
      async ({ tx, eventId: lockedEventId }) => {
        if (guestId) {
          const guest = await tx.guestParticipant.findFirst({ where: { id: guestId, eventId: lockedEventId }, select: { id: true } });
          if (!guest) throw new ApiError(404, Errors.GUEST_NOT_FOUND_FOR_EVENT);
        }
        const duplicate = await tx.gameProposal.findFirst({
          where: { eventId: lockedEventId, OR: [{ bggId: String(bggId) }, { game: { bggId: String(bggId) } }] },
          select: { id: true },
        });
        if (duplicate) throw new ApiError(400, "Dieses Spiel wurde bereits vorgeschlagen");
        return tx.gameProposal.create({
          data: {
            eventId: lockedEventId,
            proposedById: session?.user?.id ?? null,
            guestId: guestId ?? null,
            bggId: String(bggId),
            bggName: bggGame.name,
            bggImageUrl: bggGame.imageUrl,
            bggMinPlayers: bggGame.minPlayers,
            bggMaxPlayers: bggGame.maxPlayers,
            bggPlayTimeMinutes: bggGame.playTimeMinutes,
          },
          include: {
            game: true,
            proposedBy: { select: { id: true, name: true } },
            guest: { select: { id: true, nickname: true } },
            _count: { select: { votes: true, guestVotes: true } },
          },
        });
      }
    );

    // Build a unified response matching the serialized proposal format
    const gameData = {
      id: `bgg-${proposal.bggId}`,
      name: proposal.bggName!,
      imageUrl: proposal.bggImageUrl,
      minPlayers: proposal.bggMinPlayers,
      maxPlayers: proposal.bggMaxPlayers,
      playTimeMinutes: proposal.bggPlayTimeMinutes,
    };

    const proposedByData = proposal.proposedBy
      ? { id: proposal.proposedBy.id, name: proposal.proposedBy.name }
      : proposal.guest
        ? { id: proposal.guest.id, name: proposal.guest.nickname }
        : null;

    return NextResponse.json(
      {
        id: proposal.id,
        game: gameData,
        proposedBy: proposedByData,
        totalVotes: 0,
        voteCounts: { registered: 0, guests: 0 },
        userHasVoted: false,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
