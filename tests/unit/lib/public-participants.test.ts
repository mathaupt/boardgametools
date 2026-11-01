import { describe, expect, it } from "vitest";
import { upsertPublicGuest } from "@/lib/events/public-participants";

describe("upsertPublicGuest", () => {
  it("replaces a guest by id, preserves the server vote count, and sorts deterministically", () => {
    const first = { id: "g1", nickname: "Alex", createdAt: "2026-10-31T10:00:00Z", votesCount: 3 };
    const updated = { ...first, votesCount: 4 };
    const other = { id: "g2", nickname: "Alex", createdAt: "2026-10-31T10:00:00Z", votesCount: 1 };
    const result = upsertPublicGuest([other, first], updated);

    expect(result).toEqual([updated, other]);
    expect(result).toHaveLength(2);
    expect([other, first]).toEqual([other, first]);
  });

  it("adds a new guest without merging another person with the same name", () => {
    const old = { id: "g1", nickname: "Alex", createdAt: "2026-10-31T10:00:00Z", votesCount: 2 };
    const added = { id: "g2", nickname: "Alex", createdAt: "2026-11-01T10:00:00Z", votesCount: 0 };
    expect(upsertPublicGuest([old], added)).toEqual([old, added]);
  });
});
