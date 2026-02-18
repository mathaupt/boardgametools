import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Event mit allen Details laden
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: true,
        invites: {
          include: { user: true }
        },
        proposals: {
          include: {
            game: true,
            proposedBy: true,
            _count: { select: { votes: true } }
          }
        },
        selectedGame: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Prüfe ob User Berechtigung hat (Ersteller oder eingeladen)
    const isCreator = event.createdById === session.user.id;
    const isInvited = event.invites.some(invite => invite.userId === session.user.id);

    if (!isCreator && !isInvited) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
