import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body, status: init?.status ?? 200, headers: init?.headers ?? {},
    })),
  },
}));

vi.mock("@/lib/api-logger", () => ({ withApiLogging: vi.fn((handler: unknown) => handler) }));
vi.mock("@/lib/logger", () => ({ default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

vi.mock("@/lib/db", () => {
  return { default: {
    guestParticipant: { upsert: vi.fn(), findFirst: vi.fn() },
    gameProposal: { findFirst: vi.fn(), findUnique: vi.fn() },
    guestVote: { findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    guestDateVote: { upsert: vi.fn() },
    event: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  }};
});

vi.mock("@/lib/event-share", () => ({ resolveEventIdFromToken: vi.fn(), findPublicEventByToken: vi.fn() }));
vi.mock("@/lib/validation", () => ({ validateString: vi.fn(() => null), firstError: vi.fn(() => null) }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })),
  rateLimitResponse: vi.fn((ms: number) => ({ body: { error: "Too many" }, status: 429, headers: { "Retry-After": String(Math.ceil(ms / 1000)) } })),
}));
vi.mock("@/lib/error-messages", () => ({
  Errors: {
    INTERNAL_SERVER_ERROR: "Interner Serverfehler", EVENT_NOT_FOUND: "Event nicht gefunden",
    GUEST_NOT_FOUND: "Gast nicht gefunden", GUEST_NOT_FOUND_FOR_EVENT: "Gast fuer dieses Event nicht gefunden",
    GUEST_ALREADY_VOTED: "Gast hat bereits abgestimmt", GUEST_ID_AND_PROPOSAL_REQUIRED: "guestId und proposalId sind erforderlich",
    PROPOSAL_NOT_FOUND: "Vorschlag nicht gefunden", VOTE_NOT_FOUND: "Stimme nicht gefunden",
    VOTE_REMOVED: "Stimme entfernt", VOTE_RECORDED: "Stimme erfasst",
    MISSING_GUEST_VOTES: "Pflichtfelder fehlen: guestId, votes",
  },
}));

import prisma from "@/lib/db";
import { resolveEventIdFromToken, findPublicEventByToken } from "@/lib/event-share";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateString } from "@/lib/validation";
import { POST as JoinPOST } from "@/app/api/public/event/[token]/join/route";
import { POST as VotePOST, DELETE as VoteDELETE } from "@/app/api/public/event/[token]/vote/route";
import { POST as DateVotePOST } from "@/app/api/public/event/[token]/date-vote/route";
import { createMockRequest, createRouteContext, parseResponse } from "./helpers";

const EVENT_ID = "event-123";
const GUEST_ID = "guest-456";
const PROPOSAL_ID = "proposal-789";

