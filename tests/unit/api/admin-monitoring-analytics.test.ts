import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ admin: vi.fn(), count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn(), groupBy: vi.fn(), queryRaw: vi.fn(), error: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/require-auth", () => ({ requireAdmin: m.admin }));
vi.mock("@/lib/db", () => ({ default: { apiLog: { count: m.count, aggregate: m.aggregate, findMany: m.findMany, groupBy: m.groupBy }, $queryRaw: m.queryRaw } }));
vi.mock("@/lib/logger", () => ({ default: { error: m.error } }));
vi.mock("@/generated/prisma/client", () => ({ Prisma: { sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings: [...strings], values }) } }));
import { GET as anomaliesGET } from "@/app/api/admin/monitoring/anomalies/route";
import { GET as statsGET } from "@/app/api/admin/monitoring/stats/route";
beforeEach(() => { vi.clearAllMocks(); m.admin.mockResolvedValue({ userId: "admin" }); m.count.mockResolvedValue(0); m.aggregate.mockResolvedValue({ _avg: { durationMs: null } }); m.findMany.mockResolvedValue([]); m.groupBy.mockResolvedValue([]); m.queryRaw.mockResolvedValue([]); });
const req = (url = "http://local/api") => new Request(url) as never;

describe("Admin-Monitoring-Analytics", () => {
  it("erkennt Anomalien, normalisiert Zeiträume und begrenzt den Health-Score", async () => {
    m.count.mockResolvedValueOnce(100).mockResolvedValueOnce(20).mockResolvedValueOnce(25);
    m.queryRaw.mockResolvedValueOnce([{ path: "/slow", avg_duration: 2500.4, count: BigInt(1) }])
      .mockResolvedValueOnce([{ hour: new Date("2026-11-05T08:00:00Z"), error_count: BigInt(10) }, { hour: new Date("2026-11-05T09:00:00Z"), error_count: BigInt(1) }, { hour: new Date("2026-11-05T10:00:00Z"), error_count: BigInt(1) }, { hour: new Date("2026-11-05T11:00:00Z"), error_count: BigInt(1) }])
      .mockResolvedValueOnce([{ userId: "u1", userName: null, count: BigInt(101) }])
      .mockResolvedValueOnce([{ path: "/broken", count: BigInt(3), latest_error: "hidden internally" }]);
    const response = await anomaliesGET(req("http://local/api?period=7d")); const body = await response.json();
    expect(body.anomalies.map((a: { type: string }) => a.type)).toEqual(["error-rate", "slow-endpoint", "error-spike", "unusual-activity", "auth-failures", "server-errors"]);
    expect(body.healthScore).toBe(0); expect(body.anomalies[3].details.users[0].userName).toBe("Unbekannt");
    expect(body.anomalies[5].details.affectedPaths[0].latestError).toBe("hidden internally");
  });

  it("liefert bei leeren Daten keine Anomalien und verwendet den Standardzeitraum bei ungültigem Wert", async () => {
    const response = await anomaliesGET(req("http://local/api?period=tomorrow")); const body = await response.json();
    expect(body).toMatchObject({ anomalies: [], healthScore: 100 });
    expect(m.count.mock.calls[0][0].where.createdAt.gte).toBeInstanceOf(Date);
  });

  it("fasst Kennzahlen, P95, Zeitreihen, Endpunkte, Nutzer und Statuscodes zusammen", async () => {
    m.count.mockResolvedValueOnce(100).mockResolvedValueOnce(4);
    m.aggregate.mockResolvedValueOnce({ _avg: { durationMs: 123.6 } });
    m.groupBy.mockResolvedValueOnce([{ userId: "u1" }]).mockResolvedValueOnce([{ statusCode: 200, _count: { _all: 90 } }]).mockResolvedValueOnce([{ method: "GET", _count: { _all: 100 } }]);
    m.findMany.mockResolvedValueOnce([{ durationMs: 900 }]);
    m.queryRaw.mockResolvedValueOnce([{ hour: new Date("2026-11-05T09:00:00Z"), count: BigInt(100), errors: BigInt(4) }]).mockResolvedValueOnce([{ path: "/api/games", count: BigInt(30), avg_duration: 101.7, error_count: BigInt(2) }]).mockResolvedValueOnce([{ userId: "u1", userName: null, count: BigInt(30) }]);
    const response = await statsGET(req("http://local/api?period=1h")); const body = await response.json();
    expect(body.summary).toEqual({ totalRequests: 100, errorCount: 4, errorRate: 4, avgDurationMs: 124, p95DurationMs: 900, uniqueUsers: 1 });
    expect(body.topEndpoints[0]).toEqual({ path: "/api/games", count: 30, avgDurationMs: 102, errorCount: 2 });
    expect(body.topUsers[0].userName).toBe("Unbekannt"); expect(body.statusDistribution[0].count).toBe(90);
  });

  it("verarbeitet leere Statistiken und auth-/datenbankfehler generisch", async () => {
    const empty = await statsGET(req()); expect((await empty.json()).summary).toMatchObject({ totalRequests: 0, errorRate: 0, p95DurationMs: 0, avgDurationMs: 0 });
    m.admin.mockRejectedValueOnce(new Error("forbidden"));
    expect((await anomaliesGET(req())).status).toBe(500);
    m.admin.mockResolvedValueOnce({ userId: "admin" }); m.count.mockRejectedValueOnce(new Error("db"));
    const failed = await statsGET(req()); expect(failed.status).toBe(500); expect(await failed.json()).toEqual({ error: "Interner Serverfehler beim Abrufen der Statistiken" });
    expect(m.error).toHaveBeenCalled();
  });
});
