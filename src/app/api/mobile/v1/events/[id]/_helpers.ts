import { toEventProposalDto, toGameDto } from "@/lib/dto-mappers";
import { SAFE_USER_SELECT } from "@/lib/services/shared";

export const proposalInclude = {
  game: {
    include: {
      tags: { include: { tag: { select: { name: true } } } },
    },
  },
  proposedBy: { select: SAFE_USER_SELECT },
  guest: { select: { id: true, nickname: true } },
  votes: { select: { id: true, userId: true } },
  guestVotes: { select: { id: true } },
  _count: { select: { votes: true, guestVotes: true } },
};

export function hasEventAccess(
  event: {
    createdById: string;
    invites: { userId: string | null }[];
    isPublic: boolean;
  },
  userId: string
): boolean {
  if (event.createdById === userId) return true;
  if (event.isPublic) return true;
  return event.invites.some((invite) => invite.userId === userId);
}

type ProposalInput = {
  id: string;
  eventId: string;
  gameId: string | null;
  proposedById: string | null;
  bggId: string | null;
  bggName: string | null;
  bggImageUrl: string | null;
  bggMinPlayers: number | null;
  bggMaxPlayers: number | null;
  bggPlayTimeMinutes: number | null;
  votes?: { id: string; userId: string }[];
  guestVotes?: { id: string }[];
  createdAt: Date;
  game: {
    id: string;
    name: string;
    description: string | null;
    minPlayers: number;
    maxPlayers: number;
    playTimeMinutes: number | null;
    complexity: number | null;
    bggId: string | null;
    ean: string | null;
    imageUrl: string | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    tags?: { tag: { name: string } }[];
  } | null;
  proposedBy: { id: string; name: string | null; email: string } | null;
  guest: { id: string; nickname: string } | null;
};

export function mapProposal(proposal: ProposalInput, userId: string) {
  const game = proposal.game ? toGameDto(proposal.game) : null;
  const proposedBy =
    proposal.proposedBy ??
    (proposal.guest
      ? { id: proposal.guest.id, name: proposal.guest.nickname, email: "" }
      : null);

  return {
    ...toEventProposalDto(proposal),
    game,
    proposedBy,
    userHasVoted: proposal.votes?.some((vote) => vote.userId === userId) ?? false,
  };
}
