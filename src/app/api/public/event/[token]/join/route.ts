import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { withEventMutation } from "@/lib/services/event-mutation.service";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-join:${ip}`, 5, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;
  try {
    const body = await request.json();
    const nickname = (body?.nickname as string | undefined)?.trim();

    const validationError = validateString(nickname, "nickname", { min: 1, max: 80 });
    if (validationError) {
      throw new ApiError(400, validationError);
    }

    const participant = await withEventMutation(
      { kind: "public", token },
      "join",
      async ({ tx, eventId }) => tx.guestParticipant.upsert({
        where: { eventId_nickname: { eventId, nickname: nickname! } },
        create: { eventId, nickname: nickname! },
        update: {},
        include: { _count: { select: { votes: true } } },
      })
    );

    return NextResponse.json({
      id: participant.id,
      nickname: participant.nickname,
      createdAt: participant.createdAt.toISOString(),
      votesCount: participant._count.votes,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
