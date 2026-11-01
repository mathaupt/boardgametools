import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicProposalVoteActions } from "@/components/public-event/public-proposal-vote-actions";
import type { PublicActor } from "@/lib/events/public-actor";

const observer: PublicActor = { kind: "observer" };

describe("PublicProposalVoteActions", () => {
  it("renders only the account action for an authenticated actor", () => {
    render(
      <PublicProposalVoteActions
        proposalId="proposal-1"
        actor={{ kind: "user", userId: "user-1", displayName: "Anna" }}
        hasVoted
        busy={false}
        isPast={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Stimme entfernen" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /Gast/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stimme entfernen" })).toHaveClass("min-h-11");
  });

  it("renders the guest action for a current guest actor", () => {
    render(
      <PublicProposalVoteActions
        proposalId="proposal-1"
        actor={{ kind: "guest", guestId: "guest-1", nickname: "Alex" }}
        hasVoted={false}
        busy={false}
        isPast={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Stimme abgeben" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /User/ })).not.toBeInTheDocument();
  });

  it("does not render an action while the actor is unknown", () => {
    render(
      <PublicProposalVoteActions
        proposalId="proposal-1"
        actor={observer}
        hasVoted={false}
        busy={false}
        onToggle={vi.fn()}
      />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/Melde dich an oder nimm als Gast teil/)).toBeInTheDocument();
  });
});
