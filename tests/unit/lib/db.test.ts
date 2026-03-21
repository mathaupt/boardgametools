import { describe, it, expect, vi } from "vitest";

vi.mock("@prisma/client", () => {
  class MockPrismaClient {
    $connect = vi.fn();
    $disconnect = vi.fn();
  }
  return { PrismaClient: MockPrismaClient };
});

describe("db", () => {
  it("exports a prisma client instance", async () => {
    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
    expect(typeof prisma.$disconnect).toBe("function");
  });

  it("default export is same as named export", async () => {
    const mod = await import("@/lib/db");
    expect(mod.default).toBe(mod.prisma);
  });
});
