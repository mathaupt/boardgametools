import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findPublicEventByToken } from "@/lib/event-share";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  const { token } = await params;

  const event = await findPublicEventByToken(
    token,
    buildPublicEventInclude(session?.user?.id)
  );

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const serialized = serializePublicEvent(event, session?.user?.id ?? null);

  return NextResponse.json(serialized);
});
