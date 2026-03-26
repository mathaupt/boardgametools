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
    // Event mit allen Details laden
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        invites: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        proposals: {
          include: {
            game: true,
            proposedBy: { select: { id: true, name: true, email: true } },
            guest: { select: { id: true, nickname: true } },
            _count: { select: { votes: true, guestVotes: true } },
            votes: {
              where: { userId: userId },
              select: { id: true },
            },
          }
        },
        selectedGame: true,
        guestParticipants: {
          include: {
            _count: { select: { votes: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
    }

    // Prüfe ob User Berechtigung hat (Ersteller oder eingeladen)
    const isCreator = event.createdById === userId;
    const isInvited = event.invites.some(invite => invite.userId === userId);

    if (!isCreator && !isInvited) {
      return NextResponse.json({ error: Errors.ACCESS_DENIED }, { status: 403 });
    }

    const eventResponse = {
      ...event,
      proposals: event.proposals.map(proposal => {
        // Merge game data: prefer DB game, fallback to inline BGG fields
        const gameData = proposal.game ?? {
          id: `bgg-${proposal.bggId}`,
          name: proposal.bggName ?? "Unbekanntes Spiel",
          imageUrl: proposal.bggImageUrl ?? null,
          minPlayers: proposal.bggMinPlayers ?? null,
          maxPlayers: proposal.bggMaxPlayers ?? null,
          playTimeMinutes: proposal.bggPlayTimeMinutes ?? null,
          description: null,
          complexity: null,
          bggId: proposal.bggId,
          ean: null,
          ownerId: null,
          createdAt: proposal.createdAt,
          updatedAt: proposal.createdAt,
        };

        // Merge proposedBy: prefer DB user, fallback to guest
        const proposedByData = proposal.proposedBy ?? (proposal.guest
          ? { id: proposal.guest.id, name: proposal.guest.nickname, email: "" }
          : null);

        return {
          ...proposal,
          game: gameData,
          proposedBy: proposedByData,
          totalVotes: proposal._count.votes + proposal._count.guestVotes,
          userHasVoted: proposal.votes.length > 0,
          votes: undefined,
        };
      }),
      guestParticipants: event.guestParticipants.map((guest) => ({
        ...guest,
        votes: undefined,
      })),
      currentUserId: userId,
      isCreator,
    };

    return NextResponse.json(eventResponse);
  } catch (error) {
    return handleApiError(error);
  }
});
