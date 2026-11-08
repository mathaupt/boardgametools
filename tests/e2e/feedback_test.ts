// @ts-nocheck - CodeceptJS E2E contract; use an isolated local database and matching server.
import prisma from "../../src/lib/db";
import { encryptId } from "../../src/lib/crypto";

Feature("Shared application feedback");

Scenario("BUG-077: rejected guest registration renders its error message", async ({ I }) => {
  const raw = process.env.SQL_DATABASE_URL;
  if (!raw) throw new Error("An isolated local SQL_DATABASE_URL is required.");
  const url = new URL(raw);
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) || !url.pathname.slice(1).startsWith("bgt_test_")) {
    throw new Error("This scenario only writes to a local bgt_test_* database.");
  }
  let userId: string | undefined;
  let eventId: string | undefined;
  try {
    const user = await prisma.user.create({ data: { email: `feedback-${crypto.randomUUID()}@example.test`, passwordHash: "test-only", name: "Feedback test" } });
    userId = user.id;
    const event = await prisma.event.create({ data: { title: "Feedback test", eventDate: new Date(Date.now() + 86400000), status: "voting", isPublic: true, createdById: userId } });
    eventId = event.id;
    const token = encryptId(eventId);
    await prisma.event.update({ where: { id: eventId }, data: { shareToken: token } });
    await prisma.guestParticipant.create({ data: { eventId, nickname: "Bereits vergeben" } });
    I.amOnPage(`/public/event/${token}`);
    I.fillField("[data-testid=guest-nickname-input]", "Bereits vergeben");
    I.click("[data-testid=guest-join-button]");
    I.waitForText("Beitritt fehlgeschlagen", 10);
    I.see("Dieser Spitzname ist bereits vergeben.");
    const count = await prisma.guestParticipant.count({ where: { eventId } });
    if (count !== 1) throw new Error("Rejected registration must not create another guest.");
  } finally {
    if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});
