import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockVersion } = vi.hoisted(() => ({ mockVersion: vi.fn(() => "0.50.42-test") }));
vi.mock("@/lib/app-version", () => ({ getAppVersion: mockVersion }));
vi.mock("@/lib/db", () => ({ default: { $queryRaw: vi.fn(), apiLog: { create: vi.fn() } } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { GET } from "@/app/api/health/route";

describe("GET /api/health liveness", () => {
  it("answers parallel probes without DB, session, Redis, or ApiLog work", async () => {
    const requests = Array.from({ length: 100 }, (_, index) => new NextRequest("http://localhost/api/health", {
      headers: index % 2 === 0 ? { cookie: "authjs.session-token=fake-session" } : undefined,
    }));
    const responses = await Promise.all(requests.map(() => GET()));

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.apiLog.create).not.toHaveBeenCalled();
    expect(auth).not.toHaveBeenCalled();
    const body = await responses[0].json();
    expect(body).toEqual({ check: "liveness", status: "healthy", version: "0.50.42-test", timestamp: expect.any(String) });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(responses[0].headers.get("cache-control")).toBe("no-store");
    expect(body).not.toHaveProperty("database");
    expect(body).not.toHaveProperty("memory");
    expect(body).not.toHaveProperty("environment");
  });
});
