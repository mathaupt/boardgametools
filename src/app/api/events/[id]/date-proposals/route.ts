import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET: Alle Terminvorschläge für ein Event laden
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        invites: { select: { userId: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((i) => i.userId === session.user.id);
    const hasAccess = event.createdById === session.user.id || isInvited;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const proposals = await prisma.dateProposal.findMany({
      where: { eventId: id },
      include: {
        votes: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        guestVotes: {
          include: { guest: { select: { id: true, nickname: true } } },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Error fetching date proposals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Terminvorschläge erstellen (nur Event-Ersteller)
// Body: { dates: string[] } – Array von ISO date strings
// Oder: { startDate: string, endDate: string, weekdays?: number[] }
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
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "Only the event creator can create date proposals" },
        { status: 403 }
      );
    }

    if (event.selectedDate) {
      return NextResponse.json(
        { error: "Date poll already finalized. Reset before creating new proposals." },
        { status: 400 }
      );
    }

    const body = await request.json();
    let dates: Date[] = [];

    if (body.dates && Array.isArray(body.dates)) {
      // Direkte Datumsangaben
      dates = body.dates.map((d: string) => new Date(d));
    } else if (body.startDate && body.endDate) {
      // Datumsbereich mit optionalen Wochentagen
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      const weekdays: number[] | undefined = body.weekdays; // 0=So, 1=Mo, ..., 6=Sa

      if (start > end) {
        return NextResponse.json(
          { error: "startDate must be before endDate" },
          { status: 400 }
        );
      }

      // Maximal 365 Tage
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        return NextResponse.json(
          { error: "Date range must be within 365 days" },
          { status: 400 }
        );
      }

      const current = new Date(start);
      while (current <= end) {
        if (!weekdays || weekdays.includes(current.getDay())) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
    } else {
      return NextResponse.json(
        { error: "Provide either 'dates' array or 'startDate'+'endDate'" },
        { status: 400 }
      );
    }

    if (dates.length === 0) {
      return NextResponse.json(
        { error: "No valid dates provided" },
        { status: 400 }
      );
    }

    // Normalisiere Daten auf Mitternacht UTC
    const normalizedDates = dates.map((d) => {
      const normalized = new Date(d);
      normalized.setUTCHours(0, 0, 0, 0);
      return normalized;
    });

    // Erstelle Proposals – überspringe bereits existierende
    const created = await prisma.$transaction(
      normalizedDates.map((date) =>
        prisma.dateProposal.upsert({
          where: {
            eventId_date: { eventId: id, date },
          },
          update: {},
          create: {
            eventId: id,
            date,
          },
        })
      )
    );

    // Lade alle Proposals mit Votes
    const allProposals = await prisma.dateProposal.findMany({
      where: { eventId: id },
      include: {
        votes: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        guestVotes: {
          include: { guest: { select: { id: true, nickname: true } } },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(allProposals, { status: 201 });
  } catch (error) {
    console.error("Error creating date proposals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Alle Terminvorschläge eines Events löschen (nur Event-Ersteller)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "Only the event creator can delete date proposals" },
        { status: 403 }
      );
    }

    await prisma.dateProposal.deleteMany({ where: { eventId: id } });

    return NextResponse.json({ message: "Date proposals deleted" });
  } catch (error) {
    console.error("Error deleting date proposals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
