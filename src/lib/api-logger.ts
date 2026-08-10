import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/require-auth";
import logger from "@/lib/logger";

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

const PUBLIC_PATH_PREFIXES = ["/api/public/", "/api/mobile/v1/public/", "/api/auth/", "/api/health"];

const SENSITIVE_PUBLIC_SEGMENTS: [string, number][] = [
  ["/api/public/event/", 4],
  ["/api/public/group/", 4],
  ["/api/public/invite/", 4],
  ["/api/mobile/v1/public/event/", 6],
  ["/api/mobile/v1/public/group/", 6],
  ["/api/mobile/v1/public/invite/", 6],
];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function sanitizePath(path: string): string {
  for (const [prefix, tokenIndex] of SENSITIVE_PUBLIC_SEGMENTS) {
    if (path.startsWith(prefix)) {
      const segments = path.split("/");
      if (segments.length > tokenIndex) {
        segments[tokenIndex] = "[redacted]";
      }
      return segments.join("/");
    }
  }
  return path;
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
    logger.error("Failed to write API log");
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
    const rawPath = new URL(req.url).pathname;
    const path = sanitizePath(rawPath);
    const isPublic = isPublicPath(rawPath);
    let session: { user?: { id?: string } } | null = null;

    // Only resolve the session for protected routes. Public routes (e.g. share
    // links, auth callbacks, health) should not trigger a DB lookup.
    if (!isPublic) {
      try {
        session = await auth();
      } catch {
        // auth may fail for public routes, that's fine
      }
    }

    let response: NextResponse;
    let logErrorMessage: string | null = null;

    try {
      response = await handler(req, context);
    } catch (err) {
      if (err instanceof ApiError) {
        response = NextResponse.json(
          { error: err.message },
          { status: err.statusCode }
        );
        logErrorMessage = err.message;
      } else {
        logger.error(err instanceof Error ? err : new Error(String(err)));
        response = NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
      }
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
      errorMessage: logErrorMessage,
    }).catch(() => {});

    return response;
  };
}
