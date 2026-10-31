import { describe, expect, it } from "vitest";
import { evaluateEventState } from "@/lib/events/event-state";

const now = new Date("2026-10-31T12:00:00.000Z");
const event = (overrides: Partial<Parameters<typeof evaluateEventState>[0]> = {}) => ({
  status: "voting",
  eventDate: new Date("2026-11-06T18:00:00.000Z"),
  selectedDate: null,
  selectedGameId: null,
  winningProposalId: null,
  deletedAt: null,
  ...overrides,
});

describe("evaluateEventState", () => {
  it.each(["closed", "cancelled", "unknown", "draft", "planning", "voting", "past", "unavailable"])(
    "liefert für %s den vollständigen Aktionsvertrag",
    (status) => {
      const result = evaluateEventState(event({ status }), now);
      expect(Object.keys(result.available)).toEqual([
        "join", "proposeGame", "voteGame", "voteDate", "manageDates", "selectDate", "resetDates", "close",
      ]);
    }
  );

  it.each([["planned", "planning"], ["open", "open"]] as const)(
    "normalisiert den Legacy-Status %s ohne den Ursprung zu mutieren",
    (status, expectedPhase) => {
      const source = event({ status });
      const result = evaluateEventState(source, now);
      expect(result.phase).toBe(expectedPhase);
      expect(source.status).toBe(status);
    }
  );

  it("sperrt alle Aktionen bei einem zukünftigen geschlossenen Event", () => {
    const result = evaluateEventState(event({ status: "closed" }), now);
    expect(result.phase).toBe("closed");
    expect(Object.values(result.available).every(Boolean)).toBe(false);
  });

  it("hält einen Entwurf mit vergangenem Platzhalterdatum in der Planung offen", () => {
    const result = evaluateEventState(event({
      status: "planning",
      eventDate: new Date("2020-01-01T00:00:00.000Z"),
    }), now);
    expect(result.phase).toBe("planning");
    expect(result.dateKind).toBe("provisional");
    expect(result.available.join).toBe(true);
    expect(result.available.voteGame).toBe(true);
  });

  it("verwendet selectedDate als date-only Quelle und sperrt erst nach dem Berliner Kalendertag", () => {
    const selectedDate = new Date("2026-11-01T00:00:00.000Z");
    const beforeEnd = evaluateEventState(event({ selectedDate }), new Date("2026-11-01T22:59:59.999Z"));
    const afterEnd = evaluateEventState(event({ selectedDate }), new Date("2026-11-01T23:00:00.000Z"));
    expect(beforeEnd.phase).toBe("open");
    expect(beforeEnd.dateKind).toBe("date");
    expect(beforeEnd.available.resetDates).toBe(true);
    expect(afterEnd.phase).toBe("past");
    expect(Object.values(afterEnd.available).every(Boolean)).toBe(false);
  });

  it.each([
    ["2026-03-29T21:59:59.999Z", "open"],
    ["2026-03-29T22:00:00.000Z", "past"],
  ] as const)("wertet Tagesende nach der Sommerzeitumstellung (%s) korrekt aus", (instant, phase) => {
    const result = evaluateEventState(event({ selectedDate: new Date("2026-03-29T00:00:00.000Z") }), new Date(instant));
    expect(result.phase).toBe(phase);
  });

  it("behandelt das bestätigte datetime am exakten Startzeitpunkt als vergangen", () => {
    const eventDate = new Date("2026-10-31T12:00:00.000Z");
    expect(evaluateEventState(event({ eventDate }), eventDate).phase).toBe("past");
  });

  it("lässt bei ausgewähltem Spiel nur Terminaktionen offen", () => {
    const result = evaluateEventState(event({ selectedGameId: "game-1" }), now);
    expect(result.available.voteGame).toBe(false);
    expect(result.available.proposeGame).toBe(false);
    expect(result.available.voteDate).toBe(true);
    expect(result.available.manageDates).toBe(true);
  });

  it("priorisiert Absage vor vergangenem Termin", () => {
    const result = evaluateEventState(event({
      status: "cancelled",
      eventDate: new Date("2020-01-01T00:00:00.000Z"),
    }), now);
    expect(result.phase).toBe("cancelled");
    expect(result.label).toBe("Abgesagt");
  });

  it("sperrt unbekannten Status, ungültige Termine und gelöschte Events fail-closed", () => {
    for (const input of [
      event({ status: "future-state" }),
      event({ eventDate: new Date(Number.NaN) }),
      event({ deletedAt: now }),
    ]) {
      const result = evaluateEventState(input, now);
      expect(result.phase).toBe("unavailable");
      expect(Object.values(result.available).every(Boolean)).toBe(false);
    }
  });

  it("stellt bei widersprüchlichen Daten den ausgewählten Kalendertag dar", () => {
    const result = evaluateEventState(event({
      eventDate: new Date("2026-11-10T18:00:00.000Z"),
      selectedDate: new Date("2026-11-01T00:00:00.000Z"),
    }), now);
    expect(result.effectiveDate).toBe("2026-11-01");
    expect(result.dateKind).toBe("date");
  });
});
