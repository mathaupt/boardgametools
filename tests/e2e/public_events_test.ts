// @ts-nocheck - CodeceptJS E2E tests
import prisma from "../../src/lib/db";
import { encryptId } from "../../src/lib/crypto";

Feature("Public event lifecycle");

Scenario("Rejects a guest vote from an open page after the event closes", async ({ I }) => {
  const databaseUrl = process.env.SQL_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("SQL_DATABASE_URL is required for this E2E scenario.");

  let userId: string | undefined;
  let eventId: string | undefined;

  try {
    const user = await prisma.user.create({
      data: {
        email: `feat010-e2e-${crypto.randomUUID()}@example.test`,
        passwordHash: "e2e-only",
        name: "FEAT-010 E2E",
      },
      select: { id: true },
    });
    userId = user.id;

    const event = await prisma.event.create({
      data: {
        title: "FEAT-010 stale page E2E",
        eventDate: new Date(Date.now() + 86_400_000),
        status: "voting",
        isPublic: true,
        shareToken: "pending-feat010-e2e-token",
        createdById: userId,
      },
      select: { id: true },
    });
    eventId = event.id;
    const token = encryptId(eventId);
    await prisma.event.update({ where: { id: eventId }, data: { shareToken: token } });

    const game = await prisma.game.create({
      data: { name: "FEAT-010 E2E game", ownerId: userId },
      select: { id: true },
    });
    const proposal = await prisma.gameProposal.create({
      data: { eventId, gameId: game.id, proposedById: userId },
      select: { id: true },
    });

    await I.amOnPage(`/public/event/${token}`);
    await I.see("Abstimmung offen");
    await I.fillField("[data-testid=guest-nickname-input]", "E2E guest");
    await I.click("[data-testid=guest-join-button]");
    await I.waitForText("Willkommen zurück, E2E guest!", 10);
    const guest = await prisma.guestParticipant.findFirst({
      where: { eventId, nickname: "E2E guest" },
      select: { id: true },
    });
    if (!guest) throw new Error("Guest registration did not create the expected guest.");

    const voteButton = `[data-testid="guest-vote-${proposal.id}"]`;
    await I.waitForFunction((selector) => !document.querySelector(selector)?.disabled, [voteButton], 10);

    await prisma.event.update({ where: { id: eventId }, data: { status: "closed" } });
    await I.click(voteButton);
    await I.waitForText("Abstimmung geschlossen", 10);
    await I.waitForFunction((selector) => document.querySelector(selector)?.disabled, [voteButton], 10);

    const savedVotes = await prisma.guestVote.count({ where: { guestId: guest.id, proposalId: proposal.id } });
    if (savedVotes !== 0) throw new Error(`Expected no vote after event close; found ${savedVotes}.`);
    await I.dontSeeElement("[data-testid^='guest-vote-']:not([disabled])");
  } finally {
    if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});
