import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetClient, mockTransaction, mockExecuteRaw, mockQueryRaw } = vi.hoisted(() => ({
  mockGetClient: vi.fn(),
  mockTransaction: vi.fn(),
  mockExecuteRaw: vi.fn(),
  mockQueryRaw: vi.fn(),
}));

vi.mock("@/lib/health/readiness-prisma", () => ({ getReadinessPrisma: mockGetClient }));

import { probeDatabase } from "@/lib/health/database-probe";

describe("probeDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteRaw.mockResolvedValue(0);
    mockQueryRaw.mockResolvedValue([{ result: 1 }]);
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown, options: unknown) => {
      expect(options).toEqual({ maxWait: 1_000, timeout: 2_000 });
      return callback({ $executeRaw: mockExecuteRaw, $queryRaw: mockQueryRaw });
    });
    mockGetClient.mockResolvedValue({ $transaction: mockTransaction });
  });

  it("runs one bounded SELECT 1 probe in a short transaction", async () => {
    await expect(probeDatabase()).resolves.toEqual(expect.objectContaining({ status: "healthy" }));
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it("shares a concurrent probe and releases the flight after completion", async () => {
    let finish!: () => void;
    mockTransaction.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));

    const first = probeDatabase();
    const second = probeDatabase();
    expect(mockGetClient).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(mockTransaction).toHaveBeenCalledTimes(1));
    finish();
    await Promise.all([first, second]);

    await probeDatabase();
    expect(mockGetClient).toHaveBeenCalledTimes(2);
  });

  it("returns a generic unhealthy result on failure and permits a later recovery probe", async () => {
    mockTransaction.mockRejectedValueOnce(new Error("private connection details"));

    const failed = await probeDatabase();
    expect(failed.status).toBe("unhealthy");
    expect(JSON.stringify(failed)).not.toContain("private connection details");
    await expect(probeDatabase()).resolves.toEqual(expect.objectContaining({ status: "healthy" }));
  });
});
