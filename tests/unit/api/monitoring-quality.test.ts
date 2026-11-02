import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({admin:vi.fn(),exists:vi.fn(()=>true),readdir:vi.fn(()=>["2026-01-01.json"]),read:vi.fn(()=>JSON.stringify({date:"2026-01-01",overall:9,coverage:{statements:25,branches:24,functions:21,lines:25}}))}));
vi.mock("next/server",()=>({NextResponse:{json:(body:unknown,init?:ResponseInit)=>Response.json(body,init)}}));
vi.mock("fs",async(importOriginal)=>{const actual=await importOriginal<typeof import("fs")>();const mocked={...actual,existsSync:mocks.exists,readdirSync:mocks.readdir,readFileSync:mocks.read};return {...mocked,default:mocked};});
vi.mock("@/lib/require-auth",()=>({requireAdmin:mocks.admin,handleApiError:()=>Response.json({error:"Nicht erlaubt"},{status:403})}));
vi.mock("@/lib/api-logger",()=>({withApiLogging:(handler:unknown)=>handler}));
vi.mock("@/data/quality-metrics.json",()=>({default:{version:"0.50.65",measuredAt:"2026-11-02T14:00:00Z",coverage:{statements:60,branches:57,functions:65,lines:62},libraryCoverage:{statements:84,branches:81,functions:88,lines:84},tests:{total:1040,files:150,allPassing:true,apiRouteTests:100,byArea:[]}}}));
import { GET } from "@/app/api/admin/monitoring/quality/route";
const requestQuality = () => GET(new Request("http://localhost/api/admin/monitoring/quality") as NextRequest, {params:Promise.resolve({})});
describe("monitoring measurement source",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.admin.mockResolvedValue({userId:"admin"});});
 it("uses deployable measurements instead of old local review coverage and hardcoded test counts",async()=>{const response=await requestQuality();const data=await response.json();expect(data.coverage).toEqual({statements:60,branches:57,functions:65,lines:62});expect(data.libraryCoverage.branches).toBe(81);expect(data.coverageMeasuredAt).toBe("2026-11-02T14:00:00Z");expect(data.coverageVersion).toBe("0.50.65");expect(data.tests.total).toBe(1040);expect(data.previousCoverage).toBeNull();expect(data.historicalReviewVersion).toBe("0.39.1");expect(response.headers.get("Cache-Control")).toBe("private, no-store");});
 it("requires administrator access before returning measurements",async()=>{mocks.admin.mockRejectedValue(new Error("forbidden"));expect((await requestQuality()).status).toBe(403);expect(mocks.read).not.toHaveBeenCalled();});
});
