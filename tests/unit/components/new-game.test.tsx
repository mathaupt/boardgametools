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

// Mock BarcodeScanner component to avoid complex dependency loading
vi.mock("@/components/barcode-scanner", () => ({
  BarcodeScanner: () => null,
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import NewGamePage from "@/app/(dashboard)/dashboard/games/new/page";

describe("NewGamePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders new game form with all fields", () => {
    render(<NewGamePage />);

    expect(screen.getByTestId("new-game-form")).toBeInTheDocument();
    expect(screen.getByTestId("game-name")).toBeInTheDocument();
    expect(screen.getByTestId("game-description")).toBeInTheDocument();
    expect(screen.getByTestId("game-min-players")).toBeInTheDocument();
    expect(screen.getByTestId("game-max-players")).toBeInTheDocument();
    expect(screen.getByTestId("game-play-time")).toBeInTheDocument();
    expect(screen.getByTestId("game-complexity")).toBeInTheDocument();
    expect(screen.getByTestId("game-bgg-id")).toBeInTheDocument();
    expect(screen.getByTestId("game-submit")).toBeInTheDocument();
  });

  it("submits form data and redirects on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "game-1" }),
    });

    render(<NewGamePage />);

    await userEvent.type(screen.getByTestId("game-name"), "Catan");
    await userEvent.clear(screen.getByTestId("game-min-players"));
    await userEvent.type(screen.getByTestId("game-min-players"), "3");
    await userEvent.clear(screen.getByTestId("game-max-players"));
    await userEvent.type(screen.getByTestId("game-max-players"), "4");
    fireEvent.submit(screen.getByTestId("new-game-form"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/games",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/games");
    });
  });

  it("shows server error on failed submission", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Name ist erforderlich" }),
    });

    render(<NewGamePage />);

    await userEvent.type(screen.getByTestId("game-name"), "X");
    fireEvent.submit(screen.getByTestId("new-game-form"));

    await waitFor(() => {
      expect(screen.getByTestId("new-game-error")).toHaveTextContent("Name ist erforderlich");
    });
  });

  it("shows generic error on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<NewGamePage />);

    await userEvent.type(screen.getByTestId("game-name"), "Catan");
    fireEvent.submit(screen.getByTestId("new-game-form"));

    await waitFor(() => {
      expect(screen.getByTestId("new-game-error")).toHaveTextContent("Ein Fehler ist aufgetreten");
    });
  });

  it("disables submit button while loading", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    render(<NewGamePage />);

    await userEvent.type(screen.getByTestId("game-name"), "Catan");
    fireEvent.submit(screen.getByTestId("new-game-form"));

    await waitFor(() => {
      expect(screen.getByTestId("game-submit")).toBeDisabled();
    });
  });

  it("has default player count values", () => {
    render(<NewGamePage />);

    expect(screen.getByTestId("game-min-players")).toHaveValue(1);
    expect(screen.getByTestId("game-max-players")).toHaveValue(4);
  });
});
