import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockHeadersGet = vi.fn();
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve({ get: mockHeadersGet })),
}));

import { getClientBaseUrl, getPublicBaseUrl } from "@/lib/public-link";

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

describe("getPublicBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockHeadersGet.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns NEXT_PUBLIC_APP_URL when set", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://my-app.example.com";
    expect(await getPublicBaseUrl()).toBe("https://my-app.example.com");
  });

  it("strips trailing slash from NEXT_PUBLIC_APP_URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://my-app.example.com/";
    expect(await getPublicBaseUrl()).toBe("https://my-app.example.com");
  });

  it("derives URL from Host header when no env var", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === "host") return "example.com";
      if (name === "x-forwarded-proto") return "https";
      return null;
    });
    expect(await getPublicBaseUrl()).toBe("https://example.com");
  });

  it("prefers x-forwarded-host over host", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === "x-forwarded-host") return "proxy.example.com";
      if (name === "host") return "internal.example.com";
      if (name === "x-forwarded-proto") return "https";
      return null;
    });
    expect(await getPublicBaseUrl()).toBe("https://proxy.example.com");
  });

  it("defaults to https when no x-forwarded-proto", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === "host") return "example.com";
      return null;
    });
    expect(await getPublicBaseUrl()).toBe("https://example.com");
  });

  it("falls back to NEXTAUTH_URL when headers() has no host", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXTAUTH_URL = "http://localhost:4000/";
    mockHeadersGet.mockReturnValue(null);
    expect(await getPublicBaseUrl()).toBe("http://localhost:4000");
  });

  it("falls back to VERCEL_URL", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    process.env.VERCEL_URL = "my-app.vercel.app";
    mockHeadersGet.mockReturnValue(null);
    expect(await getPublicBaseUrl()).toBe("https://my-app.vercel.app");
  });

  it("returns localhost:3000 as final fallback", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;
    mockHeadersGet.mockReturnValue(null);
    expect(await getPublicBaseUrl()).toBe("http://localhost:3000");
  });
});
