import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { Errors } from "@/lib/error-messages";

export async function GET() {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: Errors.NOT_AVAILABLE }, { status: 404 });
  }

  const session = await auth();
  return NextResponse.json({
    session,
    hasRole: !!session?.user?.role,
    isAdmin: session?.user?.role === "ADMIN",
  });
}
