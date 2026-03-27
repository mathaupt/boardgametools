import { describe, it, expect } from "vitest";
import { CacheTags } from "@/lib/cache-tags";

describe("cache-tags", () => {
  const tagFunctions = Object.keys(CacheTags) as (keyof typeof CacheTags)[];

  it("all exports are functions", () => {
    for (const key of tagFunctions) {
      expect(typeof CacheTags[key]).toBe("function");
    }
  });

  it("all functions return strings", () => {
    for (const key of tagFunctions) {
      expect(typeof CacheTags[key]("test-id")).toBe("string");
    }
  });

  it("tags contain the userId", () => {
    const userId = "abc-123";
    for (const key of tagFunctions) {
      const tag = CacheTags[key](userId);
      expect(tag, `${key} should contain userId`).toContain(userId);
    }
  });

  it("userStats returns expected format", () => {
    expect(CacheTags.userStats("X")).toBe("user-stats-X");
  });

  it("userGames returns expected format", () => {
    expect(CacheTags.userGames("X")).toBe("user-games-X");
  });

  it("userSessions returns expected format", () => {
    expect(CacheTags.userSessions("X")).toBe("user-sessions-X");
  });

  it("userEvents returns expected format", () => {
    expect(CacheTags.userEvents("X")).toBe("user-events-X");
  });

  it("userGroups returns expected format", () => {
    expect(CacheTags.userGroups("X")).toBe("user-groups-X");
  });

  it("userTags returns expected format", () => {
    expect(CacheTags.userTags("X")).toBe("user-tags-X");
  });

  it("userSeries returns expected format", () => {
    expect(CacheTags.userSeries("X")).toBe("user-series-X");
  });

  it("userDashboard returns expected format", () => {
    expect(CacheTags.userDashboard("X")).toBe("dashboard-X");
  });

  it("pendingInvites returns expected format", () => {
    expect(CacheTags.pendingInvites("X")).toBe("pending-invites-X");
  });

  it("groupStats returns expected format", () => {
    expect(CacheTags.groupStats("X")).toBe("group-stats-X");
  });

  it("different IDs produce different tags", () => {
    for (const key of tagFunctions) {
      const tag1 = CacheTags[key]("user-1");
      const tag2 = CacheTags[key]("user-2");
      expect(tag1).not.toBe(tag2);
    }
  });
});
