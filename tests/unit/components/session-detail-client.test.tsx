import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push, toast } = vi.hoisted(() => ({ push: vi.fn(), toast: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: ({ fill, ...props }: any) => <img {...props} /> }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast }) }));

import SessionDetailClient, { type SessionData } from "@/app/(dashboard)/dashboard/sessions/[id]/session-detail-client";

const session: SessionData = {
  id: "session-1", gameId: "game-1", playedAt: "2026-10-01T12:00:00.000Z", durationMinutes: 90,
  notes: "Spannende Partie", createdAt: "2026-10-02T12:00:00.000Z",
  game: { id: "game-1", name: "Catan", imageUrl: "/cover.jpg" },
  createdBy: { id: "user-1", name: "Mara", email: "mara@example.com" },
  players: [
    { id: "player-2", userId: "user-2", score: 7, isWinner: false, placement: 2, user: { id: "user-2", name: null, email: "alex@example.com" } },
    { id: "player-1", userId: "user-1", score: 10, isWinner: true, placement: 1, user: { id: "user-1", name: "Mara", email: null } },
  ],
  ratings: [{ id: "rating-1", rating: 4, comment: "Schön!", createdAt: "2026-10-02T12:00:00.000Z", user: { id: "user-2", name: null, email: "alex@example.com" } }],
};

describe("SessionDetailClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders game cover, session details, sorted player results, and ratings", () => {
    render(<SessionDetailClient session={session} />);

    expect(screen.getByRole("heading", { name: "Catan" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Catan" })).toHaveAttribute("src", "/cover.jpg");
    expect(screen.getByText("90 Minuten")).toBeInTheDocument();
    expect(screen.getByText("Spannende Partie")).toBeInTheDocument();
    expect(screen.getAllByText("Mara").length).toBeGreaterThan(0);
    expect(screen.getAllByText("alex@example.com").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Gewinner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bewertungen" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("#1");
    expect(rows[2]).toHaveTextContent("#2");
  });

  it("omits optional cover, duration, notes, ratings, and handles an empty player list", () => {
    render(<SessionDetailClient session={{ ...session, durationMinutes: null, notes: null, players: [], ratings: [], game: { ...session.game, imageUrl: null } }} />);
    expect(screen.queryByRole("img", { name: "Catan" })).not.toBeInTheDocument();
    expect(screen.queryByText("90 Minuten")).not.toBeInTheDocument();
    expect(screen.queryByText("Spannende Partie")).not.toBeInTheDocument();
    expect(screen.queryByText("Bewertung(en)")).not.toBeInTheDocument();
    expect(screen.getAllByText("0 Spieler").length).toBeGreaterThan(0);
  });

  it("deletes after confirmation and navigates back to sessions", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<SessionDetailClient session={session} />);
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getByText(/Diese Aktion kann nicht rückgängig gemacht werden/)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Löschen" }).at(-1)!);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/sessions/session-1", { method: "DELETE" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/sessions"));
  });

  it("shows a toast and allows retry when deletion fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    render(<SessionDetailClient session={session} />);
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    await user.click(screen.getAllByRole("button", { name: "Löschen" }).at(-1)!);

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Fehler", description: "Fehler beim Löschen der Session.", variant: "destructive",
    })));
    expect(screen.getByRole("button", { name: "Löschen" })).toBeEnabled();
  });
});
