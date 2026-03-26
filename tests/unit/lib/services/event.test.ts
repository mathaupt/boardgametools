import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Auth/Next mocks (prevent ESM import chain from require-auth) ─
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));

// ── Mocks ────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  default: {
    event: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_fn: () => Promise<unknown>, _keys: string[], _opts?: unknown) => _fn()),
  invalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-tags", () => ({
  CacheTags: {
    userEvents: (id: string) => `events-${id}`,
    userDashboard: (id: string) => `dash-${id}`,
  },
}));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
  firstError: vi.fn((...args: unknown[]) => args.find(Boolean) || null),
}));

vi.mock("@/lib/mailer", () => ({ sendEventInviteEmail: vi.fn() }));
vi.mock("@/lib/public-link", () => ({ getPublicBaseUrl: vi.fn().mockResolvedValue("http://localhost:3000") }));
vi.mock("@/lib/crypto", () => ({ encryptId: vi.fn((id: string) => `encrypted-${id}`) }));

// ── Imports (after mocks) ────────────────────────────────────────

import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { firstError } from "@/lib/validation";
import { EventService } from "@/lib/services/event.service";
import { ApiError } from "@/lib/require-auth";

// ── Helpers ──────────────────────────────────────────────────────

const USER_ID = "user-1";
const EVENT_ID = "event-1";

const fakeEvent = {
  id: EVENT_ID,
  title: "Spieleabend",
  createdById: USER_ID,
  eventDate: new Date("2026-04-01"),
  invites: [{ userId: USER_ID, status: "accepted" }],
  proposals: [],
  selectedGame: null,
  _count: { proposals: 0, invites: 1 },
};

// ── Tests ────────────────────────────────────────────────────────

