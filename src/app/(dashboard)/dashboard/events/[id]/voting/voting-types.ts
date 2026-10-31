import { Game, Event, GameProposal, User } from "@/generated/prisma/client";
import type { EventState } from "@/lib/events/event-state";

export interface ProposalWithDetails extends GameProposal {
  game: Game;
  proposedBy: User | { id: string; name: string };
  _count: { votes: number; guestVotes?: number };
  totalVotes?: number;
  userVoted?: boolean;
  userHasVoted?: boolean;
}

export interface EventResponse extends Event {
  eventState: EventState;
  proposals: ProposalWithDetails[];
  invites: Array<{ id: string; userId: string; user: User; status: string }>;
  createdBy: User;
  selectedGame: Game | null;
  currentUserId: string;
  isCreator: boolean;
}
