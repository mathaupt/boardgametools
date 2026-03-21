import { Game, Event, GameProposal, User } from "@prisma/client";

export interface ProposalWithDetails extends GameProposal {
  game: Game;
  proposedBy: User | { id: string; name: string };
  _count: { votes: number };
  userVoted?: boolean;
  userHasVoted?: boolean;
}

export interface EventResponse extends Event {
  proposals: ProposalWithDetails[];
  invites: Array<{ id: string; userId: string; user: User; status: string }>;
  createdBy: User;
  selectedGame: Game | null;
  currentUserId: string;
  isCreator: boolean;
}
