import { Prisma } from "@prisma/client";

export const buildPublicEventInclude = (userId?: string | null): Prisma.EventInclude => ({
  createdBy: {
    select: { id: true, name: true },
  },
  selectedGame: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      minPlayers: true,
      maxPlayers: true,
      playTimeMinutes: true,
    },
  },
  proposals: {
    include: {
      game: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          minPlayers: true,
          maxPlayers: true,
          playTimeMinutes: true,
        },
      },
      proposedBy: {
        select: { id: true, name: true },
      },
      votes: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : undefined,
      _count: {
        select: { votes: true, guestVotes: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  guestParticipants: {
    include: {
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "asc" },
  },
  dateProposals: {
    include: {
      votes: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      guestVotes: {
        include: { guest: { select: { id: true, nickname: true } } },
      },
    },
    orderBy: { date: "asc" },
  },
});

export interface SerializedPublicEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  status: string;
  shareToken: string | null;
  isPublic: boolean;
  createdBy: { id: string; name: string | null };
  selectedGame: {
    id: string;
    name: string;
    imageUrl: string | null;
    minPlayers: number | null;
    maxPlayers: number | null;
    playTimeMinutes: number | null;
  } | null;
  proposals: Array<{
    id: string;
    game: {
      id: string;
      name: string;
      imageUrl: string | null;
      minPlayers: number | null;
      maxPlayers: number | null;
      playTimeMinutes: number | null;
    };
    proposedBy: { id: string; name: string | null } | null;
    totalVotes: number;
    voteCounts: { registered: number; guests: number };
    userHasVoted: boolean;
  }>;
  guestParticipants: Array<{
    id: string;
    nickname: string;
    votesCount: number;
    createdAt: string;
  }>;
  dateProposals: Array<{
    id: string;
    date: string;
    votes: Array<{
      id: string;
      availability: string;
      user: { id: string; name: string; email: string };
    }>;
    guestVotes: Array<{
      id: string;
      availability: string;
      guest: { id: string; nickname: string };
    }>;
  }>;
  selectedDate: string | null;
  currentUserId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePublicEvent(
  event: any,
  currentUserId: string | null
): SerializedPublicEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventDate: event.eventDate.toISOString(),
    location: event.location,
    status: event.status,
    shareToken: event.shareToken,
    isPublic: event.isPublic,
    createdBy: event.createdBy,
    selectedGame: event.selectedGame,
    proposals: event.proposals.map((proposal: any) => {
      const registeredVotes = proposal._count.votes;
      const guestVotes = proposal._count.guestVotes;
      const userHasVoted = currentUserId ? (proposal.votes?.length ?? 0) > 0 : false;

      return {
        id: proposal.id,
        game: proposal.game,
        proposedBy: proposal.proposedBy,
        totalVotes: registeredVotes + guestVotes,
        voteCounts: {
          registered: registeredVotes,
          guests: guestVotes,
        },
        userHasVoted,
      };
    }),
    guestParticipants: event.guestParticipants.map((guest: any) => ({
      id: guest.id,
      nickname: guest.nickname,
      votesCount: guest._count?.votes ?? 0,
      createdAt: guest.createdAt.toISOString(),
    })),
    dateProposals: (event.dateProposals ?? []).map((dp: any) => ({
      id: dp.id,
      date: dp.date.toISOString(),
      votes: dp.votes.map((v: any) => ({
        id: v.id,
        availability: v.availability,
        user: v.user,
      })),
      guestVotes: dp.guestVotes.map((v: any) => ({
        id: v.id,
        availability: v.availability,
        guest: v.guest,
      })),
    })),
    selectedDate: event.selectedDate?.toISOString() ?? null,
    currentUserId,
  };
}
