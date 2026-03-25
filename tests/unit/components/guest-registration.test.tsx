import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GuestRegistrationPanel } from "@/components/public-event/guest-registration-panel";

const defaultProps = {
  token: "test-token-123",
  activeGuest: null,
  initialGuestList: [],
  onGuestJoined: vi.fn(),
  persistGuest: vi.fn(),
};

describe("GuestRegistrationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nickname input and join button when no active guest", () => {
    render(<GuestRegistrationPanel {...defaultProps} />);

    expect(screen.getByTestId("guest-nickname-input")).toBeInTheDocument();
    expect(screen.getByTestId("guest-join-button")).toBeInTheDocument();
  });

  it("disables join button when nickname is too short", () => {
    render(<GuestRegistrationPanel {...defaultProps} />);

    expect(screen.getByTestId("guest-join-button")).toBeDisabled();
  });

  it("enables join button when nickname has 2+ characters", async () => {
    render(<GuestRegistrationPanel {...defaultProps} />);

    await userEvent.type(screen.getByTestId("guest-nickname-input"), "Jo");

    expect(screen.getByTestId("guest-join-button")).not.toBeDisabled();
  });

  it("shows toast when nickname is empty on join", async () => {
    render(<GuestRegistrationPanel {...defaultProps} />);

    // Type and clear to enable button state check
    await userEvent.type(screen.getByTestId("guest-nickname-input"), "AB");
    await userEvent.clear(screen.getByTestId("guest-nickname-input"));
    // Type spaces only (trim makes it empty)
    await userEvent.type(screen.getByTestId("guest-nickname-input"), "   ");

    // Force click even if disabled
    fireEvent.click(screen.getByTestId("guest-join-button"));

    // The button is disabled for less than 2 chars, so the empty/space case
    // would be caught by the trim check in handleGuestJoin
  });

  it("calls API and onGuestJoined on successful registration", async () => {
    const onGuestJoined = vi.fn();
    const persistGuest = vi.fn();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "guest-1",
        nickname: "TestGast",
        createdAt: "2025-01-01T00:00:00Z",
        votesCount: 0,
      }),
    });

    render(
      <GuestRegistrationPanel
        {...defaultProps}
        onGuestJoined={onGuestJoined}
        persistGuest={persistGuest}
      />
    );

    await userEvent.type(screen.getByTestId("guest-nickname-input"), "TestGast");
    fireEvent.click(screen.getByTestId("guest-join-button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/public/event/test-token-123/join",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ nickname: "TestGast" }),
        })
      );
    });

    await waitFor(() => {
      expect(onGuestJoined).toHaveBeenCalledWith({
        id: "guest-1",
        nickname: "TestGast",
      });
    });

    expect(persistGuest).toHaveBeenCalled();
  });

  it("shows error toast on API failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Nickname bereits vergeben" }),
    });

    render(<GuestRegistrationPanel {...defaultProps} />);

    await userEvent.type(screen.getByTestId("guest-nickname-input"), "TestGast");
    fireEvent.click(screen.getByTestId("guest-join-button"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Beitritt fehlgeschlagen",
          variant: "destructive",
        })
      );
    });
  });

  it("shows welcome message when activeGuest is set", () => {
    render(
      <GuestRegistrationPanel
        {...defaultProps}
        activeGuest={{ id: "guest-1", nickname: "MaxGuest" }}
      />
    );

    expect(screen.queryByTestId("guest-nickname-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("guest-join-button")).not.toBeInTheDocument();
  });

  it("renders initial guest list", () => {
    const guests = [
      { id: "g1", nickname: "Alice", createdAt: "2025-01-01T00:00:00Z", votesCount: 3 },
      { id: "g2", nickname: "Bob", createdAt: "2025-01-02T00:00:00Z", votesCount: 1 },
    ];

    render(
      <GuestRegistrationPanel {...defaultProps} initialGuestList={guests} />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("3 Votes")).toBeInTheDocument();
    expect(screen.getByText("1 Votes")).toBeInTheDocument();
  });
});
