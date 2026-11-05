import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        invites: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        proposals: {
          include: { game: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
    }

    const isCreator = event.createdById === userId;
    const isInvited = event.invites.some(invite => invite.userId === userId);

    if (!isCreator && !isInvited) {
      return NextResponse.json({ error: Errors.ACCESS_DENIED }, { status: 403 });
    }

    const startDate = new Date(event.eventDate);
    const durationMinutes = Number.isInteger(event.durationMinutes) && event.durationMinutes >= 30 && event.durationMinutes <= 1440
      ? event.durationMinutes
      : 180;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    let description = event.description || "";
    
    if (event.proposals.length > 0) {
      description += "\n\n\uD83C\uDFB2 Spielvorschlaege:\n";
      event.proposals.forEach((proposal, index) => {
        description += `${index + 1}. ${proposal.game?.name ?? proposal.bggName ?? "Unbekannt"}\n`;
      });
    }

    if (event.invites.length > 0) {
      description += "\n\n\uD83D\uDC65 Eingeladene Spieler:\n";
      event.invites.forEach((invite) => {
        const status = invite.status === "accepted" ? "\u2705" : 
                      invite.status === "declined" ? "\u274C" : "\u23F3";
        description += `${status} ${invite.user?.name ?? "Unbekannt"}\n`;
      });
    }

    description += `\n\n\uD83D\uDCCD Ort: ${event.location || "TBD"}`;
    description += `\n\uD83D\uDC64 Organisator: ${event.createdBy.name}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BoardGameTools//Event//DE',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${event.id}@boardgametools.local`,
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || ''}`,
      `ORGANIZER:CN=${event.createdBy.name}:mailto:${event.createdBy.email}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="event-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

function formatDateForICS(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
