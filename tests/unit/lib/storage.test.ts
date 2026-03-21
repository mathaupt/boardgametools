import { describe, it, expect } from "vitest";
import { generateFileName } from "@/lib/storage";

describe("storage", () => {
  describe("generateFileName", () => {
    it("preserves file extension", () => {
      const name = generateFileName("photo.png");
      expect(name).toMatch(/\.png$/);
    });

    it("generates 32-char hex prefix", () => {
      const name = generateFileName("test.jpg");
      const prefix = name.split(".")[0];
      expect(prefix).toMatch(/^[0-9a-f]{32}$/);
    });

    it("handles multiple dots in filename", () => {
      const name = generateFileName("my.photo.file.webp");
      expect(name).toMatch(/\.webp$/);
    });

    it("generates unique names for same input", () => {
      const name1 = generateFileName("test.png");
      const name2 = generateFileName("test.png");
      expect(name1).not.toBe(name2);
    });

    it("lowercases extension", () => {
      const name = generateFileName("photo.PNG");
      expect(name).toMatch(/\.png$/);
    });
  });
});
