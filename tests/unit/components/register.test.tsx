import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import RegisterPage from "@/app/(auth)/register/page";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders register form with all fields", () => {
    render(<RegisterPage />);

    expect(screen.getByTestId("register-form")).toBeInTheDocument();
    expect(screen.getByTestId("register-name")).toBeInTheDocument();
    expect(screen.getByTestId("register-email")).toBeInTheDocument();
    expect(screen.getByTestId("register-password")).toBeInTheDocument();
    expect(screen.getByTestId("register-confirm-password")).toBeInTheDocument();
    expect(screen.getByTestId("register-submit")).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    render(<RegisterPage />);

    await userEvent.type(screen.getByTestId("register-name"), "Test User");
    await userEvent.type(screen.getByTestId("register-email"), "test@test.de");
    // Strong enough password (lowercase + uppercase + number + length >= 8)
    await userEvent.type(screen.getByTestId("register-password"), "StrongPass1!");
    await userEvent.type(screen.getByTestId("register-confirm-password"), "DifferentPass1!");
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(screen.getByTestId("register-error")).toHaveTextContent(
        "Passwörter stimmen nicht überein"
      );
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows error when password is too short", async () => {
    render(<RegisterPage />);

    await userEvent.type(screen.getByTestId("register-name"), "Test User");
    await userEvent.type(screen.getByTestId("register-email"), "test@test.de");
    // Short but has mixed chars so strength >= 2 but length < 8
    await userEvent.type(screen.getByTestId("register-password"), "Ab1!xyz");
    await userEvent.type(screen.getByTestId("register-confirm-password"), "Ab1!xyz");
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(screen.getByTestId("register-error")).toHaveTextContent(
        "Passwort muss mindestens 8 Zeichen lang sein"
      );
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("redirects to login on successful registration", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByTestId("register-name"), "Test User");
    await userEvent.type(screen.getByTestId("register-email"), "test@test.de");
    await userEvent.type(screen.getByTestId("register-password"), "StrongPass1!");
    await userEvent.type(screen.getByTestId("register-confirm-password"), "StrongPass1!");
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?registered=true");
    });
  });

  it("shows server error on failed registration", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "E-Mail bereits vergeben" }),
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByTestId("register-name"), "Test User");
    await userEvent.type(screen.getByTestId("register-email"), "existing@test.de");
    await userEvent.type(screen.getByTestId("register-password"), "StrongPass1!");
    await userEvent.type(screen.getByTestId("register-confirm-password"), "StrongPass1!");
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(screen.getByTestId("register-error")).toHaveTextContent("E-Mail bereits vergeben");
    });
  });

  it("shows generic error on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<RegisterPage />);

    await userEvent.type(screen.getByTestId("register-name"), "Test User");
    await userEvent.type(screen.getByTestId("register-email"), "test@test.de");
    await userEvent.type(screen.getByTestId("register-password"), "StrongPass1!");
    await userEvent.type(screen.getByTestId("register-confirm-password"), "StrongPass1!");
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(screen.getByTestId("register-error")).toHaveTextContent("Ein Fehler ist aufgetreten");
    });
  });

  it("submit button is disabled when password is too weak", async () => {
    render(<RegisterPage />);

    // Type a weak password (7 chars lowercase only → strength = 1, below threshold of 2)
    await userEvent.type(screen.getByTestId("register-password"), "abcdefg");

    expect(screen.getByTestId("register-submit")).toBeDisabled();
  });

  it("has link to login page", () => {
    render(<RegisterPage />);
    const link = screen.getByRole("link", { name: /anmelden/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
