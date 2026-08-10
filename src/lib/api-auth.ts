import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { hashToken } from "@/lib/token-service";
import type { NextRequest } from "next/server";

export interface ApiSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export async function apiAuth(request: NextRequest): Promise<ApiSession | null> {
  const webSession = await auth();
  if (webSession?.user?.id) {
    // session callback in auth.ts already refreshes role/isActive from the DB,
    // but apiAuth is a security boundary, so we verify isActive explicitly.
    if (webSession.user.isActive === false) {
      return null;
    }
    const role = ((webSession.user as unknown as Record<string, unknown>).role as string | undefined) ?? "USER";
    return {
      user: {
        id: webSession.user.id,
        email: webSession.user.email ?? "",
        name: webSession.user.name ?? null,
        role,
      },
    };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const apiToken = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });

  if (
    !apiToken ||
    apiToken.type !== "access" ||
    apiToken.revokedAt ||
    (apiToken.expiresAt && apiToken.expiresAt < new Date()) ||
    !apiToken.user.isActive
  ) {
    return null;
  }

  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    user: {
      id: apiToken.user.id,
      email: apiToken.user.email,
      name: apiToken.user.name,
      role: apiToken.user.role,
    },
  };
}
