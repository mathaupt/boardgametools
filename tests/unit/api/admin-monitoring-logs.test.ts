import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), findMany: vi.fn(), count: vi.fn(), deleteMany: vi.fn(), error: vi.fn() }));
vi.mock("@/lib/require-auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/db", () => ({ default: { apiLog: { findMany: mocks.findMany, count: mocks.count, deleteMany: mocks.deleteMany } } }));
vi.mock("@/lib/logger", () => ({ default: { error: mocks.error } }));
import { GET, DELETE } from "@/app/api/admin/monitoring/logs/route";
beforeEach(() => { vi.clearAllMocks(); mocks.admin.mockResolvedValue({ userId: "admin" }); mocks.findMany.mockResolvedValue([]); mocks.count.mockResolvedValue(0); mocks.deleteMany.mockResolvedValue({ count: 3 }); });

describe("Admin-Monitoring-Logs", () => {
  it("liefert paginierte Logs und normalisiert ungültige Limits", async () => {
    const response = await GET(new Request("http://local/api/admin/monitoring/logs?page=0&limit=999&method=post&path=events&statusCode=500&userId=u&from=bad&to=2026-11-01") as never);
    expect(response.status).toBe(200);
    const options = mocks.findMany.mock.calls[0][0];
    expect(options.skip).toBe(0); expect(options.take).toBe(200);
    expect(options.where).toMatchObject({ method: "POST", path: { contains: "events", mode: "insensitive" }, statusCode: 500, userId: "u", createdAt: { lte: expect.any(Date) } });
  });

  it("ignoriert ungültige Status- und Datumsfilter und berechnet leere Seiten", async () => {
    mocks.count.mockResolvedValue(11);
    const response = await GET(new Request("http://local/api?limit=0&statusCode=oops&from=bad&to=also-bad") as never);
    const body = await response.json();
    expect(body).toMatchObject({ page: 1, limit: 1, totalPages: 11 });
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({});
  });

  it("verlangt Adminrechte und gibt Datenbankfehler ohne Details zurück", async () => {
    mocks.admin.mockRejectedValueOnce(new Error("forbidden"));
    expect((await GET(new Request("http://local/api") as never)).status).toBe(500);
    mocks.admin.mockResolvedValueOnce({ userId: "admin" }); mocks.findMany.mockRejectedValueOnce(new Error("db"));
    const response = await GET(new Request("http://local/api") as never);
    expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "Interner Serverfehler beim Abrufen der Logs" });
  });

  it("löscht nur ab sieben Tagen und meldet Datenbankfehler generisch", async () => {
    const invalid = await DELETE(new Request("http://local/api", { method: "DELETE", body: JSON.stringify({ olderThanDays: 6 }) }) as never);
    expect(invalid.status).toBe(400);
    const valid = await DELETE(new Request("http://local/api", { method: "DELETE", body: JSON.stringify({ olderThanDays: 30 }) }) as never);
    expect(await valid.json()).toEqual({ deleted: 3 }); expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { createdAt: { lt: expect.any(Date) } } });
    mocks.deleteMany.mockRejectedValueOnce(new Error("db"));
    expect((await DELETE(new Request("http://local/api", { method: "DELETE", body: JSON.stringify({ olderThanDays: 7 }) }) as never)).status).toBe(500);
  });
});
