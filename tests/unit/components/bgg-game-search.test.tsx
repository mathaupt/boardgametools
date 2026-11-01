import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BggGameSearch } from "@/components/public-event/bgg-game-search";

const mockToast = vi.hoisted(() => vi.fn());
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }));
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const props = {
  token: "public-token",
  activeGuestId: null,
  currentUserId: null,
  proposalOpen: true,
  onProposalAdded: vi.fn(),
  onStateConflict: vi.fn(),
};

describe("BggGameSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("shows a persistent label and no empty state before a search", async () => {
    const user = userEvent.setup();
    render(<BggGameSearch {...props} />);
    const input = screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" });
    await user.type(input, "Az");
    expect(screen.queryByText(/Keine Spiele/)).not.toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("submits only on form submit and distinguishes a valid empty result", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(new Response("[]", { status: 200 }));
    render(<BggGameSearch {...props} />);
    await user.type(screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" }), "Catan");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByText("Keine Spiele für „Catan“ gefunden.")).toBeInTheDocument());
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/public/event/public-token/bgg?query=Catan");
  });

  it("clears completed results when the query changes", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(new Response(JSON.stringify([
      { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
    ]), { status: 200 }));
    render(<BggGameSearch {...props} />);
    const input = screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" });
    await user.type(input, "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await screen.findByText("Catan");
    fireEvent.change(input, { target: { value: "Azul" } });
    expect(screen.queryByText("Catan")).not.toBeInTheDocument();
    expect(screen.queryByText(/Keine Spiele/)).not.toBeInTheDocument();
  });

  it("loads details, returns focus to its trigger and proposes once", async () => {
    const user = userEvent.setup();
    const proposal = { id: "proposal-1", game: { name: "Catan" } };
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ bggId: "13", name: "Catan", description: "Test", minPlayers: 3, maxPlayers: 4 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ bggId: "13", name: "Catan", description: "Test", minPlayers: 3, maxPlayers: 4 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(proposal), { status: 201 }));
    render(<BggGameSearch {...props} activeGuestId="guest-1" />);
    await user.type(screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" }), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    const detailsButton = await screen.findByRole("button", { name: "Details zu Catan" });
    await user.click(detailsButton);
    await screen.findByRole("heading", { name: "Catan" });
    await user.click(screen.getByRole("button", { name: "Details schließen" }));
    expect(screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Details zu Catan" }));
    await screen.findByRole("heading", { name: "Catan" });
    await user.click(screen.getByRole("button", { name: "Vorschlagen" }));
    await waitFor(() => expect(props.onProposalAdded).toHaveBeenCalledExactlyOnceWith(proposal));
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("can retry a failed detail request without losing the result trigger", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "BGG vorübergehend nicht verfügbar" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ bggId: "13", name: "Catan", description: "Details verfügbar", minPlayers: 3, maxPlayers: 4 }), { status: 200 }));
    render(<BggGameSearch {...props} />);
    await user.type(screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" }), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await user.click(await screen.findByRole("button", { name: "Details zu Catan" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(await screen.findByText("Details verfügbar")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("ignores detail data after the search query changes", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
      ]), { status: 200 }))
      .mockImplementationOnce((_url: string, { signal }: { signal: AbortSignal }) => new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      }));
    render(<BggGameSearch {...props} />);
    const input = screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" });
    await user.type(input, "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await user.click(await screen.findByRole("button", { name: "Details zu Catan" }));
    await user.clear(input);
    await user.type(input, "Azul");
    expect(screen.queryByText("Catan", { selector: "h3" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sends only one proposal for two rapid clicks", async () => {
    const user = userEvent.setup();
    let resolveProposal!: (response: Response) => void;
    const proposal = { id: "proposal-1", game: { name: "Catan" } };
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ bggId: "13", name: "Catan", description: "Test", minPlayers: 3, maxPlayers: 4 }), { status: 200 }))
      .mockReturnValueOnce(new Promise<Response>((resolve) => { resolveProposal = resolve; }));
    render(<BggGameSearch {...props} activeGuestId="guest-1" />);
    await user.type(screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" }), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await user.click(await screen.findByRole("button", { name: "Details zu Catan" }));
    await screen.findByRole("heading", { name: "Catan" });
    const proposeButton = screen.getByRole("button", { name: "Vorschlagen" });
    fireEvent.click(proposeButton);
    fireEvent.click(proposeButton);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    resolveProposal(new Response(JSON.stringify(proposal), { status: 201 }));
    await waitFor(() => expect(props.onProposalAdded).toHaveBeenCalledExactlyOnceWith(proposal));
  });

  it("does not add a proposal when the server rejects a state conflict", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ bggId: "13", name: "Catan", description: "Test", minPlayers: 3, maxPlayers: 4 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "closed" }), { status: 409 }));
    render(<BggGameSearch {...props} activeGuestId="guest-1" />);
    await user.type(screen.getByRole("searchbox", { name: "Spiel auf BoardGameGeek suchen" }), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await user.click(await screen.findByRole("button", { name: "Details zu Catan" }));
    await screen.findByRole("heading", { name: "Catan" });
    await user.click(screen.getByRole("button", { name: "Vorschlagen" }));
    await waitFor(() => expect(props.onStateConflict).toHaveBeenCalledOnce());
    expect(props.onProposalAdded).not.toHaveBeenCalled();
  });
});
