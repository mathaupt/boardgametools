import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProposalGameDetails } from "@/components/event-voting/proposal-game-details";

vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }));

const detail = {
  proposalId: "proposal-1",
  name: "Azul",
  description: "Lege farbige Fliesen.",
  descriptionSource: "bgg" as const,
  imageUrl: "https://cdn.example/azul.jpg",
  minPlayers: 2,
  maxPlayers: 4,
  playTimeMinutes: 45,
  complexity: 2,
  bggUrl: "https://boardgamegeek.com/boardgame/230802",
  detailsUnavailable: false,
};

describe("ProposalGameDetails", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads details only after opening and exposes the public event-scoped endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => detail,
    } as Response);
    render(<ProposalGameDetails proposalId="proposal-1" name="Azul" token="share-token" />);

    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Spielname: Azul – Spieldetails öffnen" }));
    expect(await screen.findByText("Lege farbige Fliesen.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/event/share-token/proposals/proposal-1/game",
      expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByRole("link", { name: /Auf BoardGameGeek ansehen/ })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("supports retry after a detail request fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("Netzwerkfehler"))
      .mockResolvedValueOnce({ ok: true, json: async () => detail } as Response);
    render(<ProposalGameDetails proposalId="proposal-1" name="Azul" eventId="event-1" />);

    await user.click(screen.getAllByRole("button", { name: "Spieldetails zu Azul öffnen" })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Netzwerkfehler");
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    await waitFor(() => expect(screen.getByText("Lege farbige Fliesen.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/events/event-1/proposals/proposal-1/game",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("renders user supplied descriptions as text", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ ...detail, description: "<script>alert(1)</script>" }),
    } as Response);
    render(<ProposalGameDetails proposalId="proposal-1" name="Azul" eventId="event-1" />);
    await user.click(screen.getAllByRole("button", { name: "Spieldetails zu Azul öffnen" })[0]);
    expect(await screen.findByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });

  it("closes with Escape and returns focus to the activating control", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => detail } as Response);
    render(<ProposalGameDetails proposalId="proposal-1" name="Azul" eventId="event-1" />);
    const trigger = screen.getByRole("button", { name: "Spielname: Azul – Spieldetails öffnen" });

    await user.click(trigger);
    await screen.findByText("Lege farbige Fliesen.");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
