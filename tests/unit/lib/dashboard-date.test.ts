import { describe, expect, it } from "vitest";
import { toDashboardISOString } from "@/lib/dashboard-date";

describe("toDashboardISOString", () => {
  it("normalizes a cached ISO string", () => {
    expect(toDashboardISOString("2026-11-01T17:30:00.000Z")).toBe("2026-11-01T17:30:00.000Z");
  });

  it("normalizes a Prisma Date object", () => {
    expect(toDashboardISOString(new Date("2026-11-01T17:30:00.000Z"))).toBe("2026-11-01T17:30:00.000Z");
  });
});
