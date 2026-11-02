import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push, toast } = vi.hoisted(() => ({ push: vi.fn(), toast: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: ({ fill, priority, ...props }: any) => <img {...props} /> }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast }) }));

import GameDetailClient, { type SerializedGame } from "@/app/(dashboard)/dashboard/games/[id]/game-detail-client";

const game: SerializedGame = {
  id: "game-1", name: "Catan", description: "Handel und Aufbau", minPlayers: 3, maxPlayers: 4,
  playTimeMinutes: 60, complexity: 2, bggId: "13", imageUrl: "/catan.jpg",
  tags: [{ tag: { id: "strategy", name: "Strategie" } }],
};

describe("GameDetailClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders cover, description, metadata, tags, and edit link", () => {
    render(<GameDetailClient game={game} />);
    expect(screen.getByRole("heading", { name: "Catan" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Cover von Catan" })).toHaveAttribute("src", "/catan.jpg");
    expect(screen.getByText("Handel und Aufbau")).toBeInTheDocument();
    expect(screen.getByText("3 - 4")).toBeInTheDocument();
    expect(screen.getByText("60 Min.")).toBeInTheDocument();
    expect(screen.getByText("**___")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("Strategie")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bearbeiten" })).toHaveAttribute("href", "/dashboard/games/game-1/edit");
  });

  it("shows fallback metadata when optional values are missing", () => {
    render(<GameDetailClient game={{ ...game, description: null, imageUrl: null, playTimeMinutes: null, complexity: null, bggId: null, tags: [] }} />);
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.queryByText("Handel und Aufbau")).not.toBeInTheDocument();
    expect(screen.queryByText("60 Min.")).not.toBeInTheDocument();
    expect(screen.queryByText("Strategie")).not.toBeInTheDocument();
  });

  it("confirms deletion, sends the request, and navigates to the collection", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<GameDetailClient game={game} />);
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getByText(/wirklich löschen/)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Löschen" }).at(-1)!);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/games/game-1", { method: "DELETE" }));
    expect(push).toHaveBeenCalledWith("/dashboard/games");
  });

  it("shows an error and closes the confirmation when deletion fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    render(<GameDetailClient game={game} />);
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    await user.click(screen.getAllByRole("button", { name: "Löschen" }).at(-1)!);

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Fehler", description: "Spiel konnte nicht gelöscht werden.", variant: "destructive",
    })));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
