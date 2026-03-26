import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));

import { ApiError } from "@/lib/require-auth";

vi.mock("@/lib/db", () => ({
  default: {
    tag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((fn: () => Promise<unknown>) => fn()),
  invalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-tags", () => ({
  CacheTags: { userTags: (id: string) => `user-tags-${id}` },
}));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
}));

import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { validateString } from "@/lib/validation";
import { TagService } from "@/lib/services/tag.service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TagService.list", () => {
  it("returns tags from cache", async () => {
    const tags = [{ id: "t1", name: "Strategy", _count: { games: 3 } }];
    vi.mocked(prisma.tag.findMany).mockResolvedValue(tags as never);

    const result = await TagService.list("u1");

    expect(result).toEqual(tags);
    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      where: { ownerId: "u1" },
      include: { _count: { select: { games: true } } },
      orderBy: { name: "asc" },
    });
  });
});

describe("TagService.create", () => {
  it("creates new tag when not found", async () => {
    const tag = { id: "t1", name: "Euro", ownerId: "u1" };
    vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.tag.create).mockResolvedValue(tag as never);

    const result = await TagService.create("u1", "Euro");

    expect(result).toEqual({ tag, created: true });
    expect(prisma.tag.create).toHaveBeenCalledWith({
      data: { name: "Euro", ownerId: "u1", source: "manual" },
    });
    expect(invalidateTag).toHaveBeenCalledWith("user-tags-u1");
  });

  it("returns existing tag without creating", async () => {
    const existing = { id: "t1", name: "Euro", ownerId: "u1" };
    vi.mocked(prisma.tag.findUnique).mockResolvedValue(existing as never);

    const result = await TagService.create("u1", "Euro");

    expect(result).toEqual({ tag: existing, created: false });
    expect(prisma.tag.create).not.toHaveBeenCalled();
    expect(invalidateTag).not.toHaveBeenCalled();
  });

  it("calls validateString and throws on validation error", async () => {
    vi.mocked(validateString).mockReturnValue("Name ist erforderlich");

    await expect(TagService.create("u1", "")).rejects.toThrow(ApiError);
    await expect(TagService.create("u1", "")).rejects.toThrow("Name ist erforderlich");
    expect(validateString).toHaveBeenCalledWith("", "Name", { max: 50 });
  });
});

describe("TagService.delete", () => {
  it("deletes tag and invalidates cache", async () => {
    const tag = { id: "t1", name: "Euro", ownerId: "u1" };
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(tag as never);
    vi.mocked(prisma.tag.delete).mockResolvedValue(tag as never);

    const result = await TagService.delete("u1", "t1");

    expect(result).toEqual({ message: "Tag deleted" });
    expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
    expect(invalidateTag).toHaveBeenCalledWith("user-tags-u1");
  });

  it("throws ApiError(404) when tag not found", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(null);

    await expect(TagService.delete("u1", "missing")).rejects.toThrow(ApiError);
    await expect(TagService.delete("u1", "missing")).rejects.toThrow("Tag not found");
    expect(prisma.tag.delete).not.toHaveBeenCalled();
  });
});
