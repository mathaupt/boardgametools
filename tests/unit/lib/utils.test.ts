import { describe, it, expect } from "vitest";
import { cn, formatDate, formatDateTime, formatDuration } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("formatDate", () => {
  it("formats date correctly in German locale", () => {
    const date = new Date("2024-03-15");
    const result = formatDate(date);
    expect(result).toMatch(/15\.03\.2024/);
  });

  it("handles string input", () => {
    const result = formatDate("2024-12-25");
    expect(result).toMatch(/25\.12\.2024/);
  });
});

describe("formatDateTime", () => {
  it("formats date and time correctly", () => {
    const date = new Date("2024-03-15T14:30:00");
    const result = formatDateTime(date);
    expect(result).toContain("15.03.2024");
    expect(result).toContain("14:30");
  });
});

describe("formatDuration", () => {
  it("formats minutes under 60", () => {
    expect(formatDuration(45)).toBe("45 Min.");
  });

  it("formats exact hours", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });
});
