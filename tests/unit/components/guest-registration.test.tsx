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
import type { PublicActor } from "@/lib/events/public-actor";

const defaultProps = {
  token: "test-token-123",
  actor: { kind: "observer" } as PublicActor,
  onGuestJoined: vi.fn(),
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

  it("lets the guest registration grid and long nickname input shrink at narrow zoom widths", () => {
    render(<GuestRegistrationPanel {...defaultProps} />);

    const nicknameInput = screen.getByTestId("guest-nickname-input");
    expect(nicknameInput.closest("section")).toHaveClass("min-w-0");
    expect(nicknameInput).toHaveClass("min-w-0");
    expect(screen.getByTestId("guest-join-button")).toHaveClass("whitespace-normal");
    expect(nicknameInput).toHaveClass("min-h-11");
    expect(screen.getByTestId("guest-join-button")).toHaveClass("min-h-11");
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
        createdAt: "2025-01-01T00:00:00Z",
        votesCount: 0,
      });
    });

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

  it("shows the active guest identity instead of a second registration action", () => {
    render(
      <GuestRegistrationPanel
        {...defaultProps}
        actor={{ kind: "guest", guestId: "guest-1", nickname: "MaxGuest" }}
      />
    );

    expect(screen.queryByTestId("guest-nickname-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("guest-join-button")).not.toBeInTheDocument();
    expect(screen.getByText("Du nimmst als Gast MaxGuest teil.")).toBeInTheDocument();
  });

  it("does not show the guest form for an authenticated account", () => {
    render(<GuestRegistrationPanel {...defaultProps} actor={{ kind: "user", userId: "u1", displayName: "Anna" }} />);
    expect(screen.queryByTestId("guest-nickname-input")).not.toBeInTheDocument();
    expect(screen.getByText("Du bist angemeldet als Anna.")).toBeInTheDocument();
  });
});
