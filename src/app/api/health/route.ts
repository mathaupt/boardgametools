import { NextResponse } from "next/server";
import { getAppVersion } from "@/lib/app-version";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    check: "liveness",
    status: "healthy",
    version: getAppVersion(),
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
