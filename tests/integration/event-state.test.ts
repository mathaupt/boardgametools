import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/require-auth", () => ({
  ApiError: class ApiError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
  requireAuth: vi.fn(),
  handleApiError: (error: { statusCode?: number; message?: string }) => new Response(
    JSON.stringify({ error: error.message ?? "Internal error" }),
    { status: error.statusCode ?? 500, headers: { "Content-Type": "application/json" } }
  ),
}));
vi.mock("@/lib/cache", () => ({ invalidateTag: vi.fn() }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/services/push.service", () => ({ notifyNewVote: vi.fn() }));

import { requireAuth } from "@/lib/require-auth";
import { encryptId } from "@/lib/crypto";
import prisma from "@/lib/db";
import { withEventMutation } from "@/lib/services/event-mutation.service";
import { POST as postGameVote, DELETE as deleteGameVote } from "@/app/api/events/[id]/votes/route";
import { POST as postGuestDateVote } from "@/app/api/public/event/[token]/date-vote/route";
import { POST as postGuestGameVote } from "@/app/api/public/event/[token]/vote/route";

describe("Event lifecycle database serialization", () => {
  let userId: string;
  let eventId: string;
  let otherEventId: string;
  let foreignProposalId: string;
  let localProposalId: string;
  let guestId: string;
  let foreignDateProposalId: string;
  let shareToken: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `feat010-${crypto.randomUUID()}@example.test`,
        passwordHash: "integration-only",
        name: "FEAT-010 integration",
      },
      select: { id: true },
    });
    userId = user.id;
    const event = await prisma.event.create({
      data: {
        title: "FEAT-010 lifecycle test",
        eventDate: new Date(Date.now() + 86_400_000),
        status: "voting",
        createdById: userId,
        isPublic: true,
        shareToken: "pending-feat010-token",
      },
      select: { id: true },
    });
    eventId = event.id;
    shareToken = encryptId(eventId);
    await prisma.event.update({ where: { id: eventId }, data: { shareToken } });

    const otherEvent = await prisma.event.create({
      data: {
        title: "FEAT-010 foreign object test",
        eventDate: new Date(Date.now() + 86_400_000),
        status: "voting",
        createdById: userId,
      },
      select: { id: true },
    });
    otherEventId = otherEvent.id;
    const game = await prisma.game.create({
      data: { name: "Foreign proposal test game", ownerId: userId },
      select: { id: true },
    });
    const proposal = await prisma.gameProposal.create({
      data: { eventId: otherEventId, gameId: game.id, proposedById: userId },
      select: { id: true },
    });
    foreignProposalId = proposal.id;
    const localProposal = await prisma.gameProposal.create({
      data: { eventId, gameId: game.id, proposedById: userId },
      select: { id: true },
    });
    localProposalId = localProposal.id;
    const guest = await prisma.guestParticipant.create({
      data: { eventId, nickname: "FEAT-010 guest" },
      select: { id: true },
    });
    guestId = guest.id;
    const dateProposal = await prisma.dateProposal.create({
      data: { eventId: otherEventId, date: new Date(Date.now() + 172_800_000) },
      select: { id: true },
    });
    foreignDateProposalId = dateProposal.id;
  });

  afterAll(async () => {
    if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
    if (otherEventId) await prisma.event.deleteMany({ where: { id: otherEventId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        status: "voting",
        eventDate: new Date(Date.now() + 86_400_000),
        selectedDate: null,
        selectedGameId: null,
        winningProposalId: null,
      },
    });
  });

  it("serializes a vote behind event close and rejects it without a write", async () => {
    let announceClose!: () => void;
    let releaseClose!: () => void;
    const closeAcquired = new Promise<void>((resolve) => { announceClose = resolve; });
    const closeGate = new Promise<void>((resolve) => { releaseClose = resolve; });

    const closing = withEventMutation({ kind: "user", eventId, userId }, "close", async ({ tx }) => {
      await tx.event.update({ where: { id: eventId }, data: { status: "closed" } });
      announceClose();
      await closeGate;
    });
    await closeAcquired;

    let voteSettled = false;
    const voting = withEventMutation({ kind: "user", eventId, userId }, "voteGame", async ({ tx }) => {
      await tx.gameProposal.create({ data: { eventId, bggName: "Must not be saved" } });
    }).finally(() => { voteSettled = true; });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(voteSettled).toBe(false);
    releaseClose();
    await closing;
    await expect(voting).rejects.toMatchObject({ statusCode: 409 });
    expect(await prisma.gameProposal.count({ where: { eventId, bggName: "Must not be saved" } })).toBe(0);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: eventId } })).status).toBe("closed");
  });

  it("returns 409 from the public vote route after the event is closed", async () => {
    await prisma.event.update({ where: { id: eventId }, data: { status: "closed" } });

    const response = await postGuestGameVote(new NextRequest(`http://localhost/api/public/event/${shareToken}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, proposalId: localProposalId }),
    }), { params: Promise.resolve({ token: shareToken }) });

    expect(response.status).toBe(409);
    expect(await prisma.guestVote.count({ where: { guestId, proposalId: localProposalId } })).toBe(0);
  });

  it("rejects a proposal from another event for both voting and vote removal", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId } as never);
    const context = { params: Promise.resolve({ id: eventId }) };

    const created = await postGameVote(new NextRequest(`http://localhost/api/events/${eventId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: foreignProposalId }),
    }), context);
    const removed = await deleteGameVote(new NextRequest(`http://localhost/api/events/${eventId}/votes?proposalId=${foreignProposalId}`, {
      method: "DELETE",
    }), context);

    expect(created.status).toBe(404);
    expect(removed.status).toBe(404);
    expect(await prisma.vote.count({ where: { proposalId: foreignProposalId } })).toBe(0);
  });

  it("rejects a guest date vote for a date belonging to another event", async () => {
    const response = await postGuestDateVote(new NextRequest(`http://localhost/api/public/event/${shareToken}/date-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId,
        votes: [{ dateProposalId: foreignDateProposalId, availability: "yes" }],
      }),
    }), { params: Promise.resolve({ token: shareToken }) });

    expect(response.status).toBe(404);
    expect(await prisma.guestDateVote.count({ where: { dateProposalId: foreignDateProposalId, guestId } })).toBe(0);
  });
});
