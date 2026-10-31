import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { withEventMutation } from "@/lib/services/event-mutation.service";

describe("Event lifecycle database serialization", () => {
  let userId: string;
  let eventId: string;

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
      },
      select: { id: true },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
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
    expect(await prisma.gameProposal.count({ where: { eventId } })).toBe(0);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: eventId } })).status).toBe("closed");
  });
});