describe("EventService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── list ─────────────────────────────────────────────────────

  describe("list", () => {
    it("returns all events (non-paginated)", async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([fakeEvent] as never);

      const result = await EventService.list(USER_ID);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdById: USER_ID, deletedAt: null },
          orderBy: { eventDate: "desc" },
        })
      );
      expect(result).toEqual([fakeEvent]);
    });

    it("returns paginated result when page/limit provided", async () => {
      const events = [fakeEvent];
      vi.mocked(prisma.event.findMany).mockResolvedValue(events as never);
      vi.mocked(prisma.event.count).mockResolvedValue(1);

      const result = await EventService.list(USER_ID, { page: 1, limit: 10 });

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
      expect(prisma.event.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: events,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  // ── getById ──────────────────────────────────────────────────

  describe("getById", () => {
    it("returns event when user is creator", async () => {
      vi.mocked(prisma.event.findFirst).mockResolvedValue(fakeEvent as never);

      const result = await EventService.getById(USER_ID, EVENT_ID);

      expect(prisma.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EVENT_ID, deletedAt: null },
        })
      );
      expect(result).toEqual(fakeEvent);
    });

    it("returns event when user is invited (not creator)", async () => {
      const otherUserId = "user-2";
      const eventWithInvitedUser = {
        ...fakeEvent,
        createdById: "someone-else",
        invites: [
          { userId: "someone-else", status: "accepted" },
          { userId: otherUserId, status: "accepted" },
        ],
      };
      vi.mocked(prisma.event.findFirst).mockResolvedValue(eventWithInvitedUser as never);

      const result = await EventService.getById(otherUserId, EVENT_ID);

      expect(result).toEqual(eventWithInvitedUser);
    });

    it("throws ApiError(404) when event not found", async () => {
      vi.mocked(prisma.event.findFirst).mockResolvedValue(null as never);

      await expect(EventService.getById(USER_ID, "nope")).rejects.toThrow(ApiError);
      await expect(EventService.getById(USER_ID, "nope")).rejects.toThrow("Event not found");
    });

    it("throws ApiError(403) when user is not creator and not invited", async () => {
      const foreignEvent = {
        ...fakeEvent,
        createdById: "someone-else",
        invites: [{ userId: "someone-else", status: "accepted" }],
      };
      vi.mocked(prisma.event.findFirst).mockResolvedValue(foreignEvent as never);

      await expect(EventService.getById(USER_ID, EVENT_ID)).rejects.toThrow(ApiError);
      await expect(EventService.getById(USER_ID, EVENT_ID)).rejects.toThrow("Forbidden");
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe("create", () => {
    it("creates event with invites and invalidates caches", async () => {
      const createdEvent = {
        ...fakeEvent,
        invites: [
          { id: "inv-1", userId: USER_ID, email: null, status: "accepted", user: { id: USER_ID, name: "Owner", email: "owner@test.de" } },
        ],
      };
      vi.mocked(prisma.event.create).mockResolvedValue(createdEvent as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: USER_ID, name: "Owner", email: "owner@test.de" } as never);

      const result = await EventService.create(USER_ID, {
        title: "Spieleabend",
        eventDate: "2026-04-01",
      });

      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Spieleabend",
            createdById: USER_ID,
          }),
        })
      );
      expect(invalidateTag).toHaveBeenCalledWith(`events-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledWith(`dash-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledTimes(2);
      expect(result).toEqual(createdEvent);
    });

    it("throws ApiError(400) when required fields are missing", async () => {
      await expect(
        EventService.create(USER_ID, { title: "", eventDate: "" })
      ).rejects.toThrow(ApiError);

      await expect(
        EventService.create(USER_ID, { title: "", eventDate: "" })
      ).rejects.toThrow("Missing required fields: title, eventDate");

      expect(prisma.event.create).not.toHaveBeenCalled();
    });

    it("throws ApiError(400) on validation error", async () => {
      vi.mocked(firstError).mockReturnValueOnce("Titel darf maximal 200 Zeichen lang sein" as never);

      await expect(
        EventService.create(USER_ID, { title: "A".repeat(300), eventDate: "2026-04-01" })
      ).rejects.toThrow(ApiError);

      vi.mocked(firstError).mockReturnValueOnce("Titel darf maximal 200 Zeichen lang sein" as never);

      await expect(
        EventService.create(USER_ID, { title: "A".repeat(300), eventDate: "2026-04-01" })
      ).rejects.toThrow("Titel darf maximal 200 Zeichen lang sein");

      expect(prisma.event.create).not.toHaveBeenCalled();
    });
  });

  // ── close ────────────────────────────────────────────────────

  describe("close", () => {
    it("closes event and invalidates caches", async () => {
      const closedEvent = { ...fakeEvent, status: "closed" };
      vi.mocked(prisma.event.findFirst).mockResolvedValue(fakeEvent as never);
      vi.mocked(prisma.event.update).mockResolvedValue(closedEvent as never);

      const result = await EventService.close(USER_ID, EVENT_ID);

      expect(prisma.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EVENT_ID, createdById: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: EVENT_ID },
        data: { status: "closed" },
      });
      expect(invalidateTag).toHaveBeenCalledWith(`events-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledWith(`dash-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledTimes(2);
      expect(result).toEqual(closedEvent);
    });

    it("throws ApiError(404) when event not found or not owned", async () => {
      vi.mocked(prisma.event.findFirst).mockResolvedValue(null as never);

      await expect(EventService.close(USER_ID, "nope")).rejects.toThrow(ApiError);
      await expect(EventService.close(USER_ID, "nope")).rejects.toThrow("Event not found");
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe("update", () => {
    it("updates event and invalidates caches", async () => {
      const updatedEvent = { ...fakeEvent, title: "Neuer Spieleabend" };
      vi.mocked(prisma.event.findFirst).mockResolvedValue(fakeEvent as never);
      vi.mocked(prisma.event.update).mockResolvedValue(updatedEvent as never);

      const result = await EventService.update(USER_ID, EVENT_ID, {
        title: "Neuer Spieleabend",
      });

      expect(prisma.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EVENT_ID, createdById: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EVENT_ID },
          data: expect.objectContaining({ title: "Neuer Spieleabend" }),
        })
      );
      expect(invalidateTag).toHaveBeenCalledWith(`events-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledWith(`dash-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledTimes(2);
      expect(result).toEqual(updatedEvent);
    });

    it("throws ApiError(404) when event not found or not owned", async () => {
      vi.mocked(prisma.event.findFirst).mockResolvedValue(null as never);

      await expect(
        EventService.update(USER_ID, "nope", { title: "X" })
      ).rejects.toThrow(ApiError);

      await expect(
        EventService.update(USER_ID, "nope", { title: "X" })
      ).rejects.toThrow("Event not found");
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe("delete", () => {
    it("soft-deletes event and invalidates caches", async () => {
      vi.mocked(prisma.event.findFirst).mockResolvedValue(fakeEvent as never);
      vi.mocked(prisma.event.update).mockResolvedValue({} as never);

      const result = await EventService.delete(USER_ID, EVENT_ID);

      expect(prisma.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EVENT_ID, createdById: USER_ID, deletedAt: null },
        })
      );
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: EVENT_ID },
        data: { deletedAt: expect.any(Date) },
      });
      expect(invalidateTag).toHaveBeenCalledWith(`events-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledWith(`dash-${USER_ID}`);
      expect(invalidateTag).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: "Event deleted" });
    });

    it("throws ApiError(404) when event not found or not owned", async () => {
      vi.mocked(prisma.event.findFirst).mockResolvedValue(null as never);

      await expect(EventService.delete(USER_ID, "nope")).rejects.toThrow(ApiError);
      await expect(EventService.delete(USER_ID, "nope")).rejects.toThrow("Event not found");
    });
  });
});
