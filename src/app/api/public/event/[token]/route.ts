import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findPublicEventByToken } from "@/lib/event-share";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
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
}
