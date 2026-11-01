import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { SerializedPublicEvent } from "@/lib/public-event";

const { mockLifecycle, mockSetGuests, mockToast } = vi.hoisted(() => ({ mockLifecycle: vi.fn(), mockSetGuests: vi.fn(), mockToast: vi.fn() }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }));
vi.mock("@/components/event-voting/proposal-compact-row", () => ({
  ProposalCompactRow: ({ children, name }: { children: React.ReactNode; name: string }) => <li>{name}{children}</li>,
}));
vi.mock("@/components/event-voting/proposal-sort-control", () => ({ ProposalSortControl: () => null }));
vi.mock("@/components/public-event/use-public-event-lifecycle", () => ({ usePublicEventLifecycle: mockLifecycle }));
vi.mock("@/components/public-event/date-voting-section", () => ({ DateVotingSection: () => <div data-testid="dates" /> }));
vi.mock("@/components/public-event/collection-game-proposer", () => ({ CollectionGameProposer: () => <div data-testid="collection" /> }));
vi.mock("@/components/public-event/bgg-game-search", () => ({ BggGameSearch: () => <div data-testid="bgg" /> }));

import { PublicEventClient } from "@/components/public-event/public-event-client";

const event = {
  id: "event-1", title: "Abend", description: null, eventDate: "2026-12-01T18:00:00.000Z", location: "Berlin",
  status: "voting", shareToken: "token", isPublic: true, createdBy: { id: "owner", name: "Alex" }, invites: [],
  selectedGame: null, winningProposal: null, selectedDate: null,
  eventState: { available: { voteGame: true, voteDate: true, proposeGame: true, join: true }, blockedReason: null, label: "Offen" },
  currentUserId: "u1", currentUser: { id: "u1", name: "Anna" },
  guestParticipants: [{ id: "g1", nickname: "Alex", createdAt: "2026-11-01T10:00:00.000Z", votesCount: 2 }],
  proposals: [{ id: "p1", createdAt: null, game: { id: "game-1", name: "Catan", imageUrl: null, minPlayers: 2, maxPlayers: 4, playTimeMinutes: 60 }, proposedBy: null, totalVotes: 1, voteCounts: { registered: 0, guests: 1 }, userHasVoted: false }],
  dateProposals: [],
} as unknown as SerializedPublicEvent;

describe("PublicEventClient identity and participation layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem("bgt-public-guest:token", JSON.stringify({ id: "g1", nickname: "Alex", votes: ["p1"] }));
    mockLifecycle.mockReturnValue({
      eventState: event.eventState,
      proposals: event.proposals,
      setProposals: vi.fn(),
      dateProposals: event.dateProposals,
      guestParticipants: event.guestParticipants,
      setGuestParticipants: mockSetGuests,
      refreshEventState: vi.fn(),
    });
  });

  it("uses only the account action and renders a guest once in the shared participant section", async () => {
    render(<PublicEventClient token="token" event={event} />);

    expect(await screen.findByText("Du bist angemeldet als Anna.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stimme abgeben" })).toBeInTheDocument();
    expect(screen.queryByTestId("guest-nickname-input")).not.toBeInTheDocument();
    expect(screen.getAllByText("Alex")).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Spiele wählen" }).every((link) => link.getAttribute("href") === "#event-games")).toBe(true);
    expect(screen.getByRole("heading", { name: "Teilnehmende (1)" })).toBeInTheDocument();
    expect(Array.from(document.querySelectorAll("div")).some((element) =>
      element.classList.contains("lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]")
    )).toBe(true);
  });

  it("upserts the server-confirmed guest after successful registration", async () => {
    window.localStorage.clear();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "g2", nickname: "Mia", createdAt: "2026-11-02T10:00:00.000Z", votesCount: 4 }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const user = (await import("@testing-library/user-event")).default.setup();
    render(<PublicEventClient token="token" event={{ ...event, currentUser: null, currentUserId: null } as SerializedPublicEvent} />);

    await user.type(await screen.findByTestId("guest-nickname-input"), "Mia");
    await user.click(screen.getByTestId("guest-join-button"));

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Willkommen!" })));
    const update = mockSetGuests.mock.calls[0][0] as (current: typeof event.guestParticipants) => typeof event.guestParticipants;
    expect(update(event.guestParticipants)).toEqual([
      event.guestParticipants[0],
      { id: "g2", nickname: "Mia", createdAt: "2026-11-02T10:00:00.000Z", votesCount: 4 },
    ]);
    expect(JSON.parse(window.localStorage.getItem("bgt-public-guest:token") ?? "{}").id).toBe("g2");
  });
});
