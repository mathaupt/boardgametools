import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/db", () => ({
  default: {
    group: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock crypto
vi.mock("@/lib/crypto", () => ({
  decryptId: vi.fn(),
}));

import prisma from "@/lib/db";
import { decryptId } from "@/lib/crypto";
import { findPublicGroupByToken, resolveGroupIdFromToken } from "@/lib/group-share";

describe("group-share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findPublicGroupByToken", () => {
    it("returns null when token decryption fails", async () => {
      vi.mocked(decryptId).mockImplementation(() => { throw new Error("bad token"); });
      const result = await findPublicGroupByToken("invalid-token");
      expect(result).toBeNull();
      expect(prisma.group.findFirst).not.toHaveBeenCalled();
    });

    it("queries group with decrypted id, token, and isPublic", async () => {
      vi.mocked(decryptId).mockReturnValue("group-123");
      vi.mocked(prisma.group.findFirst).mockResolvedValue({
        id: "group-123",
        name: "Spielegruppe",
        isPublic: true,
        shareToken: "valid-token",
      } as never);

      const result = await findPublicGroupByToken("valid-token");
      expect(decryptId).toHaveBeenCalledWith("valid-token");
      expect(prisma.group.findFirst).toHaveBeenCalledWith({
        where: { id: "group-123", shareToken: "valid-token", isPublic: true },
        include: undefined,
      });
      expect(result).toEqual(expect.objectContaining({ id: "group-123", name: "Spielegruppe" }));
    });

    it("returns null when group is not found", async () => {
      vi.mocked(decryptId).mockReturnValue("group-999");
      vi.mocked(prisma.group.findFirst).mockResolvedValue(null);

      const result = await findPublicGroupByToken("some-token");
      expect(result).toBeNull();
    });

    it("passes include options to prisma", async () => {
      vi.mocked(decryptId).mockReturnValue("group-123");
      vi.mocked(prisma.group.findFirst).mockResolvedValue({ id: "group-123" } as never);

      const include = { members: true } as const;
      await findPublicGroupByToken("token", include);
      expect(prisma.group.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ include: { members: true } })
      );
    });
  });

  describe("resolveGroupIdFromToken", () => {
    it("returns null when token decryption fails", async () => {
      vi.mocked(decryptId).mockImplementation(() => { throw new Error("bad"); });
      const result = await resolveGroupIdFromToken("bad-token");
      expect(result).toBeNull();
    });

    it("returns group id when found", async () => {
      vi.mocked(decryptId).mockReturnValue("group-456");
      vi.mocked(prisma.group.findFirst).mockResolvedValue({ id: "group-456" } as never);

      const result = await resolveGroupIdFromToken("token");
      expect(result).toBe("group-456");
    });

    it("returns null when group not found", async () => {
      vi.mocked(decryptId).mockReturnValue("group-789");
      vi.mocked(prisma.group.findFirst).mockResolvedValue(null);

      const result = await resolveGroupIdFromToken("token");
      expect(result).toBeNull();
    });

    it("queries with select id only", async () => {
      vi.mocked(decryptId).mockReturnValue("group-123");
      vi.mocked(prisma.group.findFirst).mockResolvedValue({ id: "group-123" } as never);

      await resolveGroupIdFromToken("token");
      expect(prisma.group.findFirst).toHaveBeenCalledWith({
        where: { id: "group-123", shareToken: "token", isPublic: true },
        select: { id: true },
      });
    });
  });
});
