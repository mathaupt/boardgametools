import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const eventId = await resolveEventIdFromToken(token);

  if (!eventId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const nickname = (body?.nickname as string | undefined)?.trim();

    if (!nickname) {
      return NextResponse.json({ error: "Nickname is required" }, { status: 400 });
    }

    const safeNickname = nickname.slice(0, 80);

    const participant = await prisma.guestParticipant.upsert({
      where: {
        eventId_nickname: {
          eventId,
          nickname: safeNickname,
        },
      },
      create: {
        eventId,
        nickname: safeNickname,
      },
      update: {},
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error("Error joining public event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
