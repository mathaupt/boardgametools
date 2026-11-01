import { describe, expect, it } from "vitest";
import { isReadinessTokenConfigured, hasValidReadinessAuthorization } from "@/lib/health/readiness-auth";

const token = "readiness-token-for-tests-only-1234567890";

describe("readiness authentication", () => {
  it("requires a configured token with at least 32 bytes", () => {
    expect(isReadinessTokenConfigured(undefined)).toBe(false);
    expect(isReadinessTokenConfigured("too-short")).toBe(false);
    expect(isReadinessTokenConfigured(token)).toBe(true);
  });

  it("accepts only a matching bounded Bearer authorization header", () => {
    expect(hasValidReadinessAuthorization(`Bearer ${token}`, token)).toBe(true);
    expect(hasValidReadinessAuthorization(null, token)).toBe(false);
    expect(hasValidReadinessAuthorization(token, token)).toBe(false);
    expect(hasValidReadinessAuthorization(`Bearer ${token}x`, token)).toBe(false);
    expect(hasValidReadinessAuthorization(`Bearer ${"x".repeat(2049)}`, token)).toBe(false);
  });
});
