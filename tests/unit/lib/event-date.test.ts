import { describe, expect, it } from "vitest";
import { combineEventDateWithStartTime } from "@/lib/events/event-date";

describe("event calendar date and time", () => {
  it("keeps the Europe/Berlin wall-clock time when a selected date crosses daylight saving time", () => {
    const selectedStart = combineEventDateWithStartTime(
      new Date("2026-03-30T00:00:00.000Z"),
      new Date("2026-03-28T18:00:00.000Z"),
    );

    expect(selectedStart?.toISOString()).toBe("2026-03-30T17:00:00.000Z");
  });
});
