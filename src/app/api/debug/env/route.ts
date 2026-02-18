import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing", 
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
    BGG_API_URL: process.env.BGG_API_URL ? "✅ Set" : "❌ Missing",
    BGG_AUTH_TOKEN: process.env.BGG_AUTH_TOKEN ? "✅ Set" : "❌ Missing",
    NODE_ENV: process.env.NODE_ENV || "development",
  };

  return NextResponse.json({
    environment: envVars,
    timestamp: new Date().toISOString(),
    note: "Sensitive values are not shown, only presence/absence"
  });
}
