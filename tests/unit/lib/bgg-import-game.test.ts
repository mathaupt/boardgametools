import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({transaction: vi.fn(), find: vi.fn(), create: vi.fn()}));
vi.mock("@/lib/db", () => ({default: {$transaction: mocks.transaction}}));
vi.mock("@/lib/require-auth", () => ({ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } }}));
import { createOrReuseBggGame } from "@/lib/bgg-import-game";
const data = {name: "Catan", minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60};
describe("serializable owned BGG import", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.find.mockResolvedValue(null); mocks.create.mockResolvedValue({id: "new"}); mocks.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({game: {findFirst: mocks.find, create: mocks.create}})); });
  it("reuses an active owned exact match unchanged", async () => {
    mocks.find.mockResolvedValue({id: "existing", name: "Custom title"});
    expect(await createOrReuseBggGame("owner", "13", data)).toEqual({game: {id: "existing", name: "Custom title"}, created: false});
    expect(mocks.find).toHaveBeenCalledWith({where: {ownerId: "owner", bggId: "13", deletedAt: null}, orderBy: {id: "asc"}}); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("checks and creates inside a serializable transaction with server-owned identity", async () => {
    expect(await createOrReuseBggGame("owner", "13", data)).toEqual({game: {id: "new"}, created: true});
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {isolationLevel: "Serializable"});
    expect(mocks.create).toHaveBeenCalledWith({data: {...data, ownerId: "owner", bggId: "13"}});
  });
  it("rechecks after a concurrent transaction won instead of duplicating", async () => {
    mocks.transaction.mockRejectedValueOnce({code: "P2034"}); mocks.find.mockResolvedValue({id: "winner"});
    expect((await createOrReuseBggGame("owner", "13", data)).created).toBe(false); expect(mocks.transaction).toHaveBeenCalledTimes(2); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("bounds contention retries and returns a retryable failure", async () => {
    mocks.transaction.mockRejectedValue({code: "P2034"});
    await expect(createOrReuseBggGame("owner", "13", data)).rejects.toMatchObject({statusCode: 503}); expect(mocks.transaction).toHaveBeenCalledTimes(3);
  });
  it("does not retry unrelated failures", async () => { mocks.transaction.mockRejectedValue(new Error("database offline")); await expect(createOrReuseBggGame("owner", "13", data)).rejects.toThrow("database offline"); expect(mocks.transaction).toHaveBeenCalledTimes(1); });
});
