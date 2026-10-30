export type ProposalSort = "votes" | "name" | "newest";

export interface VotingProposal {
  id: string;
  name: string;
  createdAt: string | null;
  voteCounts: { registered: number; guests: number };
  totalVotes: number;
}

export interface VotingGameDetail {
  proposalId: string;
  name: string;
  description: string | null;
  descriptionSource: "collection" | "bgg" | null;
  imageUrl: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggUrl: string | null;
  detailsUnavailable: boolean;
}
