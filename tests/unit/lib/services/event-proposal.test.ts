import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ default: { event: { findFirst: vi.fn() }, gameProposal: { findFirst: vi.fn() } } }));
vi.mock("@/lib/event-share", () => ({ findPublicEventByToken: vi.fn() }));
vi.mock("@/lib/bgg", () => ({ fetchBGGGame: vi.fn() }));
vi.mock("@/lib/require-auth", () => ({ ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } } }));

import prisma from "@/lib/db";
import { findPublicEventByToken } from "@/lib/event-share";
import { fetchBGGGame } from "@/lib/bgg";
import { EventProposalService } from "@/lib/services/event-proposal.service";

const proposal = {
  id: "proposal-1",
  eventId: "event-1",
  bggId: null,
  bggName: null,
  bggImageUrl: null,
  bggMinPlayers: null,
  bggMaxPlayers: null,
  bggPlayTimeMinutes: null,
  game: {
    name: "Azul",
    description: "Private collection description",
    imageUrl: "https://cdn.example/azul.jpg",
    minPlayers: 2,
    maxPlayers: 4,
    playTimeMinutes: 45,
    complexity: 2,
    bggId: "230802",
    deletedAt: null,
  },
};

describe("EventProposalService.getGameDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns collection description only to an authorized private event participant", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValue({
      createdById: "creator-1",
      invites: [{ userId: "player-1" }],
    } as never);
    vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue(proposal as never);

    const result = await EventProposalService.getGameDetail(
      { kind: "private", eventId: "event-1", userId: "player-1" },
      "proposal-1",
    );

    expect(result.description).toBe("Private collection description");
    expect(result.descriptionSource).toBe("collection");
    expect(result.bggUrl).toBe("https://boardgamegeek.com/boardgame/230802");
    expect(prisma.event.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "event-1", deletedAt: null },
      select: expect.objectContaining({ createdById: true, invites: expect.any(Object) }),
    }));
    expect(JSON.stringify(result)).not.toContain("owner");
  });

  it("does not expose the collection description on a public event link", async () => {
    vi.mocked(findPublicEventByToken).mockResolvedValue({ id: "event-1" } as never);
    vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue(proposal as never);
    vi.mocked(fetchBGGGame).mockResolvedValue({
      bggId: "230802", name: "Azul", description: "Public BGG rules", imageUrl: null,
      minPlayers: 2, maxPlayers: 4, playTimeMinutes: 30, complexity: 1.8,
    } as never);

    const result = await EventProposalService.getGameDetail(
      { kind: "public", token: "public-token" },
      "proposal-1",
    );

    expect(result.description).toBe("Public BGG rules");
    expect(result.descriptionSource).toBe("bgg");
    expect(JSON.stringify(result)).not.toContain("Private collection description");
    expect(findPublicEventByToken).toHaveBeenCalledWith("public-token");
  });

  it("rejects a private user without creator or invitation access", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValue({ createdById: "someone-else", invites: [] } as never);

    await expect(EventProposalService.getGameDetail(
      { kind: "private", eventId: "event-1", userId: "stranger" },
      "proposal-1",
    )).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.gameProposal.findFirst).not.toHaveBeenCalled();
  });

  it("rejects a proposal that does not belong to the authorized event", async () => {
    vi.mocked(findPublicEventByToken).mockResolvedValue({ id: "event-1" } as never);
    vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue(null as never);

    await expect(EventProposalService.getGameDetail(
      { kind: "public", token: "public-token" },
      "foreign-proposal",
    )).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns BGG-only summary if BGG details are temporarily unavailable", async () => {
    vi.mocked(findPublicEventByToken).mockResolvedValue({ id: "event-1" } as never);
    vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue({
      ...proposal, game: null, bggId: "123", bggName: "BGG-Spiel", bggImageUrl: null,
      bggMinPlayers: 2, bggMaxPlayers: 4, bggPlayTimeMinutes: 60,
    } as never);
    vi.mocked(fetchBGGGame).mockResolvedValue(null);

    const result = await EventProposalService.getGameDetail(
      { kind: "public", token: "public-token" }, "proposal-1",
    );

    expect(result).toMatchObject({ name: "BGG-Spiel", detailsUnavailable: true, description: null });
  });

  it("does not return unsafe image schemes from stored proposal data", async () => {
    vi.mocked(findPublicEventByToken).mockResolvedValue({ id: "event-1" } as never);
    vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue({
      ...proposal, game: null, bggId: null, bggName: "BGG-Spiel",
      bggImageUrl: "javascript:alert(1)",
    } as never);

    const result = await EventProposalService.getGameDetail(
      { kind: "public", token: "public-token" }, "proposal-1",
    );

    expect(result.imageUrl).toBeNull();
  });
});
