import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

interface LogEntry {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  errorMessage?: string | null;
}

/**
 * Logs an API request to the database (fire-and-forget).
 * Call this at the end of your route handler.
 */
export async function logApiRequest(entry: LogEntry) {
  try {
    await prisma.apiLog.create({
      data: {
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        userId: entry.userId ?? null,
        userAgent: entry.userAgent?.substring(0, 500) ?? null,
        ip: entry.ip ?? null,
        errorMessage: entry.errorMessage?.substring(0, 1000) ?? null,
      },
    });
  } catch {
    // Logging should never break the API
    console.error("Failed to write API log");
  }
}

/**
 * Wraps an API route handler with automatic request logging.
 * Usage:
 *   export const GET = withApiLogging(async (req) => { ... return NextResponse.json(...) })
 */
type RouteHandlerContext = Record<string, unknown>;

export function withApiLogging<C extends RouteHandlerContext = RouteHandlerContext>(
  handler: (req: NextRequest, context: C) => Promise<NextResponse>
): (req: NextRequest, context: C) => Promise<NextResponse> {
  return async (req: NextRequest, context: C): Promise<NextResponse> => {
    const start = Date.now();
    const path = new URL(req.url).pathname;
    let session: { user?: { id?: string } } | null = null;

    try {
      session = await auth();
    } catch {
      // auth may fail for public routes, that's fine
    }

    let response: NextResponse;
    let errorMessage: string | null = null;

    try {
      response = await handler(req, context);
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Unknown error";
      response = NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const durationMs = Date.now() - start;

    // Fire-and-forget: don't await so we don't slow down the response
    logApiRequest({
      method: req.method,
      path,
      statusCode: response.status,
      durationMs,
      userId: session?.user?.id,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      errorMessage,
    }).catch(() => {});

    return response;
  };
}
