import { afterEach, describe, it, expect, vi } from "vitest";
import { generateFileName } from "@/lib/storage";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

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

    it("returns hash.ext format", () => {
      const name = generateFileName("document.pdf");
      expect(name).toMatch(/^[0-9a-f]{32}\.pdf$/);
    });
  });

  it("uploads through the configured Blob provider", async () => {
    const put = vi.fn().mockResolvedValue({ pathname: "games/cover.jpg", url: "https://blob.test/cover.jpg" });
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
    vi.doMock("@vercel/blob", () => ({ put }));

    const { storage } = await import("@/lib/storage");
    const buffer = Buffer.from("image-data");
    await expect(storage.upload(buffer, "cover.jpg", "image/jpeg")).resolves.toEqual({
      storagePath: "games/cover.jpg",
      publicUrl: "https://blob.test/cover.jpg",
    });
    expect(put).toHaveBeenCalledWith("cover.jpg", buffer, { access: "public", contentType: "image/jpeg" });
  });

  it("refuses ephemeral local storage in production", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("NODE_ENV", "production");
    const { storage } = await import("@/lib/storage");

    await expect(storage.upload(Buffer.from("image-data"), "cover.jpg", "image/jpeg"))
      .rejects.toThrow("Local file storage is ephemeral in production");
  });
});
