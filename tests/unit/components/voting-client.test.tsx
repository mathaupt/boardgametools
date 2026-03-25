import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock next/image to render a simple img
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import VotingClient from "@/app/(dashboard)/dashboard/events/[id]/voting-client";

const makeProposal = (id: string, name: string, votes: number) => ({
  id,
  game: {
    id: `game-${id}`,
    name,
    minPlayers: 2,
    maxPlayers: 4,
    playTimeMinutes: 60,
    complexity: 3,
    imageUrl: null,
  },
  proposedBy: { name: "TestUser" },
  _count: { votes },
});

const defaultProps = {
  proposals: [
    makeProposal("p1", "Catan", 3),
    makeProposal("p2", "Azul", 1),
  ],
  eventId: "event-1",
  userId: "user-1",
  userVoteIds: new Set<string>(),
  isPast: false,
};

describe("VotingClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all proposals with vote counts", () => {
    render(<VotingClient {...defaultProps} />);

    expect(screen.getByTestId("voting-proposals")).toBeInTheDocument();
    expect(screen.getByTestId("proposal-p1")).toBeInTheDocument();
    expect(screen.getByTestId("proposal-p2")).toBeInTheDocument();
    expect(screen.getByTestId("vote-count-p1")).toHaveTextContent("3");
    expect(screen.getByTestId("vote-count-p2")).toHaveTextContent("1");
  });

  it("shows vote buttons for logged-in user", () => {
    render(<VotingClient {...defaultProps} />);

    expect(screen.getByTestId("vote-p1")).toBeInTheDocument();
    expect(screen.getByTestId("vote-p2")).toBeInTheDocument();
  });

  it("shows remove-vote button for already voted proposals", () => {
    render(
      <VotingClient
        {...defaultProps}
        userVoteIds={new Set(["p1"])}
      />
    );

    expect(screen.getByTestId("remove-vote-p1")).toBeInTheDocument();
    expect(screen.getByTestId("vote-p2")).toBeInTheDocument();
  });

  it("does not show vote buttons when isPast", () => {
    render(<VotingClient {...defaultProps} isPast={true} />);

    expect(screen.queryByTestId("vote-p1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote-p2")).not.toBeInTheDocument();
  });

  it("does not show vote buttons when no userId", () => {
    render(<VotingClient {...defaultProps} userId={null} />);

    expect(screen.queryByTestId("vote-p1")).not.toBeInTheDocument();
  });

  it("calls API on vote and updates count", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(<VotingClient {...defaultProps} />);

    fireEvent.click(screen.getByTestId("vote-p2"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/events/event-1/votes",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ proposalId: "p2" }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("vote-count-p2")).toHaveTextContent("2");
    });
  });

  it("calls DELETE API on remove vote", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(
      <VotingClient
        {...defaultProps}
        userVoteIds={new Set(["p1"])}
      />
    );

    fireEvent.click(screen.getByTestId("remove-vote-p1"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/events/event-1/votes?proposalId=p1",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("vote-count-p1")).toHaveTextContent("2");
    });
  });

  it("shows error toast on vote failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<VotingClient {...defaultProps} />);

    fireEvent.click(screen.getByTestId("vote-p1"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler beim Abstimmen",
          variant: "destructive",
        })
      );
    });
  });

  it("shows selected badge for winning proposal", () => {
    render(
      <VotingClient
        {...defaultProps}
        winningProposalId="p1"
      />
    );

    expect(screen.getByText("Ausgewählt")).toBeInTheDocument();
  });

  it("sorts proposals by vote count descending", () => {
    const proposals = [
      makeProposal("p1", "Low", 1),
      makeProposal("p2", "High", 5),
      makeProposal("p3", "Mid", 3),
    ];

    render(<VotingClient {...defaultProps} proposals={proposals} />);

    const proposalElements = screen.getAllByTestId(/^proposal-/);
    expect(proposalElements[0]).toHaveAttribute("data-testid", "proposal-p2");
    expect(proposalElements[1]).toHaveAttribute("data-testid", "proposal-p3");
    expect(proposalElements[2]).toHaveAttribute("data-testid", "proposal-p1");
  });
});
