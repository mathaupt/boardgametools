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

Scenario("Public date voting stays reachable at narrow widths and saves keyboard changes", async ({ I }) => {
  const databaseUrl = process.env.SQL_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("SQL_DATABASE_URL is required for this E2E scenario.");

  let userId: string | undefined;
  let eventId: string | undefined;

  try {
    const user = await prisma.user.create({
      data: {
        email: `feat011-e2e-${crypto.randomUUID()}@example.test`,
        passwordHash: "e2e-only",
        name: "FEAT-011 E2E",
      },
      select: { id: true },
    });
    userId = user.id;

    const event = await prisma.event.create({
      data: {
        title: "FEAT-011 accessible date voting",
        eventDate: new Date(Date.now() + 86_400_000 * 14),
        status: "voting",
        isPublic: true,
        shareToken: "pending-feat011-e2e-token",
        createdById: userId,
      },
      select: { id: true },
    });
    eventId = event.id;
    const token = encryptId(eventId);
    await prisma.event.update({ where: { id: eventId }, data: { shareToken: token } });
    const proposal = await prisma.dateProposal.create({
      data: { eventId, date: new Date("2026-11-20T00:00:00.000Z") },
      select: { id: true },
    });

    I.resizeWindow(390, 844);
    await I.amOnPage(`/public/event/${token}`);
    await I.fillField("[data-testid=guest-nickname-input]", "Access guest");
    await I.click("[data-testid=guest-join-button]");
    await I.waitForText("Willkommen zurück, Access guest!", 10);
    const guest = await prisma.guestParticipant.findFirst({
      where: { eventId, nickname: "Access guest" },
      select: { id: true },
    });
    if (!guest) throw new Error("Guest registration did not create the expected guest.");

    for (const width of [320, 390, 768, 1440, 195, 98]) {
      I.resizeWindow(width, 844);
      const layout = await I.executeScript((proposalId) => {
        const section = document.querySelector('[data-testid="date-voting-section"]');
        const group = document.querySelector(`[data-testid="date-availability-group-${proposalId}"]`);
        const labels = Array.from(group?.querySelectorAll("label") ?? []).map((label) => {
          const rect = label.getBoundingClientRect();
          return { width: rect.width, height: rect.height, left: rect.left, right: rect.right };
        });
        return {
          viewportWidth: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
          sectionWidth: section?.clientWidth ?? 0,
          sectionScrollWidth: section?.scrollWidth ?? 0,
          labels,
        };
      }, proposal.id);

      // At 98 CSS px, check the date-voting surface in isolation as a 400-%-zoom equivalent.
      if (width !== 98 && layout.documentWidth > layout.viewportWidth) {
        throw new Error(`Document overflows at ${width}px: ${layout.documentWidth}/${layout.viewportWidth}`);
      }
      if (layout.sectionScrollWidth > layout.sectionWidth) {
        throw new Error(`Date voting section overflows at ${width}px: ${layout.sectionScrollWidth}/${layout.sectionWidth}`);
      }
      for (const label of layout.labels) {
        if (label.width < 44 || label.height < 44 || label.left < 0 || label.right > layout.viewportWidth) {
          throw new Error(`Date answer target is not reachable at ${width}px: ${JSON.stringify(label)}`);
        }
      }
    }

    I.resizeWindow(390, 844);
    await I.click(`[data-testid="date-availability-group-${proposal.id}"] input[value="yes"]`);
    I.pressKey("ARROWDOWN");
    await I.waitForFunction((proposalId) => {
      const group = document.querySelector(`[data-testid="date-availability-group-${proposalId}"]`);
      return group?.querySelector('input[value="maybe"]')?.checked === true;
    }, [proposal.id], 10);
    await I.see("Deine Antwort: Vielleicht");

    const savedVote = await prisma.guestDateVote.findFirst({
      where: { guestId: guest.id, dateProposalId: proposal.id },
      select: { availability: true },
    });
    if (savedVote?.availability !== "maybe") {
      throw new Error(`Expected keyboard vote to save maybe; received ${savedVote?.availability ?? "no vote"}.`);
    }
  } finally {
    if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});
