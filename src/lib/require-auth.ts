import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";

/**
 * Typed API error with HTTP status code.
 * Thrown by service layer, caught by route handlers via handleApiError.
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Auth result with user metadata for route handlers that need name/email */
export interface AuthResult {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
}

/**
 * Require an authenticated session.
 * Throws ApiError(401) when no session exists.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  const user = session.user as unknown as Record<string, unknown>;
  return {
    userId: session.user.id,
    role: (user.role as string) ?? "USER",
    name: (session.user.name as string) ?? null,
    email: (session.user.email as string) ?? null,
  };
}

/**
 * Require an admin session.
 * Throws ApiError(403) when user is not ADMIN.
 */
export async function requireAdmin(): Promise<{ userId: string; role: string }> {
  const { userId, role } = await requireAuth();
  if (role !== "ADMIN") {
    throw new ApiError(403, "Forbidden");
  }
  return { userId, role };
}

/**
 * Converts any error to a NextResponse.
 * ApiError -> typed JSON, anything else -> 500.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  logger.error({ err: error }, "Unexpected error");
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
