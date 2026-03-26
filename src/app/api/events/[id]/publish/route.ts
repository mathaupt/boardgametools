import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { encryptId } from "@/lib/crypto";
import { getPublicBaseUrl } from "@/lib/public-link";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: {
        id,
        createdById: userId,
        deletedAt: null,
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
    return handleApiError(error);
  }
});
