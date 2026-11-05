import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { SerializedPublicEvent } from "@/lib/public-event";

const { mockLifecycle, mockSetGuests, mockSetProposals, mockRefresh, mockToast } = vi.hoisted(() => ({ mockLifecycle: vi.fn(), mockSetGuests: vi.fn(), mockSetProposals: vi.fn(), mockRefresh: vi.fn(), mockToast: vi.fn() }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }));
vi.mock("@/components/event-voting/proposal-compact-row", () => ({
  ProposalCompactRow: ({ children, name, played }: { children: React.ReactNode; name: string; played?: boolean }) => <li>{name}{played && <span>Gespielt</span>}{children}</li>,
}));
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
  proposals: [{ id: "p1", createdAt: null, game: { id: "game-1", name: "Catan", imageUrl: null, minPlayers: 2, maxPlayers: 4, playTimeMinutes: 60 }, proposedBy: null, totalVotes: 1, voteCounts: { registered: 0, guests: 1 }, userHasVoted: false, played: true }],
  dateProposals: [],
} as unknown as SerializedPublicEvent;

describe("PublicEventClient identity and participation layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    window.localStorage.setItem("bgt-public-guest:token", JSON.stringify({ id: "g1", nickname: "Alex", votes: ["p1"] }));
    mockLifecycle.mockReturnValue({
      eventState: event.eventState,
      proposals: event.proposals,
      setProposals: mockSetProposals,
      dateProposals: event.dateProposals,
      guestParticipants: event.guestParticipants,
      setGuestParticipants: mockSetGuests,
      refreshEventState: mockRefresh,
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
    expect(screen.getByText("Gespielt")).toBeInTheDocument();
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

  it("sortiert Vorschläge nach Name und aktualisiert Stimmen bei erfolgreicher Abstimmung", async () => {
    const proposals = [event.proposals[0], { ...event.proposals[0], id: "p2", game: { ...event.proposals[0].game, id: "game-2", name: "Azul" }, totalVotes: 3, voteCounts: { registered: 2, guests: 1 } }];
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: true })); vi.stubGlobal("fetch", fetchMock);
    mockLifecycle.mockReturnValue({ eventState: event.eventState, proposals, setProposals: mockSetProposals, dateProposals: event.dateProposals, guestParticipants: event.guestParticipants, setGuestParticipants: mockSetGuests, refreshError: null, refreshEventState: mockRefresh });
    const user = (await import("@testing-library/user-event")).default.setup();
    render(<PublicEventClient token="token" event={{ ...event, proposals } as SerializedPublicEvent} />);
    await user.selectOptions(screen.getByRole("combobox"), "name");
    const rows = Array.from(document.querySelectorAll("#event-games li")); expect(rows[0]).toHaveTextContent("Azul");
    await user.click(screen.getByTestId("user-vote-p1"));
    expect(fetchMock).toHaveBeenCalledWith("/api/events/event-1/votes", expect.objectContaining({ method: "POST", body: JSON.stringify({ proposalId: "p1" }) }));
    const update = mockSetProposals.mock.calls.at(-1)?.[0] as (current: typeof proposals) => typeof proposals;
    expect(update(proposals)[0]).toMatchObject({ id: "p1", userHasVoted: true, totalVotes: 2, voteCounts: { registered: 1, guests: 1 } });
  });

  it("behandelt Abstimmkonflikte und abgelaufene Nutzersitzungen", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ error: "conflict" }, { status: 409 })).mockResolvedValueOnce(Response.json({ error: "expired" }, { status: 401 })); vi.stubGlobal("fetch", fetchMock);
    const user = (await import("@testing-library/user-event")).default.setup(); render(<PublicEventClient token="token" event={event} />);
    await user.click(screen.getByRole("button", { name: "Stimme abgeben" }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Vote fehlgeschlagen", description: expect.stringContaining("Planungsstand hat sich geändert") })));
    await user.click(screen.getByRole("button", { name: "Stimme abgeben" }));
    expect(await screen.findByText("Melde dich an oder nimm als Gast teil, um abzustimmen.")).toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });

  it("entfernt Gaststimmen über den öffentlichen Endpunkt und aktualisiert die Gastwahl", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ authorized: true }))
      .mockResolvedValueOnce(Response.json({ success: true })); vi.stubGlobal("fetch", fetchMock);
    const user = (await import("@testing-library/user-event")).default.setup();
    render(<PublicEventClient token="token" event={{ ...event, currentUser: null, currentUserId: null } as SerializedPublicEvent} />);
    await user.click(await screen.findByTestId("guest-vote-p1"));
    expect(fetchMock).toHaveBeenCalledWith("/api/public/event/token/vote?guestId=g1&proposalId=p1", expect.objectContaining({ method: "DELETE" }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("bgt-public-guest:token") ?? "{}").votes).toEqual([]));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("zeigt den leeren Vorschlagszustand, Sperrgrund und ermöglicht die Eventaktualisierung", async () => {
    mockLifecycle.mockReturnValue({
      eventState: { ...event.eventState, available: { voteGame: false, voteDate: false, proposeGame: false, join: false }, blockedReason: "Das Event ist geschlossen.", label: "Abgeschlossen" },
      proposals: [], setProposals: mockSetProposals, dateProposals: [], guestParticipants: [], setGuestParticipants: mockSetGuests,
      refreshError: "Aktualisierung fehlgeschlagen", refreshEventState: mockRefresh,
    });
    const user = (await import("@testing-library/user-event")).default.setup();
    render(<PublicEventClient token="token" event={{ ...event, proposals: [], guestParticipants: [], currentUser: null, currentUserId: null } as SerializedPublicEvent} />);
    expect(screen.getByText(/Noch keine Spielvorschläge vorhanden/)).toBeInTheDocument();
    expect(screen.getByText("Aktualisierung fehlgeschlagen")).toBeInTheDocument();
    expect(await screen.findByText("Das Event ist geschlossen.")).toBeInTheDocument();
    expect(screen.queryByTestId("collection")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bgg")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Wiederholen" }));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
