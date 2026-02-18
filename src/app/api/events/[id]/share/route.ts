import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        error: "Missing or invalid userIds array" 
      }, { status: 400 });
    }

    // Prüfe ob Event existiert und User Berechtigung hat
    const event = await prisma.event.findFirst({
      where: { id, createdById: session.user.id }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Erstelle Einladungen für alle User
    const invites = await Promise.all(
      userIds.map(async (userId: string) => {
        // Prüfe ob User bereits eingeladen ist
        const existingInvite = await prisma.eventInvite.findFirst({
          where: { 
            eventId: id,
            userId: userId
          }
        });

        if (existingInvite) {
          return existingInvite;
        }

        // Prüfe ob User existiert
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Erstelle neue Einladung
        return await prisma.eventInvite.create({
          data: {
            eventId: id,
            userId: userId,
            status: "pending"
          },
          include: {
            user: true
          }
        });
      })
    );

    // TODO: Sende Benachrichtigungen an die User
    console.log(`Event ${event.title} shared with ${invites.length} users`);

    return NextResponse.json({
      message: `Event shared with ${invites.length} users`,
      invites: invites
    });
  } catch (error) {
    console.error("Error sharing event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
