import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    gameSession: {
      findMany: vi.fn(),
    },
    apiLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/services/game.service", () => ({
  GameService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { GET as listGames, POST as createGame } from "@/app/api/mobile/v1/games/route";
import { GET as getGame, PUT as updateGame, DELETE as deleteGame } from "@/app/api/mobile/v1/games/[id]/route";
import { GET as listGameSessions } from "@/app/api/mobile/v1/games/[id]/sessions/route";
import { apiAuth } from "@/lib/api-auth";
import { GameService } from "@/lib/services/game.service";
import prisma from "@/lib/db";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedList = vi.mocked(GameService.list);
const mockedGetById = vi.mocked(GameService.getById);
const mockedCreate = vi.mocked(GameService.create);
const mockedUpdate = vi.mocked(GameService.update);
const mockedDelete = vi.mocked(GameService.delete);
const mockedFindMany = vi.mocked(prisma.gameSession.findMany);

function authUser() {
  return { user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } };
}

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
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  deletedAt: null,
  tags: [{ tag: { name: "Strategie" } }],
};

describe("Mobile Game Routes", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("GET /api/mobile/v1/games", () => {
    it("returns a list of games", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedList.mockResolvedValue([sampleGame] as never);

      const res = await listGames(new NextRequest("http://localhost:3000/api/mobile/v1/games"), {});
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("Azul");
      expect(body[0].tagNames).toEqual(["Strategie"]);
    });
  });

  describe("POST /api/mobile/v1/games", () => {
    it("creates a game", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedCreate.mockResolvedValue(sampleGame as never);

      const res = await createGame(
        new NextRequest("http://localhost:3000/api/mobile/v1/games", {
          method: "POST",
          body: JSON.stringify({ name: "Azul", minPlayers: 2, maxPlayers: 4 }),
        }),
        {}
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.name).toBe("Azul");
    });
  });

  describe("GET /api/mobile/v1/games/[id]", () => {
    it("returns a single game", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGetById.mockResolvedValue(sampleGame as never);

      const res = await getGame(new NextRequest("http://localhost:3000/api/mobile/v1/games/g1"), { params: Promise.resolve({ id: "g1" }) });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe("g1");
    });
  });

  describe("PUT /api/mobile/v1/games/[id]", () => {
    it("updates a game", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedUpdate.mockResolvedValue({ ...sampleGame, name: "Azul 2" } as never);

      const res = await updateGame(
        new NextRequest("http://localhost:3000/api/mobile/v1/games/g1", {
          method: "PUT",
          body: JSON.stringify({ name: "Azul 2" }),
        }),
        { params: Promise.resolve({ id: "g1" }) }
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.name).toBe("Azul 2");
    });
  });

  describe("DELETE /api/mobile/v1/games/[id]", () => {
    it("deletes a game", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedDelete.mockResolvedValue({} as never);

      const res = await deleteGame(new NextRequest("http://localhost:3000/api/mobile/v1/games/g1", { method: "DELETE" }), { params: Promise.resolve({ id: "g1" }) });

      expect(res.status).toBe(200);
      expect((await res.json()).message).toBe("Spiel gelöscht");
    });
  });

  describe("GET /api/mobile/v1/games/[id]/sessions", () => {
    it("returns sessions for a game", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedFindMany.mockResolvedValue([
        {
          id: "s1",
          gameId: "g1",
          playedAt: new Date("2024-01-01"),
          durationMinutes: 60,
          notes: null,
          createdAt: new Date("2024-01-01"),
          deletedAt: null,
          players: [{ id: "p1", userId: "u1", score: 10, isWinner: true, placement: 1 }],
        },
      ] as never);

      const res = await listGameSessions(new NextRequest("http://localhost:3000/api/mobile/v1/games/g1/sessions"), { params: Promise.resolve({ id: "g1" }) });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].players[0].userId).toBe("u1");
    });
  });
});
