import type { ProposalSort, VotingProposal } from "./types";

const germanNameCollator = new Intl.Collator("de", {
  numeric: true,
  sensitivity: "base",
});

function timestamp(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function compareTimestamp(left: string | null, right: string | null): number {
  const leftTime = timestamp(left);
  const rightTime = timestamp(right);
  return leftTime < rightTime ? -1 : leftTime > rightTime ? 1 : 0;
}

export function sortProposals<T extends VotingProposal>(
  proposals: readonly T[],
  sort: ProposalSort
): T[];
export function sortProposals<T>(
  proposals: readonly T[],
  sort: ProposalSort,
  select: (proposal: T) => VotingProposal
): T[];
export function sortProposals<T>(
  proposals: readonly T[],
  sort: ProposalSort,
  select: (proposal: T) => VotingProposal = (proposal) => proposal as VotingProposal
): T[] {
  return [...proposals].sort((left, right) => {
    const leftValue = select(left);
    const rightValue = select(right);
    if (sort === "name") {
      return germanNameCollator.compare(leftValue.name, rightValue.name) || leftValue.id.localeCompare(rightValue.id);
    }

    if (sort === "newest") {
      return compareTimestamp(rightValue.createdAt, leftValue.createdAt) || leftValue.id.localeCompare(rightValue.id);
    }

    return rightValue.totalVotes - leftValue.totalVotes ||
      compareTimestamp(leftValue.createdAt, rightValue.createdAt) ||
      leftValue.id.localeCompare(rightValue.id);
  });
}

export function proposalRanks<T extends VotingProposal>(
  proposals: readonly T[],
): Map<string, number>;
export function proposalRanks<T>(
  proposals: readonly T[],
  select: (proposal: T) => VotingProposal
): Map<string, number>;
export function proposalRanks<T>(
  proposals: readonly T[],
  select: (proposal: T) => VotingProposal = (proposal) => proposal as VotingProposal
): Map<string, number> {
  const ranks = new Map<string, number>();
  let previousVotes: number | null = null;
  let previousRank = 0;

  sortProposals(proposals, "votes", select).forEach((proposal, index) => {
    const value = select(proposal);
    if (value.totalVotes !== previousVotes) previousRank = index + 1;
    ranks.set(value.id, previousRank);
    previousVotes = value.totalVotes;
  });

  return ranks;
}
