import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

// POST: Reset a date poll (clear proposals and reopen voting)
export const POST = withApiLogging(async function POST(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== userId) {
      return NextResponse.json(
        { error: "Only the event creator can reset the date poll" },
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

    return NextResponse.json({ message: "Date poll reset" });
  } catch (error) {
    return handleApiError(error);
  }
});
