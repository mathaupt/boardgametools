import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { encryptId } from "@/lib/crypto";
import { getPublicBaseUrl } from "@/lib/public-link";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      select: {
        id: true,
        shareToken: true,
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const shareToken = event.shareToken ?? encryptId(event.id);

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        isPublic: true,
        shareToken,
      },
      select: {
        id: true,
        shareToken: true,
      },
    });

    const publicUrl = `${await getPublicBaseUrl()}/public/event/${updatedEvent.shareToken}`;

    return NextResponse.json({
      shareToken: updatedEvent.shareToken,
      publicUrl,
    });
  } catch (error) {
    console.error("Error publishing event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
