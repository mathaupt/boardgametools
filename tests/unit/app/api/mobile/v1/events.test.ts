import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    $transaction: vi.fn(),
    apiLog: { create: vi.fn() },
    event: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    gameProposal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    vote: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    dateProposal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    dateVote: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    game: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/services/event.service", () => ({
  EventService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    close: vi.fn(),
  },
}));

import { GET as listEvents, POST as createEvent } from "@/app/api/mobile/v1/events/route";
import { GET as getEvent, PUT as updateEvent, DELETE as deleteEvent } from "@/app/api/mobile/v1/events/[id]/route";
import { POST as closeEvent } from "@/app/api/mobile/v1/events/[id]/close/route";
import { GET as listProposals, POST as createProposal, DELETE as deleteProposal } from "@/app/api/mobile/v1/events/[id]/proposals/route";
import { POST as voteProposal, DELETE as removeVote } from "@/app/api/mobile/v1/events/[id]/votes/route";
import { GET as listDateProposals, POST as createDateProposals } from "@/app/api/mobile/v1/events/[id]/date-proposals/route";
import { POST as voteDateProposals } from "@/app/api/mobile/v1/events/[id]/date-proposals/vote/route";

import { apiAuth } from "@/lib/api-auth";
import { EventService } from "@/lib/services/event.service";
import { ApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedEventCreate = vi.mocked(EventService.create);
const mockedEventUpdate = vi.mocked(EventService.update);
const mockedEventDelete = vi.mocked(EventService.delete);
const mockedEventClose = vi.mocked(EventService.close);

const mockedEventFindMany = vi.mocked(prisma.event.findMany);
const mockedEventFindFirst = vi.mocked(prisma.event.findFirst);
const mockedGameProposalFindMany = vi.mocked(prisma.gameProposal.findMany);
const mockedGameProposalFindFirst = vi.mocked(prisma.gameProposal.findFirst);
const mockedGameProposalCreate = vi.mocked(prisma.gameProposal.create);
const mockedGameProposalDelete = vi.mocked(prisma.gameProposal.delete);
const mockedGameFindFirst = vi.mocked(prisma.game.findFirst);
const mockedVoteFindUnique = vi.mocked(prisma.vote.findUnique);
const mockedVoteCreate = vi.mocked(prisma.vote.create);
const mockedVoteDeleteMany = vi.mocked(prisma.vote.deleteMany);
const mockedDateProposalFindMany = vi.mocked(prisma.dateProposal.findMany);
const mockedDateProposalFindFirst = vi.mocked(prisma.dateProposal.findFirst);
const mockedDateProposalUpsert = vi.mocked(prisma.dateProposal.upsert);
const mockedDateVoteUpsert = vi.mocked(prisma.dateVote.upsert);
const mockedTransaction = vi.mocked(prisma.$transaction);

function authUser() {
  return { user: { id: "u1", email: "u1@test.de", name: "Max", role: "USER" } };
}

function routeContext(id = "e1") {
  return { params: Promise.resolve({ id }) };
}

const baseEventFields = {
  title: "Spieleabend",
  description: null,
  eventDate: new Date("2026-04-01T00:00:00.000Z"),
  location: null,
  status: "voting",
  groupId: null,
  selectedGameId: null,
  winningProposalId: null,
  isPublic: false,
  shareToken: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
};

const sampleGame = {
  id: "g1",
  name: "Azul",
  description: null,
  minPlayers: 2,
  maxPlayers: 4,
  playTimeMinutes: 45,
  complexity: 2,
  bggId: null,
  ean: null,
  imageUrl: null,
  ownerId: "u1",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
  tags: [],
};

const sampleProposal = {
  id: "gp1",
  eventId: "e1",
  gameId: "g1",
  proposedById: "u1",
  bggId: null,
  bggName: null,
  bggImageUrl: null,
  bggMinPlayers: null,
  bggMaxPlayers: null,
  bggPlayTimeMinutes: null,
  votes: [],
  guestVotes: [],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  game: sampleGame,
  proposedBy: { id: "u1", name: "Max", email: "u1@test.de" },
  guest: null,
};

const sampleDateProposal = {
  id: "dp1",
  eventId: "e1",
  date: new Date("2026-04-10T00:00:00.000Z"),
  votes: [],
  guestVotes: [],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const sampleVote = {
  id: "v1",
  proposalId: "gp1",
  userId: "u1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const sampleDateVote = {
  id: "dv1",
  dateProposalId: "dp1",
  userId: "u1",
  availability: "yes" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("Mobile Event Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/mobile/v1/events", () => {
    it("lists events for the authenticated user", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindMany.mockResolvedValue([{ id: "e1", ...baseEventFields, createdById: "u1" }] as never);

      const res = await listEvents(new NextRequest("http://localhost:3000/api/mobile/v1/events"), {});
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("e1");
      expect(body[0].title).toBe("Spieleabend");
      expect(mockedEventFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            OR: expect.any(Array),
          }),
          orderBy: { eventDate: "desc" },
        })
      );
    });

    it("returns 401 when not authenticated", async () => {
      mockedApiAuth.mockResolvedValue(null as never);

      const res = await listEvents(new NextRequest("http://localhost:3000/api/mobile/v1/events"), {});

      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Nicht autorisiert");
    });
  });

  describe("POST /api/mobile/v1/events", () => {
    it("creates an event and returns an EventDTO", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventCreate.mockResolvedValue({ id: "e1", ...baseEventFields, createdById: "u1" } as never);

      const res = await createEvent(
        new NextRequest("http://localhost:3000/api/mobile/v1/events", {
          method: "POST",
          body: JSON.stringify({ title: "Spieleabend", eventDate: "2026-04-01" }),
        }),
        {}
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.id).toBe("e1");
      expect(mockedEventCreate).toHaveBeenCalledWith("u1", { title: "Spieleabend", eventDate: "2026-04-01" });
    });

    it("returns 401 when not authenticated", async () => {
      mockedApiAuth.mockResolvedValue(null as never);

      const res = await createEvent(
        new NextRequest("http://localhost:3000/api/mobile/v1/events", {
          method: "POST",
          body: JSON.stringify({ title: "X", eventDate: "2026-04-01" }),
        }),
        {}
      );

      expect(res.status).toBe(401);
    });

    it("returns 400 when EventService throws an ApiError", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventCreate.mockRejectedValue(new ApiError(400, "Fehlende Pflichtfelder") as never);

      const res = await createEvent(
        new NextRequest("http://localhost:3000/api/mobile/v1/events", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        {}
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/mobile/v1/events/[id]", () => {
    it("returns event details for the creator", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        ...baseEventFields,
        createdById: "u1",
        createdBy: { id: "u1", name: "Max", email: "u1@test.de" },
        invites: [{ userId: "u1", user: { id: "u1", name: "Max", email: "u1@test.de" } }],
        proposals: [sampleProposal],
        selectedGame: null,
        dateProposals: [sampleDateProposal],
      } as never);

      const res = await getEvent(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1"), routeContext());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe("e1");
      expect(body.proposals).toHaveLength(1);
      expect(body.proposals[0].voteCount).toBe(0);
      expect(body.proposals[0].game.name).toBe("Azul");
      expect(body.dateProposals).toHaveLength(1);
      expect(body.dateProposals[0].date).toBe("2026-04-10T00:00:00.000Z");
      expect(body.isCreator).toBe(true);
    });

    it("returns event details for an invited user", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        ...baseEventFields,
        createdById: "u2",
        createdBy: { id: "u2", name: "Other", email: "other@test.de" },
        invites: [{ userId: "u1", user: { id: "u1", name: "Max", email: "u1@test.de" } }],
        proposals: [sampleProposal],
        selectedGame: null,
        dateProposals: [sampleDateProposal],
      } as never);

      const res = await getEvent(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1"), routeContext());

      expect(res.status).toBe(200);
    });

    it("returns event details for public events", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        ...baseEventFields,
        isPublic: true,
        createdById: "u2",
        createdBy: { id: "u2", name: "Other", email: "other@test.de" },
        invites: [],
        proposals: [sampleProposal],
        selectedGame: null,
        dateProposals: [sampleDateProposal],
      } as never);

      const res = await getEvent(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1"), routeContext());

      expect(res.status).toBe(200);
    });

    it("returns 403 when user has no access", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        ...baseEventFields,
        createdById: "u2",
        createdBy: { id: "u2", name: "Other", email: "other@test.de" },
        invites: [],
        proposals: [],
        selectedGame: null,
        dateProposals: [],
      } as never);

      const res = await getEvent(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1"), routeContext());

      expect(res.status).toBe(403);
    });

    it("returns 404 when event not found", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue(null as never);

      const res = await getEvent(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1"), routeContext());

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/mobile/v1/events/[id]", () => {
    it("updates an event and returns an EventDTO", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventUpdate.mockResolvedValue({ id: "e1", ...baseEventFields, title: "Updated", createdById: "u1" } as never);

      const res = await updateEvent(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1", {
          method: "PUT",
          body: JSON.stringify({ title: "Updated" }),
        }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.title).toBe("Updated");
    });

    it("returns 404 when EventService throws", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventUpdate.mockRejectedValue(new ApiError(404, "Event not found") as never);

      const res = await updateEvent(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1", {
          method: "PUT",
          body: JSON.stringify({ title: "Updated" }),
        }),
        routeContext()
      );

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/mobile/v1/events/[id]", () => {
    it("deletes an event and returns a German message", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventDelete.mockResolvedValue({ message: "Event deleted" } as never);

      const res = await deleteEvent(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1", { method: "DELETE" }), routeContext());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe("Event gelöscht");
    });

    it("returns 404 when EventService throws", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventDelete.mockRejectedValue(new ApiError(404, "Event not found") as never);

      const res = await deleteEvent(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1", { method: "DELETE" }), routeContext());

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/mobile/v1/events/[id]/close", () => {
    it("closes the event and optionally sets the winning game", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventClose.mockResolvedValue({ id: "e1", ...baseEventFields, status: "closed", selectedGameId: "g1", winningProposalId: "gp1", createdById: "u1" } as never);

      const res = await closeEvent(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/close", {
          method: "POST",
          body: JSON.stringify({ selectedGameId: "g1", winningProposalId: "gp1" }),
        }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe("closed");
      expect(body.selectedGameId).toBe("g1");
      expect(mockedEventClose).toHaveBeenCalledWith("u1", "e1", "g1", "gp1");
    });

    it("returns 404 when EventService throws", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventClose.mockRejectedValue(new ApiError(404, "Event not found") as never);

      const res = await closeEvent(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/close", { method: "POST", body: JSON.stringify({}) }),
        routeContext()
      );

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/mobile/v1/events/[id]/proposals", () => {
    it("lists proposals with vote counts", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [{ userId: "u1" }],
        isPublic: false,
      } as never);
      mockedGameProposalFindMany.mockResolvedValue([sampleProposal] as never);

      const res = await listProposals(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals"), routeContext());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].voteCount).toBe(0);
      expect(body[0].game.name).toBe("Azul");
    });

    it("returns 403 when user has no access", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u2",
        invites: [],
        isPublic: false,
      } as never);

      const res = await listProposals(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals"), routeContext());

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/mobile/v1/events/[id]/proposals", () => {
    it("creates a game proposal", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameFindFirst.mockResolvedValue(sampleGame as never);
      mockedGameProposalFindFirst.mockResolvedValue(null as never);
      mockedGameProposalCreate.mockResolvedValue(sampleProposal as never);

      const res = await createProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals", {
          method: "POST",
          body: JSON.stringify({ gameId: "g1" }),
        }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.game.name).toBe("Azul");
      expect(body.voteCount).toBe(0);
    });

    it("returns 400 when gameId is missing", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);

      const res = await createProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        routeContext()
      );

      expect(res.status).toBe(400);
    });

    it("returns 404 when game not found", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameFindFirst.mockResolvedValue(null as never);

      const res = await createProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals", {
          method: "POST",
          body: JSON.stringify({ gameId: "g1" }),
        }),
        routeContext()
      );

      expect(res.status).toBe(404);
    });

    it("returns 400 when game already proposed", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameFindFirst.mockResolvedValue(sampleGame as never);
      mockedGameProposalFindFirst.mockResolvedValue({ id: "gp-existing" } as never);

      const res = await createProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals", {
          method: "POST",
          body: JSON.stringify({ gameId: "g1" }),
        }),
        routeContext()
      );

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/mobile/v1/events/[id]/proposals", () => {
    it("deletes own proposal", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGameProposalFindFirst.mockResolvedValue({ id: "gp1", eventId: "e1", proposedById: "u1" } as never);
      mockedGameProposalDelete.mockResolvedValue({} as never);

      const res = await deleteProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals?proposalId=gp1", { method: "DELETE" }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe("Vorschlag gelöscht");
    });

    it("returns 400 when proposalId is missing", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);

      const res = await deleteProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals", { method: "DELETE" }),
        routeContext()
      );

      expect(res.status).toBe(400);
    });

    it("returns 404 when proposal not found", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGameProposalFindFirst.mockResolvedValue(null as never);

      const res = await deleteProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/proposals?proposalId=gp1", { method: "DELETE" }),
        routeContext()
      );

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/mobile/v1/events/[id]/votes", () => {
    it("votes for a game proposal", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameProposalFindFirst.mockResolvedValue({ id: "gp1", eventId: "e1" } as never);
      mockedVoteFindUnique.mockResolvedValue(null as never);
      mockedVoteCreate.mockResolvedValue(sampleVote as never);

      const res = await voteProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/votes", {
          method: "POST",
          body: JSON.stringify({ proposalId: "gp1" }),
        }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.proposalId).toBe("gp1");
      expect(body.userId).toBe("u1");
    });

    it("returns 400 when proposalId is missing", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);

      const res = await voteProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/votes", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        routeContext()
      );

      expect(res.status).toBe(400);
    });

    it("returns 404 when proposal not found", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameProposalFindFirst.mockResolvedValue(null as never);

      const res = await voteProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/votes", {
          method: "POST",
          body: JSON.stringify({ proposalId: "gp1" }),
        }),
        routeContext()
      );

      expect(res.status).toBe(404);
    });

    it("returns 400 when user already voted", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameProposalFindFirst.mockResolvedValue({ id: "gp1", eventId: "e1" } as never);
      mockedVoteFindUnique.mockResolvedValue({ id: "v-existing" } as never);

      const res = await voteProposal(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/votes", {
          method: "POST",
          body: JSON.stringify({ proposalId: "gp1" }),
        }),
        routeContext()
      );

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/mobile/v1/events/[id]/votes", () => {
    it("removes own vote", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameProposalFindFirst.mockResolvedValue({ id: "gp1", eventId: "e1" } as never);
      mockedVoteDeleteMany.mockResolvedValue({ count: 1 } as never);

      const res = await removeVote(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/votes?proposalId=gp1", { method: "DELETE" }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe("Stimme entfernt");
    });

    it("returns 404 when vote not found", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedGameProposalFindFirst.mockResolvedValue({ id: "gp1", eventId: "e1" } as never);
      mockedVoteDeleteMany.mockResolvedValue({ count: 0 } as never);

      const res = await removeVote(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/votes?proposalId=gp1", { method: "DELETE" }),
        routeContext()
      );

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/mobile/v1/events/[id]/date-proposals", () => {
    it("lists date proposals with votes", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedDateProposalFindMany.mockResolvedValue([sampleDateProposal] as never);

      const res = await listDateProposals(new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/date-proposals"), routeContext());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].date).toBe("2026-04-10T00:00:00.000Z");
    });
  });

  describe("POST /api/mobile/v1/events/[id]/date-proposals", () => {
    it("creates date proposals from an array of dates", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        selectedDate: null,
      } as never);
      mockedTransaction.mockResolvedValue([sampleDateProposal] as never);
      mockedDateProposalFindMany.mockResolvedValue([sampleDateProposal] as never);

      const res = await createDateProposals(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/date-proposals", {
          method: "POST",
          body: JSON.stringify({ dates: ["2026-04-10"] }),
        }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toHaveLength(1);
      expect(mockedDateProposalUpsert).toHaveBeenCalled();
    });

    it("creates date proposals from a date range", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        selectedDate: null,
      } as never);
      mockedTransaction.mockResolvedValue([] as never);
      mockedDateProposalFindMany.mockResolvedValue([] as never);

      const res = await createDateProposals(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/date-proposals", {
          method: "POST",
          body: JSON.stringify({ startDate: "2026-04-10", endDate: "2026-04-12" }),
        }),
        routeContext()
      );

      expect(res.status).toBe(201);
      expect(mockedTransaction).toHaveBeenCalled();
    });

    it("returns 403 when user is not the creator", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u2",
        selectedDate: null,
      } as never);

      const res = await createDateProposals(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/date-proposals", {
          method: "POST",
          body: JSON.stringify({ dates: ["2026-04-10"] }),
        }),
        routeContext()
      );

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/mobile/v1/events/[id]/date-proposals/vote", () => {
    it("votes on date proposals in bulk", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedDateProposalFindMany.mockResolvedValue([{ id: "dp1", eventId: "e1" }] as never);
      mockedTransaction.mockResolvedValue([sampleDateVote] as never);

      const res = await voteDateProposals(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/date-proposals/vote", {
          method: "POST",
          body: JSON.stringify({ votes: [{ dateProposalId: "dp1", availability: "yes" }] }),
        }),
        routeContext()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].availability).toBe("yes");
    });

    it("returns 400 for invalid availability", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);

      const res = await voteDateProposals(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/date-proposals/vote", {
          method: "POST",
          body: JSON.stringify({ votes: [{ dateProposalId: "dp1", availability: "maybe-yes" }] }),
        }),
        routeContext()
      );

      expect(res.status).toBe(400);
    });

    it("returns 404 when date proposal not found", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedEventFindFirst.mockResolvedValue({
        id: "e1",
        createdById: "u1",
        invites: [],
        isPublic: false,
      } as never);
      mockedDateProposalFindMany.mockResolvedValue([] as never);

      const res = await voteDateProposals(
        new NextRequest("http://localhost:3000/api/mobile/v1/events/e1/date-proposals/vote", {
          method: "POST",
          body: JSON.stringify({ votes: [{ dateProposalId: "dp1", availability: "yes" }] }),
        }),
        routeContext()
      );

      expect(res.status).toBe(404);
    });
  });
});
