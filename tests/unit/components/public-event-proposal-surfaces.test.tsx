import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockToast } = vi.hoisted(() => ({ mockToast: vi.fn() }));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { BggSearchResults } from "@/components/public-event/bgg-search-results";
import { CollectionGameProposer } from "@/components/public-event/collection-game-proposer";

describe("öffentliche Spielvorschlags-Trefferflächen", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("stellt BGG-Treffer auf einer semantischen Kartenfläche dar", () => {
    render(
      <BggSearchResults
        results={[{ bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null }]}
        detailLoadingId={null}
        onShowDetails={vi.fn()}
      />
    );

    const row = screen.getByRole("list", { name: "Suchergebnisse" }).querySelector("li");
    expect(row).toHaveClass("border-border", "bg-card", "text-card-foreground");
  });

  it("stellt Sammlungstreffer auf derselben semantischen Kartenfläche dar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        id: "game-1",
        name: "Catan",
        imageUrl: null,
        minPlayers: 3,
        maxPlayers: 4,
      }],
    }));

    render(
      <CollectionGameProposer
        token="event-token"
        currentUserId="user-1"
        proposedGameIds={new Set()}
        onProposalAdded={vi.fn()}
      />
    );

    const row = (await screen.findByText("Catan")).parentElement?.parentElement;
    expect(row).toHaveClass("border-border", "bg-card", "text-card-foreground");
  });
});
