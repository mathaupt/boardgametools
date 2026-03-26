import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });

    if (!event) {
      return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
    }

    if (event.createdById !== userId) {
      return NextResponse.json(
        { error: Errors.ONLY_CREATOR_CAN_RESET },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.dateProposal.deleteMany({ where: { eventId: id } }),
      prisma.event.update({
        where: { id },
        data: { selectedDate: null },
      }),
    ]);

    return NextResponse.json({ message: Errors.DATE_POLL_RESET });
  } catch (error) {
    return handleApiError(error);
  }
});
