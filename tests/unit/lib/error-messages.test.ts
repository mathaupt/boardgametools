import { describe, it, expect } from "vitest";
import { Errors } from "@/lib/error-messages";

describe("error-messages", () => {
  const allKeys = Object.keys(Errors) as (keyof typeof Errors)[];

  it("defines all expected key constants", () => {
    const expectedKeys = [
      "EVENT_NOT_FOUND",
      "INTERNAL_SERVER_ERROR",
      "UNAUTHORIZED",
      "NOT_FOUND",
      "ACCESS_DENIED",
      "MISSING_REQUIRED_FIELDS",
      "USER_NOT_FOUND",
      "SESSION_NOT_FOUND",
      "GROUP_NOT_FOUND",
      "SERIES_NOT_FOUND",
      "GAME_NOT_FOUND",
      "POLL_NOT_FOUND",
    ];
    for (const key of expectedKeys) {
      expect(Errors).toHaveProperty(key);
    }
  });

  it("all string constants are non-empty", () => {
    for (const key of allKeys) {
      const value = Errors[key];
      if (typeof value === "string") {
        expect(value.length, `${key} should be non-empty`).toBeGreaterThan(0);
      }
    }
  });

  it("INVALID_FILE_TYPE returns a string containing the allowed argument", () => {
    const result = Errors.INVALID_FILE_TYPE("image/png");
    expect(typeof result).toBe("string");
    expect(result).toContain("image/png");
  });

  it("FILE_TOO_LARGE returns a string containing the max MB argument", () => {
    const result = Errors.FILE_TOO_LARGE(5);
    expect(typeof result).toBe("string");
    expect(result).toContain("5");
  });

  it("has no duplicate string values", () => {
    const stringValues = allKeys
      .map((k) => Errors[k])
      .filter((v): v is string => typeof v === "string");
    const unique = new Set(stringValues);
    expect(unique.size).toBe(stringValues.length);
  });

  it("core keys contain German text", () => {
    const germanChecks: Record<string, string> = {
      INTERNAL_SERVER_ERROR: "Interner Serverfehler",
      UNAUTHORIZED: "Nicht autorisiert",
      NOT_FOUND: "Nicht gefunden",
      EVENT_NOT_FOUND: "Event nicht gefunden",
      GROUP_NOT_FOUND: "Gruppe nicht gefunden",
      SESSION_NOT_FOUND: "Sitzung nicht gefunden",
      SERIES_NOT_FOUND: "Serie nicht gefunden",
    };
    for (const [key, expected] of Object.entries(germanChecks)) {
      expect(Errors[key as keyof typeof Errors]).toBe(expected);
    }
  });

  it("BGG-related error keys exist", () => {
    const bggKeys = [
      "INVALID_BGG_ID",
      "GAME_NOT_FOUND_BGG",
      "FAILED_TO_FETCH_GAME",
      "BGG_USERNAME_REQUIRED",
      "COLLECTION_FETCH_FAILED",
      "QUERY_MIN_LENGTH",
      "SEARCH_FAILED",
      "BGG_ID_REQUIRED",
    ];
    for (const key of bggKeys) {
      expect(Errors).toHaveProperty(key);
    }
  });

  it("upload-related error keys exist", () => {
    expect(Errors).toHaveProperty("NO_IMAGE_FILE");
    expect(Errors).toHaveProperty("INVALID_FILE_TYPE");
    expect(Errors).toHaveProperty("FILE_TOO_LARGE");
  });

  it("password-related error keys exist", () => {
    expect(Errors).toHaveProperty("PASSWORD_MIN_LENGTH");
    expect(Errors).toHaveProperty("INVALID_PASSWORD");
    expect(Errors).toHaveProperty("PASSWORD_CHANGED");
  });
});
