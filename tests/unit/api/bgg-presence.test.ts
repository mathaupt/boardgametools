import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.auth, handleApiError: (e: Error & {statusCode?: number}) => Response.json({error: e.message}, {status: e.statusCode ?? 500}) }));
vi.mock("@/lib/db", () => ({default: {game: {findMany: mocks.find}}}));
vi.mock("@/lib/api-logger", () => ({withApiLogging: (fn: unknown) => fn}));
vi.mock("@/lib/rate-limit", () => ({checkRateLimitAsync: mocks.limit, rateLimitResponse: () => Response.json({error: "Zu viele Anfragen"}, {status: 429})}));
import { POST } from "@/app/api/games/bgg-presence/route";
const call = (body: unknown) => (POST as unknown as (r: Request) => Promise<Response>)(new Request("http://localhost/api/games/bgg-presence", {method: "POST", body: JSON.stringify(body)}));
describe("private BGG collection presence", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({userId: "owner"}); mocks.limit.mockResolvedValue({allowed: true}); mocks.find.mockResolvedValue([{id: "own", name: "Catan", bggId: "13"}]); });
  it("requires auth before any database access", async () => {
    mocks.auth.mockRejectedValue(Object.assign(new Error("Unauthorized"), {statusCode: 401}));
    expect((await call({bggIds: ["13"]})).status).toBe(401); expect(mocks.find).not.toHaveBeenCalled();
  });
  it("queries exact IDs of only active owned games and returns explicit absence without caching", async () => {
    const response = await call({bggIds: ["13", "42", "13"]});
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({matches: {"13": {id: "own", name: "Catan"}, "42": null}});
    expect(mocks.find).toHaveBeenCalledWith({where: {ownerId: "owner", deletedAt: null, bggId: {in: ["13", "42"]}}, select: {id: true, name: true, bggId: true}, orderBy: {id: "asc"}});
  });
  it.each([null, [], {}, {bggIds: []}, {bggIds: [13]}, {bggIds: ["13&evil"]}, {bggIds: Array(51).fill("13")}])("rejects invalid/unbounded input", async body => { expect((await call(body)).status).toBe(400); expect(mocks.find).not.toHaveBeenCalled(); });
  it("does not report a database failure as an absent game", async () => { mocks.find.mockRejectedValue(new Error("failed")); const response = await call({bggIds: ["13"]}); expect(response.status).toBe(500); expect(await response.json()).toEqual({error: "Die Sammlung konnte nicht geprüft werden."}); });
  it("limits reads before querying", async () => { mocks.limit.mockResolvedValue({allowed: false}); expect((await call({bggIds: ["13"]})).status).toBe(429); expect(mocks.find).not.toHaveBeenCalled(); });
  it("uses the first deterministic legacy match without exposing extra fields", async () => { mocks.find.mockResolvedValue([{id: "a", name: "Own", bggId: "13", secret: "hidden"}, {id: "b", name: "Duplicate", bggId: "13"}]); expect(await (await call({bggIds: ["13"]})).json()).toEqual({matches: {"13": {id: "a", name: "Own"}}}); });
});
