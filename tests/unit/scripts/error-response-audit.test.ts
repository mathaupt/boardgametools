import { describe, expect, it } from "vitest";
import { isLegacyMessageErrorResponse } from "../../../scripts/lib/error-response-audit.mjs";

describe("isLegacyMessageErrorResponse", () => {
  it("does not count successful message response bodies as errors", () => {
    expect(isLegacyMessageErrorResponse("return NextResponse.json({ message: Errors.DELETED });")).toBe(false);
  });

  it("counts a message body returned with an HTTP error status", () => {
    expect(isLegacyMessageErrorResponse("return NextResponse.json({ message: error }, { status: 400 });")).toBe(true);
  });

  it("does not count message text that has no HTTP error status", () => {
    expect(isLegacyMessageErrorResponse("return { message: Errors.SAVED };")).toBe(false);
  });
});
