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
    // Session mit Voting-Details laden
    const sessionData = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        game: true,
        createdBy: true,
        players: {
          include: { user: true }
        }
      }
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Prüfe ob User Berechtigung hat (Teilnehmer oder Ersteller)
    const isParticipant = sessionData.players.some((p: any) => p.userId === session.user.id);
    const isCreator = sessionData.createdById === session.user.id;

    if (!isParticipant && !isCreator) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ 
        error: "Missing required field: gameId" 
      }, { status: 400 });
    }

    // Prüfe ob Session existiert und User Berechtigung hat
    const sessionData = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        players: true
      }
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Prüfe ob User Teilnehmer oder Ersteller ist
    const isParticipant = sessionData.players.some((p: any) => p.userId === session.user.id);
    const isCreator = sessionData.createdById === session.user.id;

    if (!isParticipant && !isCreator) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Für Session Voting verwenden wir die Vote-Tabelle (ähnlich wie Event Voting)
    const vote = await prisma.vote.create({
      data: {
        proposalId: id, // Session ID als Proposal ID verwenden
        userId: session.user.id
      },
      include: {
        user: true
      }
    });

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    console.error("Error creating vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
