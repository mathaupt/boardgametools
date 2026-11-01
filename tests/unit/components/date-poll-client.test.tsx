import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import DatePollClient from "@/app/(dashboard)/dashboard/events/[id]/date-poll-client";

const initialProposals = [{
  id: "dp-1",
  date: "2026-11-06T00:00:00.000Z",
  votes: [{
    id: "vote-1",
    availability: "yes",
    user: { id: "user-1", name: "Ada", email: "private@example.com" },
  }],
  guestVotes: [{
    id: "guest-vote-1",
    availability: "maybe",
    guest: { id: "guest-1", nickname: "Kai" },
  }],
}];

const renderClient = (overrides: Partial<Parameters<typeof DatePollClient>[0]> = {}) => render(
  <DatePollClient
    eventId="event-1"
    userId="user-1"
    isCreator={true}
    canVoteDate={true}
    canManageDates={true}
    canSelectDate={true}
    canResetDates={true}
    blockedReason={null}
    initialProposals={initialProposals}
    selectedDate={null}
    {...overrides}
  />,
);

describe("DatePollClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows saved answer and a date-specific organizer action without exposing email", () => {
    renderClient();
    const group = screen.getByRole("group", { name: "Freitag, 6. November 2026" });

    expect(within(group).getByRole("radio", { name: "Ja" })).toBeChecked();
    expect(screen.getByText("Deine Antwort: Ja")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Freitag, 6. November 2026 als Termin festlegen" })).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("updates the saved response only after the server accepts it", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: true } as Response);
    renderClient();

    await user.click(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Nein" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      "/api/events/event-1/date-proposals/vote",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ dateProposalId: "dp-1", availability: "no" }),
      }),
    ));
    expect(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Nein" })).toBeChecked();
  });

  it("preserves the selected saved response when a vote request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    renderClient();

    await user.click(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Nein" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/konnte nicht gespeichert werden.*erneut/i);
    expect(within(screen.getByRole("group", { name: "Freitag, 6. November 2026" })).getByRole("radio", { name: "Ja" })).toBeChecked();
  });

  it("renders read-only status and hides controls when FEAT-010 blocks votes", () => {
    renderClient({ canVoteDate: false, canManageDates: false, canSelectDate: false, canResetDates: false, blockedReason: "Der Termin ist bereits vergangen." });

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getAllByText("Der Termin ist bereits vergangen.")).toHaveLength(1);
  });

  it("uses the FEAT-010 date-only calendar day when marking the selected proposal", () => {
    renderClient({ selectedDate: "2026-11-06T00:00:00.000Z", canVoteDate: false, canManageDates: false, canSelectDate: false });

    expect(screen.getAllByText("Festgelegter Termin")).toHaveLength(2);
    expect(screen.getAllByText(/6\. November 2026/).length).toBeGreaterThanOrEqual(1);
  });
});
