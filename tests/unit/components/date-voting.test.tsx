import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateVotingSection } from "@/components/public-event/date-voting-section";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const makeDateProposal = (
  id: string,
  date: string,
  votes: Array<{ id: string; availability: string; user: { id: string; name: string } }> = [],
  guestVotes: Array<{ id: string; availability: string; guest: { id: string; nickname: string } }> = [],
) => ({ id, date, votes, guestVotes });

const defaultProps = {
  eventId: "event-1",
  token: "test-token",
  currentUserId: "user-1",
  activeGuest: null,
  canVote: true,
  blockedReason: null,
  selectedDate: null,
  initialDateProposals: [
    makeDateProposal("dp-1", "2026-11-06T00:00:00.000Z", [
      { id: "vote-1", availability: "yes", user: { id: "user-1", name: "Ada" } },
    ]),
    makeDateProposal("dp-2", "2026-11-13T00:00:00.000Z"),
  ],
};

describe("DateVotingSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders no section when no dates are proposed", () => {
    const { container } = render(<DateVotingSection {...defaultProps} initialDateProposals={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows saved responses and all three answer options for a logged-in participant", () => {
    render(<DateVotingSection {...defaultProps} />);

    expect(screen.getByTestId("date-voting-section")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Ja" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByText("Deine Antwort: Ja")).toBeInTheDocument();
  });

  it("uses the public guest endpoint and records the saved answer after success", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({ ok: true });
    render(
      <DateVotingSection
        {...defaultProps}
        currentUserId={null}
        activeGuest={{ id: "guest-1", nickname: "Kai" }}
        initialDateProposals={[makeDateProposal("dp-1", "2026-11-06T00:00:00.000Z")]}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Vielleicht" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      "/api/public/event/test-token/date-vote",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ guestId: "guest-1", votes: [{ dateProposalId: "dp-1", availability: "maybe" }] }),
      }),
    ));
    await waitFor(() => expect(screen.getByRole("radio", { name: "Vielleicht" })).toBeChecked());
  });

  it("keeps the currently focused answer group mounted while a request is pending", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (response: { ok: boolean }) => void;
    mockFetch.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
    render(<DateVotingSection {...defaultProps} />);

    const group = screen.getByRole("group", { name: "Freitag, 6. November 2026" });
    const radio = within(group).getByRole("radio", { name: "Nein" });
    await user.click(radio);

    expect(group).toHaveAttribute("aria-busy", "true");
    expect(within(group).getByRole("radio", { name: "Nein" })).toBeInTheDocument();
    expect(screen.getByText("Antwort wird gespeichert …")).toBeInTheDocument();
    resolveFetch({ ok: true });
    await waitFor(() => expect(within(group).getByRole("radio", { name: "Nein" })).toBeChecked());
  });

  it("keeps the saved answer after an error and exposes recovery text", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "Serverfehler" }) });
    render(<DateVotingSection {...defaultProps} />);

    await user.click(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Nein" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Serverfehler.*erneut/i);
    const group = screen.getByRole("group", { name: "Freitag, 6. November 2026" });
    expect(within(group).getByRole("radio", { name: "Ja" })).toBeChecked();
    expect(within(group).getByRole("radio", { name: "Nein" })).not.toBeChecked();
  });

  it("refreshes FEAT-010 state after a 409 and does not change the saved answer", async () => {
    const user = userEvent.setup();
    const onStateConflict = vi.fn();
    mockFetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "Conflict" }) });
    render(<DateVotingSection {...defaultProps} onStateConflict={onStateConflict} />);

    await user.click(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Nein" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Der Planungsstand hat sich geändert");
    expect(onStateConflict).toHaveBeenCalledOnce();
    expect(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Ja" })).toBeChecked();
  });

  it("uses the saved vote for the current guest, never the account response", () => {
    render(
      <DateVotingSection
        {...defaultProps}
        currentUserId={null}
        activeGuest={{ id: "guest-1", nickname: "Kai" }}
        initialDateProposals={[
          makeDateProposal("dp-1", "2026-11-06T00:00:00.000Z", [
            { id: "vote-1", availability: "yes", user: { id: "user-1", name: "Ada" } },
          ], [
            { id: "guest-vote-1", availability: "no", guest: { id: "guest-1", nickname: "Kai" } },
          ]),
        ]}
      />,
    );

    expect(screen.getByRole("radio", { name: "Nein" })).toBeChecked();
    expect(screen.getByText("Deine Antwort: Nein")).toBeInTheDocument();
  });

  it("does not show active controls when FEAT-010 blocks date votes", () => {
    render(<DateVotingSection {...defaultProps} canVote={false} blockedReason="Die Abstimmung ist geschlossen." />);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getAllByText("Die Abstimmung ist geschlossen.")).toHaveLength(2);
  });

  it("does not show controls without an active participant", () => {
    render(<DateVotingSection {...defaultProps} currentUserId={null} activeGuest={null} />);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getAllByText("Melde dich an oder tritt als Gast bei, um zu antworten.")).toHaveLength(2);
  });

  it("counts registered guests who have not yet voted on any proposed date", () => {
    render(
      <DateVotingSection
        {...defaultProps}
        currentUserId={null}
        activeGuest={null}
        knownGuests={[{ id: "guest-2", nickname: "Jo" }]}
        initialDateProposals={[makeDateProposal("dp-1", "2026-11-06T00:00:00.000Z")]}
      />,
    );

    expect(screen.getByText("Noch nicht beantwortet:").parentElement).toHaveTextContent("Noch nicht beantwortet: 1");
  });
});
