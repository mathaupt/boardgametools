import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { sendEventInviteEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { encryptId } from "@/lib/crypto";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";
import { CacheTags } from "@/lib/cache-tags";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const { userId, name, email } = await requireAuth();

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "0", 10), 100);

  try {
    let events;
    
    if (eventId) {
      // Spezifisches Event mit Voting-Details
      events = await prisma.event.findFirst({
        where: { id: eventId, deletedAt: null },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          invites: {
            include: { user: { select: { id: true, name: true, email: true } } }
          },
          proposals: {
            include: {
              game: true,
              proposedBy: { select: { id: true, name: true, email: true } },
              _count: { select: { votes: true } }
            }
          },
          selectedGame: true
        }
      });
    } else {
      const where = { createdById: userId, deletedAt: null as null };
      const includeRelations = {
        invites: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        proposals: {
          include: {
            game: true,
            _count: { select: { votes: true } }
          }
        },
        selectedGame: true,
        _count: { select: { proposals: true, invites: true } }
      };

      if (page > 0 && limit > 0) {
        const [eventList, total] = await Promise.all([
          prisma.event.findMany({
            where, include: includeRelations, orderBy: { eventDate: "desc" },
            skip: (page - 1) * limit, take: limit,
          }),
          prisma.event.count({ where }),
        ]);
        return NextResponse.json({ data: eventList, total, page, limit, totalPages: Math.ceil(total / limit) });
      }

      events = await prisma.event.findMany({
        where, include: includeRelations, orderBy: { eventDate: "desc" },
      });
    }

    return NextResponse.json(events);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const { userId, name, email } = await requireAuth();

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
      userId: userId,
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
        createdById: userId,
        invites: {
          create: [organizerInvite, ...additionalInvites],
        },
      },
      include: {
        invites: {
          include: { user: { select: { id: true, name: true, email: true } } }
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
    const inviterName = name || email || "Jemand";

    for (const invite of newEvent.invites) {
      if (invite.userId === userId) continue; // Organisator nicht mailen
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

    invalidateTag(CacheTags.userEvents(userId));
    invalidateTag(CacheTags.userDashboard(userId));

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
