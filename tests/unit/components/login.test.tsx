import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Hoisted mocks (available inside vi.mock factories)
const { mockPush, mockRefresh, mockSignIn } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with all fields", () => {
    render(<LoginPage />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("login-email")).toBeInTheDocument();
    expect(screen.getByTestId("login-password")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit")).toBeInTheDocument();
  });

  it("shows error on invalid credentials", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });

    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("login-email"), "test@test.de");
    await userEvent.type(screen.getByTestId("login-password"), "wrongpass");
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toHaveTextContent("Ungültige Anmeldedaten");
    });
  });

  it("redirects to dashboard on success", async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("login-email"), "test@test.de");
    await userEvent.type(screen.getByTestId("login-password"), "correct");
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error on network failure", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));

    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("login-email"), "test@test.de");
    await userEvent.type(screen.getByTestId("login-password"), "pass123");
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toHaveTextContent("Ein Fehler ist aufgetreten");
    });
  });

  it("disables submit button while loading", async () => {
    mockSignIn.mockReturnValue(new Promise(() => {}));

    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("login-email"), "test@test.de");
    await userEvent.type(screen.getByTestId("login-password"), "pass123");
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(screen.getByTestId("login-submit")).toBeDisabled();
    });
  });

  it("has link to register page", () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: /registrieren/i });
    expect(link).toHaveAttribute("href", "/register");
  });
});
