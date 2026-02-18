import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  try {
    let events;
    
    if (eventId) {
      // Spezifisches Event mit Voting-Details
      events = await prisma.event.findUnique({
        where: { id: eventId },
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
    } else {
      // Alle Events des Users
      events = await prisma.event.findMany({
        where: { createdById: session.user.id },
        include: {
          invites: {
            include: { user: true }
          },
          proposals: {
            include: {
              game: true,
              _count: { select: { votes: true } }
            }
          },
          selectedGame: true,
          _count: { select: { proposals: true, invites: true } }
        },
        orderBy: { eventDate: "desc" }
      });
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      eventDate, 
      location, 
      groupId,
      inviteEmails 
    } = body;

    // Validierung
    if (!title || !eventDate) {
      return NextResponse.json({ 
        error: "Missing required fields: title, eventDate" 
      }, { status: 400 });
    }

    // Erstelle Event
    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        eventDate: new Date(eventDate),
        location: location || null,
        groupId: groupId || null,
        createdById: session.user.id,
        invites: inviteEmails ? {
          create: await Promise.all(
            inviteEmails.map(async (email: string) => {
              const user = await prisma.user.findUnique({
                where: { email }
              });
              
              return {
                userId: user?.id || null,
                email: user ? null : email, // Store email if user not found
                status: "pending"
              };
            })
          )
        } : undefined
      },
      include: {
        invites: {
          include: { user: true }
        },
        proposals: {
          include: {
            game: true,
            _count: { select: { votes: true } }
          }
        }
      }
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
