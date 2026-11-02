import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { refresh, toast } = vi.hoisted(() => ({ refresh: vi.fn(), toast: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/app/(dashboard)/dashboard/events/[id]/voting/proposal-ranking-list", () => ({
  default: ({ proposals, onVote, onRemoveVote, onDeleteProposal }: any) => <section>
    {proposals.map((proposal: any) => <div key={proposal.id}>
      <span>{proposal.game.name}</span><span>{proposal._count.votes + (proposal._count.guestVotes ?? 0)}</span>
      <button onClick={() => onVote(proposal.id)}>vote-{proposal.id}</button>
      <button onClick={() => onRemoveVote(proposal.id)}>remove-{proposal.id}</button>
      <button onClick={() => onDeleteProposal(proposal.id)}>delete-{proposal.id}</button>
    </div>)}
  </section>,
}));
vi.mock("@/app/(dashboard)/dashboard/events/[id]/voting/game-proposal-panel", () => ({
  default: (props: any) => <section>
    <input aria-label="Sammlungssuche" value={props.collectionSearch} onChange={(e) => props.onCollectionSearchChange(e.target.value)} />
    <button onClick={() => props.onAddProposal("game-2")}>Vorschlag hinzufügen</button>
    <input aria-label="BGG-Suche" value={props.searchQuery} onChange={(e) => props.onSearchQueryChange(e.target.value)} />
    <button onClick={props.onBggSearch}>BGG suchen</button>
    <button onClick={() => props.onBggImport("bgg-13")}>BGG importieren</button>
    <span>{props.bggResults.map((result: any) => result.name).join(",")}</span>
  </section>,
}));

import VotingClient from "@/app/(dashboard)/dashboard/events/[id]/voting/voting-client";

const eventState = { available: { voteGame: true, proposeGame: true }, blockedReason: "Voting geschlossen" };
const proposal = {
  id: "proposal-1", eventId: "event-1", gameId: "game-1", proposedById: "user-1", createdAt: new Date("2026-01-01"),
  game: { id: "game-1", name: "Catan", minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60, complexity: 2, imageUrl: null },
  proposedBy: { id: "user-1", name: "Spieler" }, _count: { votes: 2, guestVotes: 1 }, userHasVoted: true,
};

function renderVoting(overrides: Record<string, unknown> = {}) {
  return render(<VotingClient
    initialEvent={{
      id: "event-1", title: "Spieleabend", eventDate: new Date("2026-12-01"), location: null, description: "Gemeinsam spielen",
      eventState, proposals: [proposal], invites: [], createdBy: { id: "owner", name: "Owner" }, selectedGame: null,
      selectedGameId: null, winningProposalId: null, currentUserId: "user-1", isCreator: true,
    } as never}
    initialGames={[{ id: "game-2", name: "Azul" } as never]}
    eventId="event-1"
    {...overrides}
  />);
}

describe("Event voting page client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders event metadata and current proposal vote totals", () => {
    renderVoting();
    expect(screen.getByText("Spieleabend")).toBeInTheDocument();
    expect(screen.getByText("Gemeinsam spielen")).toBeInTheDocument();
    expect(screen.getByText(/Kein Ort/)).toBeInTheDocument();
    expect(screen.getByText("Catan")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("votes and updates the registered and combined vote count", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    renderVoting();
    fireEvent.click(screen.getByRole("button", { name: "vote-proposal-1" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/events/event-1/votes", expect.objectContaining({
      method: "POST", body: JSON.stringify({ proposalId: "proposal-1" }),
    })));
    await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument());
  });

  it("removes a vote and never lets the combined total become negative", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    renderVoting();
    // The proposal has two registered and one guest vote; removal leaves two.
    fireEvent.click(screen.getByRole("button", { name: "remove-proposal-1" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/events/event-1/votes?proposalId=proposal-1", { method: "DELETE" }));
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
  });

  it("refreshes event state and shows a conflict when a vote is stale", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false, status: 409 } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ eventState: { ...eventState, available: { voteGame: false, proposeGame: false }, blockedReason: "Voting beendet" } }) } as Response);
    renderVoting();
    fireEvent.click(screen.getByRole("button", { name: "vote-proposal-1" }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Fehler beim Abstimmen",
      description: "Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.",
    })));
    expect(refresh).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByText("Voting beendet")).toBeInTheDocument());
  });

  it("adds a collection proposal, deletes a proposal, and handles API errors", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...proposal, id: "proposal-2", gameId: "game-2", game: { ...proposal.game, id: "game-2", name: "Azul" }, _count: { votes: 0 } }) } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Nicht möglich" }) } as Response);
    renderVoting();
    fireEvent.change(screen.getByLabelText("Sammlungssuche"), { target: { value: "Az" } });
    expect(screen.getByLabelText("Sammlungssuche")).toHaveValue("Az");
    fireEvent.click(screen.getByRole("button", { name: "Vorschlag hinzufügen" }));
    await waitFor(() => expect(screen.getByText("Azul")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "delete-proposal-1" })[0]);
    await waitFor(() => expect(screen.queryByText("Catan")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "delete-proposal-2" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "Nicht möglich", variant: "destructive" })));
  });

  it("searches and imports a BGG result, then returns to the collection tab", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [{ bggId: "13", name: "Catan", yearPublished: "1995", type: "boardgame" }] } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: "Catan", description: "Spiel", minPlayers: "2", maxPlayers: "4", playTimeMinutes: "45", complexity: "2.4", bggId: "13", imageUrl: null }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "game-3", name: "Catan" }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "proposal-3", gameId: "game-3", game: { ...proposal.game, id: "game-3", name: "Catan" }, _count: { votes: 0 } }) } as Response);
    renderVoting();
    fireEvent.change(screen.getByLabelText("BGG-Suche"), { target: { value: " Catan " } });
    fireEvent.click(screen.getByRole("button", { name: "BGG suchen" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/bgg?query=%20Catan%20"));
    fireEvent.click(screen.getByRole("button", { name: "BGG importieren" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/bgg?bggId=bgg-13"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Spiel importiert" })));
  });

  it("shows the blocked state when game proposals are unavailable", () => {
    renderVoting({ initialEvent: {
      id: "event-1", title: "Spieleabend", eventDate: new Date("2026-12-01"), location: "Berlin", description: null,
      eventState: { ...eventState, available: { voteGame: false, proposeGame: false }, blockedReason: "Nur Veranstalter dürfen abstimmen" },
      proposals: [], invites: [], createdBy: { id: "owner", name: "Owner" }, selectedGame: null,
      selectedGameId: null, winningProposalId: null, currentUserId: "user-2", isCreator: false,
    } });
    expect(screen.getByRole("status")).toHaveTextContent("Nur Veranstalter dürfen abstimmen");
    expect(screen.queryByLabelText("BGG-Suche")).not.toBeInTheDocument();
  });
});
