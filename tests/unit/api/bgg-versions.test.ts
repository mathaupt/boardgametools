import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(()=>({auth:vi.fn(),versions:vi.fn(),limit:vi.fn()}));
vi.mock("@/lib/require-auth",()=>({requireAuth:mocks.auth,handleApiError:(e:Error & {statusCode?:number})=>Response.json({error:e.message},{status:e.statusCode??500})}));
vi.mock("@/lib/api-logger",()=>({withApiLogging:(handler:unknown)=>handler}));
vi.mock("@/lib/bgg-versions",()=>({getGermanBggVersions:mocks.versions,isBggIdentifier:(id:unknown)=>typeof id==="string"&&/^[1-9]\d{0,11}$/.test(id)}));
vi.mock("@/lib/rate-limit",()=>({checkRateLimitAsync:mocks.limit,rateLimitResponse:()=>Response.json({error:"Zu viele Anfragen"},{status:429})}));
import { BggTransportError } from "@/lib/bgg-fetch";
import { GET } from "@/app/api/bgg/[id]/versions/route";
const call = (id="13") => (GET as unknown as (req:Request,ctx:{params:Promise<{id:string}>})=>Promise<Response>)(new Request(`http://localhost/api/bgg/${id}/versions`),{params:Promise.resolve({id})});
describe("BGG versions API",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({userId:"u1"});mocks.limit.mockResolvedValue({allowed:true});mocks.versions.mockResolvedValue([]);});
 it("requires authentication before contacting the provider",async()=>{mocks.auth.mockRejectedValue(Object.assign(new Error("Unauthorized"),{statusCode:401}));expect((await call()).status).toBe(401);expect(mocks.versions).not.toHaveBeenCalled();});
 it("validates bounded numeric IDs",async()=>{expect((await call("13evil")).status).toBe(400);expect(mocks.versions).not.toHaveBeenCalled();});
 it("rate limits each account",async()=>{mocks.limit.mockResolvedValue({allowed:false});expect((await call()).status).toBe(429);expect(mocks.versions).not.toHaveBeenCalled();});
 it("returns an explicit empty edition list with private cache policy",async()=>{const res=await call();expect(await res.json()).toEqual([]);expect(res.headers.get("cache-control")).toContain("private");expect(mocks.versions).toHaveBeenCalledWith("13",expect.any(AbortSignal));});
 it("returns multiple editions without adding provider credentials",async()=>{const editions=[{versionId:"101",name:"Edition A"},{versionId:"102",name:"Edition B"}];mocks.versions.mockResolvedValue(editions);expect(await (await call()).json()).toEqual(editions);});
 it.each([503,504] as const)("preserves provider failure status %s",async status=>{mocks.versions.mockRejectedValue(new BggTransportError(status,"BGG nicht verfügbar"));const res=await call();expect(res.status).toBe(status);expect(await res.json()).toEqual({error:"BGG nicht verfügbar"});});
});
