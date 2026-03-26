import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET() {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const session = await auth();
  return NextResponse.json({
    session,
    hasRole: !!session?.user?.role,
    isAdmin: session?.user?.role === "ADMIN",
  });
}
