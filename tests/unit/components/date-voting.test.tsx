import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { DateVotingSection } from "@/components/public-event/date-voting-section";

const makeDateProposal = (id: string, date: string) => ({
  id,
  date,
  votes: [] as Array<{ id: string; availability: string; user: { id: string; name: string; email: string } }>,
  guestVotes: [] as Array<{ id: string; availability: string; guest: { id: string; nickname: string } }>,
});

const defaultProps = {
  eventId: "event-1",
  token: "test-token",
  currentUserId: "user-1",
  activeGuest: null,
  isPast: false,
  selectedDate: null,
  initialDateProposals: [
    makeDateProposal("dp-1", "2025-06-15T00:00:00Z"),
    makeDateProposal("dp-2", "2025-06-22T00:00:00Z"),
  ],
};

describe("DateVotingSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no date proposals", () => {
    const { container } = render(
      <DateVotingSection {...defaultProps} initialDateProposals={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders section with date rows", () => {
    render(<DateVotingSection {...defaultProps} />);

    expect(screen.getByTestId("date-voting-section")).toBeInTheDocument();
    expect(screen.getByTestId("date-row-dp-1")).toBeInTheDocument();
    expect(screen.getByTestId("date-row-dp-2")).toBeInTheDocument();
  });

  it("renders vote buttons for logged-in user", () => {
    render(<DateVotingSection {...defaultProps} />);

    expect(screen.getByTestId("date-vote-yes-dp-1")).toBeInTheDocument();
    expect(screen.getByTestId("date-vote-maybe-dp-1")).toBeInTheDocument();
    expect(screen.getByTestId("date-vote-no-dp-1")).toBeInTheDocument();
  });

  it("renders vote buttons for guest", () => {
    render(
      <DateVotingSection
        {...defaultProps}
        currentUserId={null}
        activeGuest={{ id: "guest-1", nickname: "TestGuest" }}
      />
    );

    expect(screen.getByTestId("date-vote-yes-dp-1")).toBeInTheDocument();
    expect(screen.getByTestId("date-vote-maybe-dp-1")).toBeInTheDocument();
    expect(screen.getByTestId("date-vote-no-dp-1")).toBeInTheDocument();
  });

  it("does not render vote buttons when isPast", () => {
    render(<DateVotingSection {...defaultProps} isPast={true} />);

    expect(screen.queryByTestId("date-vote-yes-dp-1")).not.toBeInTheDocument();
  });

  it("does not render vote buttons when no user and no guest", () => {
    render(
      <DateVotingSection {...defaultProps} currentUserId={null} activeGuest={null} />
    );

    expect(screen.queryByTestId("date-vote-yes-dp-1")).not.toBeInTheDocument();
  });

  it("calls authenticated API on user vote", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(<DateVotingSection {...defaultProps} />);

    fireEvent.click(screen.getByTestId("date-vote-yes-dp-1"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/events/event-1/date-proposals/vote",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ dateProposalId: "dp-1", availability: "yes" }),
        })
      );
    });
  });

  it("calls guest API on guest vote", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(
      <DateVotingSection
        {...defaultProps}
        currentUserId={null}
        activeGuest={{ id: "guest-1", nickname: "TestGuest" }}
      />
    );

    fireEvent.click(screen.getByTestId("date-vote-maybe-dp-2"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/public/event/test-token/date-vote",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            guestId: "guest-1",
            votes: [{ dateProposalId: "dp-2", availability: "maybe" }],
          }),
        })
      );
    });
  });

  it("shows error toast on failed vote", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Vote conflict" }),
    });

    render(<DateVotingSection {...defaultProps} />);

    fireEvent.click(screen.getByTestId("date-vote-no-dp-1"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Termin-Vote fehlgeschlagen",
          variant: "destructive",
        })
      );
    });
  });
});
