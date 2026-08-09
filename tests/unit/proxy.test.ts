import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn((handler: Function) => handler),
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
    const res = await proxy(req);
    expect(res).toBeUndefined();
  });
});
