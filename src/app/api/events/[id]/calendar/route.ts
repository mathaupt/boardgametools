import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
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
          include: { game: true }
        }
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

    // Kalender-Details vorbereiten
    const startDate = new Date(event.eventDate);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 Stunden Default

    // Beschreibung mit Spielvorschlägen und Teilnehmern
    let description = event.description || "";
    
    if (event.proposals.length > 0) {
      description += "\n\n🎲 Spielvorschläge:\n";
      event.proposals.forEach((proposal, index) => {
        description += `${index + 1}. ${proposal.game?.name ?? proposal.bggName ?? "Unbekannt"}\n`;
      });
    }

    if (event.invites.length > 0) {
      description += "\n\n👥 Eingeladene Spieler:\n";
      event.invites.forEach((invite) => {
        const status = invite.status === "accepted" ? "✅" : 
                      invite.status === "declined" ? "❌" : "⏳";
        description += `${status} ${invite.user?.name ?? "Unbekannt"}\n`;
      });
    }

    description += `\n\n📍 Ort: ${event.location || "TBD"}`;
    description += `\n👤 Organisator: ${event.createdBy.name}`;

    // ICS Kalender-Datei erstellen
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

    // Response mit ICS Datei
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
    console.error("Error generating calendar file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

function formatDateForICS(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Format: YYYYMMDDTHHMMSSZ (UTC)
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
