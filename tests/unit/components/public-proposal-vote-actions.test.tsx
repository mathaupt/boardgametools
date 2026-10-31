import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicProposalVoteActions } from "@/components/public-event/public-proposal-vote-actions";

describe("PublicProposalVoteActions", () => {
  it("keeps user and guest voting controls distinct and touch sized", () => {
    render(
      <PublicProposalVoteActions
        proposalId="proposal-1"
        currentUserId="user-1"
        activeGuest
        userHasVoted
        guestHasVoted={false}
        userVoting={null}
        guestVoting={null}
        isPast={false}
        onUserVote={vi.fn()}
        onGuestVote={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Vote entfernen" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Als Gast voten" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Vote entfernen" })).toHaveClass("min-h-11");
    expect(screen.getByRole("button", { name: "Als Gast voten" })).toHaveClass("min-h-11");
  });

  it("explains when guests cannot vote yet", () => {
    render(
      <PublicProposalVoteActions
        proposalId="proposal-1"
        currentUserId={null}
        activeGuest={false}
        userHasVoted={false}
        guestHasVoted={false}
        userVoting={null}
        guestVoting={null}
        isPast={false}
        onUserVote={vi.fn()}
        onGuestVote={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Gastmodus nötig" })).toBeDisabled();
    expect(screen.getByText(/Logge dich ein oder registriere dich als Gast/)).toBeInTheDocument();
  });
});
