import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { GameService } from "@/lib/services";
import { notFound, redirect } from "next/navigation";
import VotingClient from "./voting-client";

export default async function EventVotingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      invites: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      proposals: {
        include: {
          game: true,
          proposedBy: { select: { id: true, name: true, email: true } },
          guest: { select: { id: true, nickname: true } },
          _count: { select: { votes: true, guestVotes: true } },
          votes: { where: { userId }, select: { id: true } },
        },
      },
      selectedGame: true,
      guestParticipants: {
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) notFound();

  const isCreator = event.createdById === userId;

  const eventResponse = {
    ...event,
    proposals: event.proposals.map((proposal) => {
      const gameData = proposal.game ?? {
        id: `bgg-${proposal.bggId}`,
        name: proposal.bggName ?? "Unbekanntes Spiel",
        imageUrl: proposal.bggImageUrl ?? null,
        minPlayers: proposal.bggMinPlayers ?? null,
        maxPlayers: proposal.bggMaxPlayers ?? null,
        playTimeMinutes: proposal.bggPlayTimeMinutes ?? null,
        description: null, complexity: null, bggId: proposal.bggId,
        ean: null, ownerId: null,
        createdAt: proposal.createdAt, updatedAt: proposal.createdAt,
      };
      const proposedByData = proposal.proposedBy ?? (proposal.guest
        ? { id: proposal.guest.id, name: proposal.guest.nickname, email: "" }
        : null);
      return {
        ...proposal, game: gameData, proposedBy: proposedByData,
        totalVotes: proposal._count.votes + proposal._count.guestVotes,
        userHasVoted: proposal.votes.length > 0,
        votes: undefined,
      };
    }),
    guestParticipants: event.guestParticipants.map((g) => ({ ...g, votes: undefined })),
    currentUserId: userId,
    isCreator,
  };

  const games = await GameService.list(userId);

  const serializedEvent = JSON.parse(JSON.stringify(eventResponse));
  const serializedGames = JSON.parse(JSON.stringify(games));

  return <VotingClient initialEvent={serializedEvent} initialGames={serializedGames} eventId={id} />;
}
