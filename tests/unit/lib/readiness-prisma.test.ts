import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrismaClient, mockPrismaPg } = vi.hoisted(() => ({
  mockPrismaClient: vi.fn(),
  mockPrismaPg: vi.fn(),
}));

vi.mock("@/generated/prisma/client", () => ({ PrismaClient: mockPrismaClient }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: mockPrismaPg }));
vi.mock("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgresql://probe:test@127.0.0.1:5432/bgt_test_health?connection_limit=20&connect_timeout=15&pool_timeout=10&pgbouncer=true",
  },
}));

describe("getReadinessPrisma", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockPrismaClient.mockImplementation(function MockPrisma() {
      return { $transaction: vi.fn() };
    });
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { readinessPrisma?: unknown }).readinessPrisma;
  });

  it("creates no pool or client until a valid readiness request asks for one", async () => {
    const { getReadinessPrisma } = await import("@/lib/health/readiness-prisma");

    expect(mockPrismaPg).not.toHaveBeenCalled();
    expect(mockPrismaClient).not.toHaveBeenCalled();
    await getReadinessPrisma();

    expect(mockPrismaPg).toHaveBeenCalledWith({
      connectionString: "postgresql://probe:test@127.0.0.1:5432/bgt_test_health",
      max: 1,
      connectionTimeoutMillis: 1_000,
      idleTimeoutMillis: 1_000,
    });
    expect(mockPrismaClient).toHaveBeenCalledTimes(1);
  });

  it("reuses one client per process", async () => {
    const { getReadinessPrisma } = await import("@/lib/health/readiness-prisma");
    const first = await getReadinessPrisma();
    const second = await getReadinessPrisma();

    expect(second).toBe(first);
    expect(mockPrismaPg).toHaveBeenCalledTimes(1);
    expect(mockPrismaClient).toHaveBeenCalledTimes(1);
  });
});
