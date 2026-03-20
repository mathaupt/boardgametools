import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { token } = await params;
  const eventId = await resolveEventIdFromToken(token);

  if (!eventId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const nickname = (body?.nickname as string | undefined)?.trim();

    const validationError = validateString(nickname, "nickname", { min: 1, max: 80 });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const participant = await prisma.guestParticipant.upsert({
      where: {
        eventId_nickname: {
          eventId,
          nickname: nickname!,
        },
      },
      create: {
        eventId,
        nickname: nickname!,
      },
      update: {},
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error("Error joining public event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
