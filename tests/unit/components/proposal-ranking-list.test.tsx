import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProposalWithDetails } from "@/app/(dashboard)/dashboard/events/[id]/voting/voting-types";

vi.mock("next/image", () => ({ default: (props: Record<string, unknown>) => <img {...props} /> }));
vi.mock("@/components/event-voting/proposal-game-details", () => ({
  ProposalGameDetails: ({ name }: { name: string }) => <h3>{name}</h3>,
}));

import ProposalRankingList from "@/app/(dashboard)/dashboard/events/[id]/voting/proposal-ranking-list";

function proposal(input: {
  id: string;
  name: string;
  votes: number;
  guestVotes: number;
  createdAt: string;
}): ProposalWithDetails {
  return {
    id: input.id,
    eventId: "event-1",
    gameId: `game-${input.id}`,
    proposedById: "user-1",
    guestId: null,
    bggId: null,
    bggName: null,
    bggImageUrl: null,
    bggMinPlayers: 2,
    bggMaxPlayers: 4,
    bggPlayTimeMinutes: 60,
    createdAt: new Date(input.createdAt),
    updatedAt: new Date(input.createdAt),
    totalVotes: input.votes + input.guestVotes,
    game: {
      id: `game-${input.id}`,
      name: input.name,
      minPlayers: 2,
      maxPlayers: 4,
      playTimeMinutes: 60,
      complexity: null,
      imageUrl: null,
    } as ProposalWithDetails["game"],
    proposedBy: { id: "user-1", name: "Alex" },
    _count: { votes: input.votes, guestVotes: input.guestVotes },
    userVoted: false,
  } as ProposalWithDetails;
}

function renderList(proposals: ProposalWithDetails[]) {
  return render(<ProposalRankingList
    eventId="event-1"
    proposals={proposals}
    voting={null}
    deletingProposal={null}
    eventIsCreator={false}
    currentUserId="user-2"
    onVote={vi.fn()}
    onRemoveVote={vi.fn()}
    onDeleteProposal={vi.fn()}
  />);
}

describe("ProposalRankingList sorting", () => {
  it("sorts by combined votes by default and allows sorting by name", () => {
    const { container } = renderList([
      proposal({ id: "z", name: "Zug um Zug", votes: 1, guestVotes: 3, createdAt: "2026-10-01T00:00:00Z" }),
      proposal({ id: "a", name: "Azul", votes: 2, guestVotes: 2, createdAt: "2026-10-02T00:00:00Z" }),
    ]);

    const cards = () => Array.from(container.querySelectorAll<HTMLElement>(
      "[data-testid^='proposal-']:not([data-testid^='proposal-rank-'])"
    ));
    expect(cards().map((card) => card.dataset.testid)).toEqual(["proposal-z", "proposal-a"]);
    expect(screen.getByTestId("vote-count-z")).toHaveTextContent("4");
    expect(screen.getByTestId("vote-count-a")).toHaveTextContent("4");

    fireEvent.change(screen.getByLabelText("Sortieren"), { target: { value: "name" } });
    expect(cards().map((card) => card.dataset.testid)).toEqual(["proposal-a", "proposal-z"]);
  });

  it("gives proposals with tied vote totals the same rank", () => {
    renderList([
      proposal({ id: "z", name: "Zug um Zug", votes: 1, guestVotes: 3, createdAt: "2026-10-01T00:00:00Z" }),
      proposal({ id: "a", name: "Azul", votes: 2, guestVotes: 2, createdAt: "2026-10-02T00:00:00Z" }),
    ]);

    expect(screen.getByTestId("proposal-rank-z")).toHaveTextContent("1");
    expect(screen.getByTestId("proposal-rank-a")).toHaveTextContent("1");
  });
});
