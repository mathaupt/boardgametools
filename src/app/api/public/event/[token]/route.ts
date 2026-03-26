import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findPublicEventByToken } from "@/lib/event-share";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-event:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const session = await auth();
  const { token } = await params;

  const event = await findPublicEventByToken(
    token,
    buildPublicEventInclude(session?.user?.id)
  );

  if (!event) {
    return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
  }

  const serialized = serializePublicEvent(event, session?.user?.id ?? null);

  return NextResponse.json(serialized);
});
