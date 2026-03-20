import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEventInviteEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { encryptId } from "@/lib/crypto";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";

export const GET = withApiLogging(async function GET(request: NextRequest) {
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
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
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

    const validationError = firstError(
      validateString(title, "Titel", { max: 200 }),
      validateString(description, "Beschreibung", { required: false, max: 2000 }),
      validateString(location, "Ort", { required: false, max: 500 }),
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Erstelle Event
    const organizerInvite = {
      userId: session.user.id,
      status: "accepted" as const,
    };

    const additionalInvites = inviteEmails ? await Promise.all(
      inviteEmails.map(async (email: string) => {
        const user = await prisma.user.findUnique({
          where: { email }
        });
        
        return {
          userId: user?.id || null,
          email: user ? null : email,
          status: "pending" as const,
        };
      })
    ) : [];

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        eventDate: new Date(eventDate),
        location: location || null,
        groupId: groupId || null,
        createdById: session.user.id,
        invites: {
          create: [organizerInvite, ...additionalInvites],
        },
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

    // Sende Einladungs-Mails an alle eingeladenen User (nicht an Organisator)
    const base = await getPublicBaseUrl();
    const inviterName = session.user.name || session.user.email || "Jemand";

    for (const invite of newEvent.invites) {
      if (invite.userId === session.user.id) continue; // Organisator nicht mailen
      const recipientEmail = invite.user?.email || invite.email;
      if (!recipientEmail) continue;

      // Registrierte User → Dashboard, externe → öffentliche Invite-Seite
      const eventUrl = invite.userId
        ? `${base}/dashboard/events/${newEvent.id}`
        : `${base}/public/invite/${encryptId(invite.id)}`;

      try {
        await sendEventInviteEmail({
          to: recipientEmail,
          eventTitle: title,
          eventDate: new Date(eventDate),
          location: location || null,
          inviterName,
          eventUrl,
        });
      } catch (mailErr) {
        console.error("Failed to send invite email:", mailErr);
      }
    }

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
