import { describe, it, expect } from "vitest";
import { changelog, currentVersion } from "@/lib/changelog";

describe("changelog", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(changelog)).toBe(true);
    expect(changelog.length).toBeGreaterThan(0);
  });

  it("currentVersion equals first entry version", () => {
    expect(currentVersion).toBe(changelog[0].version);
  });

  it("every entry has required fields", () => {
    for (const entry of changelog) {
      expect(entry.version).toBeTruthy();
      expect(entry.date).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(Array.isArray(entry.changes)).toBe(true);
      expect(entry.changes.length).toBeGreaterThan(0);
    }
  });

  it("all versions are unique", () => {
    const versions = changelog.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("all dates are valid date strings (YYYY-MM-DD)", () => {
    for (const entry of changelog) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const parsed = new Date(entry.date);
      expect(parsed.getTime()).not.toBeNaN();
    }
  });

  it("every change has valid type and non-empty text", () => {
    const validTypes = ["feature", "fix", "improvement", "internal"];
    for (const entry of changelog) {
      for (const change of entry.changes) {
        expect(validTypes).toContain(change.type);
        expect(change.text.length).toBeGreaterThan(0);
      }
    }
  });

  it("versions follow semver-like pattern (X.Y.Z)", () => {
    for (const entry of changelog) {
      expect(entry.version).toMatch(/^\d+\.\d+(\.\d+)?$/);
    }
  });
});
