import { describe, it, expect } from "vitest";
import { buildPublicEventInclude, serializePublicEvent } from "@/lib/public-event";

function makeEvent(overrides = {}) {
  return {
    id: "event-1",
    title: "Spieleabend",
    description: "Ein toller Abend",
    eventDate: new Date("2026-04-01T18:00:00Z"),
    location: "Berlin",
    status: "voting",
    shareToken: "abc123",
    isPublic: true,
    selectedDate: null,
    createdBy: { id: "user-1", name: "Max" },
    invites: [
      { id: "inv-1", status: "accepted", email: "max@example.com", user: { name: "Max" } },
      { id: "inv-2", status: "pending", email: "anna@example.com", user: null },
    ],
    selectedGame: null,
    proposals: [
      {
        id: "prop-1",
        bggId: null,
        bggName: null,
        bggImageUrl: null,
        bggMinPlayers: null,
        bggMaxPlayers: null,
        bggPlayTimeMinutes: null,
        game: { id: "game-1", name: "Catan", imageUrl: "/catan.jpg", minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60 },
        proposedBy: { id: "user-1", name: "Max" },
        guest: null,
        votes: [{ id: "vote-1" }],
        _count: { votes: 3, guestVotes: 2 },
      },
    ],
    guestParticipants: [
      { id: "guest-1", nickname: "Gast1", createdAt: new Date("2026-03-20T10:00:00Z"), _count: { votes: 1 } },
    ],
    dateProposals: [
      {
        id: "dp-1",
        date: new Date("2026-04-01"),
        votes: [{ id: "dv-1", availability: "yes", user: { id: "user-1", name: "Max", email: "max@example.com" } }],
        guestVotes: [{ id: "gdv-1", availability: "maybe", guest: { id: "guest-1", nickname: "Gast1" } }],
      },
    ],
    ...overrides,
  };
}

describe("buildPublicEventInclude", () => {
  it("returns an include object without userId", () => {
    const include = buildPublicEventInclude();
    expect(include).toHaveProperty("createdBy");
    expect(include).toHaveProperty("invites");
    expect(include).toHaveProperty("proposals");
    expect(include).toHaveProperty("guestParticipants");
    expect(include).toHaveProperty("dateProposals");
  });

  it("includes userId-scoped votes when userId is provided", () => {
    const include = buildPublicEventInclude("user-1");
    const proposals = include.proposals as Record<string, unknown>;
    const proposalsInclude = proposals.include as Record<string, unknown>;
    const votes = proposalsInclude.votes as Record<string, unknown>;
    expect(votes).toHaveProperty("where");
  });

  it("does not include userId-scoped votes when no userId", () => {
    const include = buildPublicEventInclude();
    const proposals = include.proposals as Record<string, unknown>;
    const proposalsInclude = proposals.include as Record<string, unknown>;
    expect(proposalsInclude.votes).toBeUndefined();
  });
});

