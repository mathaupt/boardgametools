import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

const { mockToast } = vi.hoisted(() => ({ mockToast: vi.fn() }));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { BggSearchResults } from "@/components/public-event/bgg-search-results";
import { CollectionGameProposer } from "@/components/public-event/collection-game-proposer";
import { BggGameSearch } from "@/components/public-event/bgg-game-search";

describe("öffentliche Spielvorschlags-Trefferflächen", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("ordnet BGG-Treffer als benannte Liste mit eindeutigen Detailaktionen ein", () => {
    render(
      <BggSearchResults
        results={[{ bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null }]}
        detailLoadingId={null}
        onShowDetails={vi.fn()}
      />
    );

    expect(screen.getByRole("list", { name: "Suchergebnisse" })).toContainElement(screen.getByRole("listitem"));
    expect(screen.getByRole("button", { name: "Details zu Catan" })).toBeEnabled();
  });

  it("beschriftet die Sammlungssuche und stellt nach dem Zurücksetzen alle Treffer wieder her", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        id: "game-1",
        name: "Catan",
        imageUrl: null,
        minPlayers: 3,
        maxPlayers: 4,
      }, { id: "game-2", name: "Azul", imageUrl: null, minPlayers: 2, maxPlayers: 4 }],
    }));

    render(
      <CollectionGameProposer
        token="event-token"
        currentUserId="user-1"
        proposedGameIds={new Set()}
        onProposalAdded={vi.fn()}
      />
    );

    await screen.findByText("Catan");
    const input = screen.getByRole("searchbox", { name: "Spiel in deiner Sammlung suchen" });
    expect(screen.getByRole("list", { name: "Spiele aus deiner Sammlung" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Catan vorschlagen" })).toHaveTextContent("Vorschlagen");
    await user.type(input, "Azul");
    expect(screen.queryByText("Catan")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Suche zurücksetzen" }));
    expect(input).toHaveValue("");
    expect(screen.getByText("Catan")).toBeInTheDocument();
    expect(screen.getByText("Azul")).toBeInTheDocument();
  });

  it("gibt BGG-Suchhinweise nur einmal aus und erhält den gesperrten Suchzustand", async () => {
    const { container } = render(<BggGameSearch token="event" currentUserId="user" activeGuestId={null} proposalOpen onProposalAdded={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Suchen" })).toBeDisabled();
    expect(screen.queryByText("Gib mindestens zwei Zeichen ein.")).not.toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });
});
