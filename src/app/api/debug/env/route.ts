import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { Errors } from "@/lib/error-messages";

export async function GET() {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: Errors.NOT_AVAILABLE }, { status: 404 });
  }

  const envVars = {
    SQL_DATABASE_URL: env.DATABASE_URL ? "Set" : "Missing",
    NEXTAUTH_URL: env.NEXTAUTH_URL ? "Set" : "Missing",
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET ? "Set" : "Missing",
    BGG_API_URL: env.BGG_API_URL ? "Set" : "Missing",
    BGG_AUTH_TOKEN: env.BGG_AUTH_TOKEN ? "Set" : "Missing",
    NODE_ENV: env.NODE_ENV,
  };

  return NextResponse.json({
    environment: envVars,
    timestamp: new Date().toISOString(),
    note: "Only available in development mode"
  });
}