describe("serializePublicEvent", () => {
  it("serializes event dates to ISO strings", () => {
    const result = serializePublicEvent(makeEvent(), null);
    expect(result.eventDate).toBe("2026-04-01T18:00:00.000Z");
  });

  it("masks email for invite without linked user", () => {
    const result = serializePublicEvent(makeEvent(), null);
    const pendingInvite = result.invites.find((i) => i.status === "pending");
    expect(pendingInvite?.name).toBe("an***@example.com");
  });

  it("uses user name for invite with linked user", () => {
    const result = serializePublicEvent(makeEvent(), null);
    const acceptedInvite = result.invites.find((i) => i.status === "accepted");
    expect(acceptedInvite?.name).toBe("Max");
  });

  it("prefers DB game data over BGG inline fields", () => {
    const result = serializePublicEvent(makeEvent(), null);
    expect(result.proposals[0].game.name).toBe("Catan");
    expect(result.proposals[0].game.id).toBe("game-1");
  });

  it("falls back to BGG inline fields when no DB game", () => {
    const event = makeEvent({
      proposals: [{
        id: "prop-bgg",
        bggId: "123",
        bggName: "BGG-Spiel",
        bggImageUrl: "/bgg.jpg",
        bggMinPlayers: 2,
        bggMaxPlayers: 6,
        bggPlayTimeMinutes: 90,
        game: null,
        proposedBy: null,
        guest: { id: "guest-1", nickname: "Gast1" },
        votes: [],
        _count: { votes: 0, guestVotes: 1 },
      }],
    });
    const result = serializePublicEvent(event, null);
    expect(result.proposals[0].game.name).toBe("BGG-Spiel");
    expect(result.proposals[0].game.id).toBe("bgg-123");
    expect(result.proposals[0].game.imageUrl).toBe("/bgg.jpg");
  });

  it("computes totalVotes as registered + guest votes", () => {
    const result = serializePublicEvent(makeEvent(), null);
    expect(result.proposals[0].totalVotes).toBe(5);
    expect(result.proposals[0].voteCounts.registered).toBe(3);
    expect(result.proposals[0].voteCounts.guests).toBe(2);
  });

  it("sets userHasVoted=true when currentUserId has voted", () => {
    const result = serializePublicEvent(makeEvent(), "user-1");
    expect(result.proposals[0].userHasVoted).toBe(true);
  });

  it("sets userHasVoted=false when currentUserId is null", () => {
    const result = serializePublicEvent(makeEvent(), null);
    expect(result.proposals[0].userHasVoted).toBe(false);
  });

  it("sets userHasVoted=false when no votes for user", () => {
    const event = makeEvent();
    event.proposals[0].votes = [];
    const result = serializePublicEvent(event, "user-1");
    expect(result.proposals[0].userHasVoted).toBe(false);
  });

  it("serializes guest participants with vote count", () => {
    const result = serializePublicEvent(makeEvent(), null);
    expect(result.guestParticipants).toHaveLength(1);
    expect(result.guestParticipants[0].nickname).toBe("Gast1");
    expect(result.guestParticipants[0].votesCount).toBe(1);
    expect(result.guestParticipants[0].createdAt).toBe("2026-03-20T10:00:00.000Z");
  });

  it("serializes date proposals with votes", () => {
    const result = serializePublicEvent(makeEvent(), null);
    expect(result.dateProposals).toHaveLength(1);
    expect(result.dateProposals[0].votes).toHaveLength(1);
    expect(result.dateProposals[0].guestVotes).toHaveLength(1);
  });

  it("sets selectedDate to null when not set", () => {
    const result = serializePublicEvent(makeEvent(), null);
    expect(result.selectedDate).toBeNull();
  });

  it("serializes selectedDate when set", () => {
    const event = makeEvent({ selectedDate: new Date("2026-04-01") });
    const result = serializePublicEvent(event, null);
    expect(result.selectedDate).toBe("2026-04-01T00:00:00.000Z");
  });

  it("passes currentUserId through", () => {
    const result = serializePublicEvent(makeEvent(), "user-42");
    expect(result.currentUserId).toBe("user-42");
  });

  it("uses guest as proposedBy when no registered user", () => {
    const event = makeEvent({
      proposals: [{
        id: "prop-guest",
        bggId: null, bggName: null, bggImageUrl: null,
        bggMinPlayers: null, bggMaxPlayers: null, bggPlayTimeMinutes: null,
        game: { id: "g1", name: "Spiel", imageUrl: null, minPlayers: 2, maxPlayers: 4, playTimeMinutes: 30 },
        proposedBy: null,
        guest: { id: "guest-1", nickname: "Gast1" },
        votes: [],
        _count: { votes: 0, guestVotes: 0 },
      }],
    });
    const result = serializePublicEvent(event, null);
    expect(result.proposals[0].proposedBy?.name).toBe("Gast1");
  });

  it("handles event with empty proposals array", () => {
    const event = makeEvent({ proposals: [] });
    const result = serializePublicEvent(event, null);
    expect(result.proposals).toEqual([]);
  });
});
