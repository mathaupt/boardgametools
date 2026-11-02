import { describe, expect, it } from "vitest";
import { getSessionCoverSource } from "@/components/sessions/session-cover-source";

describe("getSessionCoverSource", () => {
  it("allows local uploads and the configured BoardGameGeek image host", () => {
    expect(getSessionCoverSource("/uploads/0123456789abcdef0123456789abcdef.jpg"))
      .toBe("/uploads/0123456789abcdef0123456789abcdef.jpg");
    expect(getSessionCoverSource("https://cf.geekdo-images.com/catan.jpg?size=large"))
      .toBe("https://cf.geekdo-images.com/catan.jpg?size=large");
  });

  it.each([
    null,
    "",
    "   ",
    "//cf.geekdo-images.com/catan.jpg",
    "http://cf.geekdo-images.com/catan.jpg",
    "https://user:secret@cf.geekdo-images.com/catan.jpg",
    "https://cf.geekdo-images.com:8443/catan.jpg",
    "https://example.org/catan.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,abc",
    "/uploads/../private.jpg",
    "/elsewhere/catan.jpg",
  ])("rejects unsupported or unsafe source %s", (value) => {
    expect(getSessionCoverSource(value)).toBeNull();
  });
});
