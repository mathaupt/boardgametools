import { describe, expect, it } from "vitest";
import { gameTextForRead, normalizeGameText } from "@/lib/game-text";

describe("game text entity normalization", () => {
  const nestedCopyright = (layers: number) =>
    Array.from({ length: layers }).reduce<string>((value) => value.replaceAll("&", "&amp;"), "&copy;");
  it("decodes nested entities to stable plain text", () => {
    const result = "Horrified: Dungeons & Dragons";
    expect(normalizeGameText("Horrified: Dungeons &amp;amp; Dragons")).toBe(result);
    expect(normalizeGameText(result)).toBe(result);
  });

  it("decodes named, decimal and non-BMP numeric entities", () => {
    expect(normalizeGameText("&#x1F3B2; &#169; &copy; &#039;")).toBe("🎲 © © '");
  });

  it("preserves literal ampersands, comparisons and unknown or incomplete entities", () => {
    const input = "AT&T; 1 < 3 > 2 &spiel; &amp";
    expect(normalizeGameText(input)).toBe(input);
  });

  it("normalizes non-breaking spaces and preserves line breaks", () => {
    expect(normalizeGameText("a&nbsp;b&#10;c&#13;d")).toBe("a b\nc\rd");
  });

  it("allows eight layers and rejects a ninth", () => {
    expect(normalizeGameText(nestedCopyright(7))).toBe("©");
    expect(() => normalizeGameText(nestedCopyright(8))).toThrow(RangeError);
  });

  it("keeps over-nested stored values visible to read callers", () => {
    const input = nestedCopyright(8);
    expect(gameTextForRead(input)).toBe(input);
  });
});
