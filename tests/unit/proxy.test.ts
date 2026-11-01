import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockAuthMiddleware } = vi.hoisted(() => ({ mockAuthMiddleware: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn((handler: (req: NextRequest) => unknown) => (req: NextRequest) => {
    mockAuthMiddleware(req);
    return handler(req);
  }),
}));

import { proxy } from "@/proxy";

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips CSRF for API mobile mutation with Bearer token", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/v1/games", {
      method: "POST",
      headers: { authorization: "Bearer token123" },
    });
    (req as any).auth = null;
    const res = await (proxy as unknown as (req: NextRequest) => Promise<unknown>)(req);
    expect(res).toBeUndefined();
  });

  it("allows public access to /api/health", async () => {
    const req = new NextRequest("http://localhost:3000/api/health", {
      method: "GET",
    });
    (req as any).auth = null;
    const res = await (proxy as unknown as (req: NextRequest) => Promise<unknown>)(req);
    expect(res).toBeUndefined();
    expect(mockAuthMiddleware).not.toHaveBeenCalled();
  });

  it("bypasses session resolution for token-protected readiness", async () => {
    const req = new NextRequest("http://localhost:3000/api/health/ready", { method: "GET" });
    const res = await (proxy as unknown as (req: NextRequest) => Promise<unknown>)(req);

    expect(res).toBeUndefined();
    expect(mockAuthMiddleware).not.toHaveBeenCalled();
  });

  it("does not exempt similarly named health routes", async () => {
    const req = new NextRequest("http://localhost:3000/api/health-check", { method: "GET" });
    await (proxy as unknown as (req: NextRequest) => Promise<unknown>)(req);

    expect(mockAuthMiddleware).toHaveBeenCalledTimes(1);
  });
});
