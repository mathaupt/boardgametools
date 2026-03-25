import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

/**
 * Require an authenticated session.
 * Throws ApiError(401) when no session exists.
 */
export async function requireAuth(): Promise<{ userId: string; role: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return {
    userId: session.user.id,
    role: (session.user as unknown as Record<string, unknown>).role as string ?? "USER",
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
  console.error("Unexpected error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
