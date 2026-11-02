export interface DashboardProposalVoteCount {
  id: string;
  votes: number;
  guestVotes: number;
  createdAt: Date | string;
}

export interface DashboardProposalRank {
  id: string;
  totalVotes: number;
}

export function getTopDashboardProposalRanks(
  proposals: readonly DashboardProposalVoteCount[],
): DashboardProposalRank[] {
  return [...proposals]
    .sort((a, b) => {
      const votesDifference = b.votes + b.guestVotes - a.votes - a.guestVotes;
      if (votesDifference !== 0) return votesDifference;

      const createdDifference = getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
      if (createdDifference !== 0) return createdDifference;

      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .slice(0, 3)
    .map(({ id, votes, guestVotes }) => ({
      id,
      totalVotes: votes + guestVotes,
    }));
}

function getTimestamp(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}
