import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { withEventMutation } from "@/lib/services/event-mutation.service";
import {
  assertGuestMutationOrigin,
  createGuestCredential,
  guestCredentialCookieHeader,
  readGuestCredential,
  verifyGuestCredential,
} from "@/lib/events/guest-credentials";

type RouteContext = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-guest-check:${ip}`, 60, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  try {
    const { token } = await params;
    const guestId = new URL(request.url).searchParams.get("guestId");
    const validationError = validateString(guestId, "guestId", { min: 1, max: 100 });
    if (validationError) throw new ApiError(400, validationError);
    if (!guestId) throw new ApiError(400, "guestId ist erforderlich");

    const eventId = await resolveEventIdFromToken(token);
    if (!eventId) throw new ApiError(404, "Event nicht gefunden");

    const credential = readGuestCredential(request, eventId);
    if (!credential) {
      return NextResponse.json({ authorized: false }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const participant = await prisma.guestParticipant.findFirst({
      where: { id: guestId, eventId },
      select: { id: true, credentialHash: true },
    });
    const authorized = !!participant && verifyGuestCredential(credential, participant.credentialHash);
    return NextResponse.json({ authorized }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-join:${ip}`, 5, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;
  try {
    assertGuestMutationOrigin(request);
    const body = await request.json();
    const nickname = (body?.nickname as string | undefined)?.trim();

    const validationError = validateString(nickname, "nickname", { min: 1, max: 80 });
    if (validationError) {
      throw new ApiError(400, validationError);
    }

    const result = await withEventMutation(
      { kind: "public", token },
      "join",
      async ({ tx, eventId }) => {
        const existing = await tx.guestParticipant.findFirst({
          where: { eventId, nickname: nickname! },
          include: { _count: { select: { votes: true } } },
        });

        if (existing) {
          const credential = readGuestCredential(request, eventId);
          if (!verifyGuestCredential(credential, existing.credentialHash)) {
            throw new ApiError(400, "Dieser Spitzname ist bereits vergeben. Bitte wähle einen neuen; bisherige Stimmen bleiben erhalten.");
          }
          return { participant: existing, created: false, credential: null };
        }

        const credential = createGuestCredential();
        const participant = await tx.guestParticipant.create({
          data: { eventId, nickname: nickname!, credentialHash: credential.credentialHash },
          include: { _count: { select: { votes: true } } },
        });
        return { participant, created: true, credential: credential.credential };
      }
    );

    const response = NextResponse.json({
      id: result.participant.id,
      nickname: result.participant.nickname,
      createdAt: result.participant.createdAt.toISOString(),
      votesCount: result.participant._count.votes,
    }, { status: result.created ? 201 : 200 });
    if (result.credential) {
      response.headers.append("Set-Cookie", guestCredentialCookieHeader(request, result.participant.eventId, token, result.credential));
    }
    return response;
  } catch (error) {
    return handleApiError(error);
  }
});
