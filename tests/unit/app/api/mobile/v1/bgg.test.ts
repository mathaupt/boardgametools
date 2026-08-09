import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { File } from "node:buffer";

vi.mock("@/lib/db", () => ({
  default: {
    upload: { create: vi.fn() },
    pushDevice: { upsert: vi.fn() },
    apiLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/bgg", () => ({
  searchBGGGames: vi.fn(),
  fetchBGGGame: vi.fn(),
}));
vi.mock("@/lib/services/game.service", () => ({
  GameService: { create: vi.fn() },
}));
vi.mock("@/lib/storage", () => ({
  storage: { upload: vi.fn() },
  generateFileName: vi.fn((name: string) => `prefixed-${name}`),
}));

import { GET as searchBgg } from "@/app/api/mobile/v1/bgg/search/route";
import { POST as lookupBgg } from "@/app/api/mobile/v1/bgg/lookup/route";
import { POST as importBgg } from "@/app/api/mobile/v1/bgg/import/route";
import { POST as uploadImage } from "@/app/api/mobile/v1/uploads/route";
import { POST as registerDevice } from "@/app/api/mobile/v1/devices/route";
import { apiAuth } from "@/lib/api-auth";
import { searchBGGGames, fetchBGGGame } from "@/lib/bgg";
import { GameService } from "@/lib/services/game.service";
import prisma from "@/lib/db";
import { storage } from "@/lib/storage";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedSearch = vi.mocked(searchBGGGames);
const mockedFetch = vi.mocked(fetchBGGGame);
const mockedCreate = vi.mocked(GameService.create);
const mockedUpload = vi.mocked(storage.upload);
const mockedUploadCreate = vi.mocked(prisma.upload.create);
const mockedUpsert = vi.mocked(prisma.pushDevice.upsert);

function authUser() {
  return { user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } };
}

describe("Mobile BGG & Upload Routes", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("searches BGG", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedSearch.mockResolvedValue([{ bggId: "13", name: "Catan", yearPublished: 1995 }] as never);

    const res = await searchBgg(new NextRequest("http://localhost:3000/api/mobile/v1/bgg/search?q=Catan"), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body[0].name).toBe("Catan");
  });

  it("looks up by EAN", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedSearch.mockResolvedValue([{ bggId: "13", name: "Catan", yearPublished: 1995 }] as never);

    const res = await lookupBgg(
      new NextRequest("http://localhost:3000/api/mobile/v1/bgg/lookup", {
        method: "POST",
        body: JSON.stringify({ ean: "4001504405010" }),
      }),
      {}
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bggId).toBe("13");
  });

  it("imports a BGG game", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedFetch.mockResolvedValue({
      bggId: "13",
      name: "Catan",
      description: "Desc",
      minPlayers: 3,
      maxPlayers: 4,
      playTimeMinutes: 90,
      complexity: 2.3,
      imageUrl: "http://img",
      categories: ["Strategy"],
    } as never);
    mockedCreate.mockResolvedValue({
      id: "g1",
      name: "Catan",
      description: "Desc",
      minPlayers: 3,
      maxPlayers: 4,
      playTimeMinutes: 90,
      complexity: 2,
      bggId: "13",
      ean: null,
      imageUrl: "http://img",
      ownerId: "u1",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      deletedAt: null,
      tags: [],
    } as never);

    const res = await importBgg(
      new NextRequest("http://localhost:3000/api/mobile/v1/bgg/import", {
        method: "POST",
        body: JSON.stringify({ bggId: "13" }),
      }),
      {}
    );

    expect(res.status).toBe(201);
  });
});

describe("Mobile Upload & Device Routes", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("uploads an image", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedUpload.mockResolvedValue({ publicUrl: "http://example.com/img.png", storagePath: "/img.png" } as never);
    mockedUploadCreate.mockResolvedValue({ id: "upload-1" } as never);

    const fileBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const file = new File([fileBytes], "test.png", { type: "image/png" });
    const formData = { get: vi.fn().mockReturnValue(file) } as unknown as FormData;

    const request = new NextRequest("http://localhost:3000/api/mobile/v1/uploads", {
      method: "POST",
    });
    (request as unknown as { formData: () => Promise<FormData> }).formData = vi.fn().mockResolvedValue(formData);

    const res = await uploadImage(request, {});
    expect(res.status).toBe(201);
  });

  it("registers a push device", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedUpsert.mockResolvedValue({} as never);

    const res = await registerDevice(
      new NextRequest("http://localhost:3000/api/mobile/v1/devices", {
        method: "POST",
        body: JSON.stringify({ token: "device-token-123", platform: "ios" }),
      }),
      {}
    );

    expect(res.status).toBe(200);
  });
});
