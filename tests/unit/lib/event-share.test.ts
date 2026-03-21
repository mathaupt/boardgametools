import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/db", () => ({
  default: {
    event: {
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
import { findPublicEventByToken, resolveEventIdFromToken } from "@/lib/event-share";

describe("event-share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findPublicEventByToken", () => {
    it("returns null when token decryption fails", async () => {
      vi.mocked(decryptId).mockImplementation(() => { throw new Error("bad token"); });
      const result = await findPublicEventByToken("invalid-token");
      expect(result).toBeNull();
      expect(prisma.event.findFirst).not.toHaveBeenCalled();
    });

    it("queries event with decrypted id, token, and isPublic", async () => {
      vi.mocked(decryptId).mockReturnValue("event-123");
      vi.mocked(prisma.event.findFirst).mockResolvedValue({
        id: "event-123",
        title: "Spieleabend",
        isPublic: true,
        shareToken: "valid-token",
      } as never);

      const result = await findPublicEventByToken("valid-token");
      expect(decryptId).toHaveBeenCalledWith("valid-token");
      expect(prisma.event.findFirst).toHaveBeenCalledWith({
        where: { id: "event-123", shareToken: "valid-token", isPublic: true },
        include: undefined,
      });
      expect(result).toEqual(expect.objectContaining({ id: "event-123", title: "Spieleabend" }));
    });

    it("returns null when event is not found", async () => {
      vi.mocked(decryptId).mockReturnValue("event-999");
      vi.mocked(prisma.event.findFirst).mockResolvedValue(null);

      const result = await findPublicEventByToken("some-token");
      expect(result).toBeNull();
    });

    it("passes include options to prisma", async () => {
      vi.mocked(decryptId).mockReturnValue("event-123");
      vi.mocked(prisma.event.findFirst).mockResolvedValue({ id: "event-123" } as never);

      const include = { proposals: true } as const;
      await findPublicEventByToken("token", include);
      expect(prisma.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ include: { proposals: true } })
      );
    });
  });

  describe("resolveEventIdFromToken", () => {
    it("returns null when token decryption fails", async () => {
      vi.mocked(decryptId).mockImplementation(() => { throw new Error("bad"); });
      const result = await resolveEventIdFromToken("bad-token");
      expect(result).toBeNull();
    });

    it("returns event id when found", async () => {
      vi.mocked(decryptId).mockReturnValue("event-456");
      vi.mocked(prisma.event.findFirst).mockResolvedValue({ id: "event-456" } as never);

      const result = await resolveEventIdFromToken("token");
      expect(result).toBe("event-456");
    });

    it("returns null when event not found", async () => {
      vi.mocked(decryptId).mockReturnValue("event-789");
      vi.mocked(prisma.event.findFirst).mockResolvedValue(null);

      const result = await resolveEventIdFromToken("token");
      expect(result).toBeNull();
    });

    it("queries with select id only", async () => {
      vi.mocked(decryptId).mockReturnValue("event-123");
      vi.mocked(prisma.event.findFirst).mockResolvedValue({ id: "event-123" } as never);

      await resolveEventIdFromToken("token");
      expect(prisma.event.findFirst).toHaveBeenCalledWith({
        where: { id: "event-123", shareToken: "token", isPublic: true },
        select: { id: true },
      });
    });
  });
});
