import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ mutation: vi.fn(), notify: vi.fn(), loggerError: vi.fn() }));
vi.mock("@/lib/services/event-mutation.service", () => ({ withEventMutation: mocks.mutation }));
vi.mock("@/lib/services/push.service", () => ({ notifyEventClosed: mocks.notify }));
vi.mock("@/lib/logger", () => ({ default: { error: mocks.loggerError } }));
vi.mock("@/lib/require-auth", () => ({ ApiError: class ApiError extends Error { statusCode: number; constructor(statusCode: number, message: string) { super(message); this.statusCode = statusCode; } } }));
import { closeEvent } from "@/lib/services/event-close.service";
import { ApiError } from "@/lib/require-auth";

const event = { createdById: "owner", title: "Session", invites: [{ id: "i1", userId: "u1" }, { id: "i2", user: { id: "u2" } }, { id: "i3" }] };
const proposal = (id: string, gameId: string, votes: number, createdAt = new Date("2026-01-01")) => ({ id, gameId, createdAt, _count: { votes, guestVotes: 0 } });
function setup(proposals = [proposal("p1", "g1", 1), proposal("p2", "g2", 3)]) {
  const tx = { gameProposal: { findMany: vi.fn().mockResolvedValue(proposals) }, game: { findFirst: vi.fn().mockResolvedValue({ id: "g2" }) }, event: { update: vi.fn().mockResolvedValue({ selectedGame: { name: "Azul" } }) } };
  mocks.mutation.mockImplementation(async (_scope: unknown, _action: unknown, callback: (context: unknown) => unknown) => callback({ tx, event }));
  return tx;
}
beforeEach(() => { mocks.mutation.mockReset(); mocks.notify.mockReset(); mocks.loggerError.mockReset(); mocks.notify.mockResolvedValue(undefined); });

describe("closeEvent", () => {
  it("wählt ohne explizite Auswahl den meistgewählten Vorschlag und informiert Einladungen", async () => {
    const tx = setup();
    await closeEvent("owner", "event-1");
    expect(tx.event.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "closed", selectedGameId: "g2", winningProposalId: "p2" } }));
    expect(mocks.notify.mock.calls.map(([userId]) => userId)).toEqual(["u1", "u2", "owner"]);
  });

  it("nutzt explizit gewählten Vorschlag oder ein passendes Spiel", async () => {
    const tx = setup(); await closeEvent("owner", "e", undefined, "p1");
    expect(tx.event.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ selectedGameId: "g1", winningProposalId: "p1" }) }));
    const tx2 = setup(); await closeEvent("owner", "e", "g1");
    expect(tx2.event.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ selectedGameId: "g1", winningProposalId: "p1" }) }));
  });

  it("schließt ein Event ohne Vorschläge ohne Gewinner", async () => {
    const tx = setup([]); await closeEvent("owner", "e");
    expect(tx.event.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "closed", selectedGameId: null, winningProposalId: null } }));
  });

  it("weist fremde Vorschläge, nicht vorgeschlagene Spiele und gelöschte Spiele zurück", async () => {
    setup(); await expect(closeEvent("owner", "e", undefined, "unknown")).rejects.toMatchObject({ statusCode: 400 });
    setup(); await expect(closeEvent("owner", "e", "unknown-game")).rejects.toMatchObject({ statusCode: 400 });
    const tx = setup(); tx.game.findFirst.mockResolvedValue(null);
    await expect(closeEvent("owner", "e", "g1")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lehnt ein Spiel ab, das nicht zur ausgewählten Gewinnervorschlags-ID gehört", async () => {
    setup(); await expect(closeEvent("owner", "e", "g1", "p2")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("meldet Push-Fehler, ohne das Schließen rückgängig zu machen", async () => {
    setup(); mocks.notify.mockRejectedValue(new Error("push offline"));
    await expect(closeEvent("owner", "e")).resolves.toEqual({ selectedGame: { name: "Azul" } });
    expect(mocks.loggerError).toHaveBeenCalledTimes(3);
  });

  it("verlangt den Ersteller, bevor die Vorschläge geschlossen werden", async () => {
    mocks.mutation.mockImplementation(async (_scope: unknown, _action: unknown, callback: (context: unknown) => unknown) => callback({ tx: {}, event: { ...event, createdById: "other" } }));
    await expect(closeEvent("owner", "e")).rejects.toBeInstanceOf(ApiError);
  });
});