describe("Public Voting Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, retryAfterMs: 0 });
    vi.mocked(resolveEventIdFromToken).mockResolvedValue(EVENT_ID);
    vi.mocked(validateString).mockReturnValue(null);
  });

  describe("POST /join", () => {
    it("creates guest and returns 201", async () => {
      vi.mocked(prisma.guestParticipant.upsert).mockResolvedValue({ id: GUEST_ID, eventId: EVENT_ID, nickname: "Alice" } as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/abc/join", { body: { nickname: "Alice" } });
      const res = await (JoinPOST as Function)(req, createRouteContext({ token: "abc" }));
      expect(parseResponse(res).status).toBe(201);
    });

    it("returns 404 for invalid token", async () => {
      vi.mocked(resolveEventIdFromToken).mockResolvedValue(null);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/bad/join", { body: { nickname: "Bob" } });
      const res = await (JoinPOST as Function)(req, createRouteContext({ token: "bad" }));
      expect(parseResponse(res).status).toBe(404);
    });

    it("returns 429 when rate limited", async () => {
      vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfterMs: 30000 });
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/abc/join", { body: { nickname: "C" } });
      const res = await (JoinPOST as Function)(req, createRouteContext({ token: "abc" }));
      expect(res.status).toBe(429);
    });
  });

  describe("POST /vote", () => {
    it("records vote and returns counts", async () => {
      vi.mocked(prisma.guestParticipant.findFirst).mockResolvedValue({ id: GUEST_ID } as never);
      vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue({ id: PROPOSAL_ID } as never);
      vi.mocked(prisma.guestVote.findFirst).mockResolvedValue(null as never);
      vi.mocked(prisma.guestVote.create).mockResolvedValue({} as never);
      vi.mocked(prisma.gameProposal.findUnique).mockResolvedValue({ _count: { votes: 2, guestVotes: 3 } } as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/abc/vote", { body: { guestId: GUEST_ID, proposalId: PROPOSAL_ID } });
      const res = await (VotePOST as Function)(req, createRouteContext({ token: "abc" }));
      const { status, body } = parseResponse(res);
      expect(status).toBe(200);
      expect(body.totalVotes).toBe(5);
    });

    it("returns 404 when guest not found", async () => {
      vi.mocked(prisma.guestParticipant.findFirst).mockResolvedValue(null as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/abc/vote", { body: { guestId: "bad", proposalId: PROPOSAL_ID } });
      const res = await (VotePOST as Function)(req, createRouteContext({ token: "abc" }));
      expect(parseResponse(res).status).toBe(404);
    });

    it("returns 400 when already voted", async () => {
      vi.mocked(prisma.guestParticipant.findFirst).mockResolvedValue({ id: GUEST_ID } as never);
      vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue({ id: PROPOSAL_ID } as never);
      vi.mocked(prisma.guestVote.findFirst).mockResolvedValue({ id: "existing" } as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/abc/vote", { body: { guestId: GUEST_ID, proposalId: PROPOSAL_ID } });
      const res = await (VotePOST as Function)(req, createRouteContext({ token: "abc" }));
      expect(parseResponse(res).status).toBe(400);
    });
  });

  describe("DELETE /vote", () => {
    it("removes vote", async () => {
      vi.mocked(prisma.guestParticipant.findFirst).mockResolvedValue({ id: GUEST_ID } as never);
      vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue({ id: PROPOSAL_ID } as never);
      vi.mocked(prisma.guestVote.deleteMany).mockResolvedValue({ count: 1 } as never);
      vi.mocked(prisma.gameProposal.findUnique).mockResolvedValue({ _count: { votes: 1, guestVotes: 1 } } as never);
      const req = createMockRequest("DELETE", "http://localhost:3000/api/public/event/abc/vote", { searchParams: { guestId: GUEST_ID, proposalId: PROPOSAL_ID } });
      const res = await (VoteDELETE as Function)(req, createRouteContext({ token: "abc" }));
      expect(parseResponse(res).status).toBe(200);
    });

    it("returns 404 when vote not found", async () => {
      vi.mocked(prisma.guestParticipant.findFirst).mockResolvedValue({ id: GUEST_ID } as never);
      vi.mocked(prisma.gameProposal.findFirst).mockResolvedValue({ id: PROPOSAL_ID } as never);
      vi.mocked(prisma.guestVote.deleteMany).mockResolvedValue({ count: 0 } as never);
      const req = createMockRequest("DELETE", "http://localhost:3000/api/public/event/abc/vote", { searchParams: { guestId: GUEST_ID, proposalId: PROPOSAL_ID } });
      const res = await (VoteDELETE as Function)(req, createRouteContext({ token: "abc" }));
      expect(parseResponse(res).status).toBe(404);
    });
  });

  describe("POST /date-vote", () => {
    it("records date votes", async () => {
      vi.mocked(findPublicEventByToken).mockResolvedValue({ id: EVENT_ID } as never);
      vi.mocked(prisma.guestParticipant.findFirst).mockResolvedValue({ id: GUEST_ID } as never);
      vi.mocked(prisma.$transaction).mockResolvedValue([{ availability: "yes" }] as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/abc/date-vote", {
        body: { guestId: GUEST_ID, votes: [{ dateProposalId: "dp-1", availability: "yes" }] },
      });
      const res = await (DateVotePOST as Function)(req, createRouteContext({ token: "abc" }));
      expect(parseResponse(res).status).toBe(200);
    });

    it("returns 404 for invalid event", async () => {
      vi.mocked(findPublicEventByToken).mockResolvedValue(null as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/bad/date-vote", {
        body: { guestId: GUEST_ID, votes: [{ dateProposalId: "dp-1", availability: "yes" }] },
      });
      const res = await (DateVotePOST as Function)(req, createRouteContext({ token: "bad" }));
      expect(parseResponse(res).status).toBe(404);
    });

    it("returns 400 for invalid availability", async () => {
      vi.mocked(findPublicEventByToken).mockResolvedValue({ id: EVENT_ID } as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/public/event/abc/date-vote", {
        body: { guestId: GUEST_ID, votes: [{ dateProposalId: "dp-1", availability: "invalid" }] },
      });
      const res = await (DateVotePOST as Function)(req, createRouteContext({ token: "abc" }));
      expect(parseResponse(res).status).toBe(400);
    });
  });
});
