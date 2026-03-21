import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getClientBaseUrl } from "@/lib/public-link";

describe("getClientBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Ensure window is undefined (Node.js / SSR)
    vi.stubGlobal("window", undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns window.location.origin when window exists", () => {
    vi.stubGlobal("window", { location: { origin: "https://my-app.com" } });
    expect(getClientBaseUrl()).toBe("https://my-app.com");
  });

  it("falls back to NEXT_PUBLIC_APP_URL when window is undefined", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com/";
    expect(getClientBaseUrl()).toBe("https://app.example.com");
  });

  it("strips trailing slash from NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com/";
    expect(getClientBaseUrl()).toBe("https://app.example.com");
  });

  it("falls back to NEXTAUTH_URL when no NEXT_PUBLIC_APP_URL", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXTAUTH_URL = "http://localhost:4000/";
    expect(getClientBaseUrl()).toBe("http://localhost:4000");
  });

  it("falls back to VERCEL_URL when no NEXTAUTH_URL", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    process.env.VERCEL_URL = "my-app.vercel.app";
    expect(getClientBaseUrl()).toBe("https://my-app.vercel.app");
  });

  it("returns localhost:3000 as final fallback", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;
    expect(getClientBaseUrl()).toBe("http://localhost:3000");
  });

  it("NEXT_PUBLIC_APP_URL takes priority over NEXTAUTH_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://primary.com";
    process.env.NEXTAUTH_URL = "https://secondary.com";
    expect(getClientBaseUrl()).toBe("https://primary.com");
  });
});
