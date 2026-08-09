import { randomBytes, createHash } from "crypto";
import prisma from "@/lib/db";

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export function generatePlainToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createTokenPair(userId: string, name = "iOS App"): Promise<TokenPair> {
  const accessPlain = generatePlainToken();
  const refreshPlain = generatePlainToken();
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.apiToken.create({
      data: {
        userId,
        type: "access",
        name,
        tokenHash: hashToken(accessPlain),
        expiresAt,
      },
    }),
    prisma.apiToken.create({
      data: {
        userId,
        type: "refresh",
        name,
        tokenHash: hashToken(refreshPlain),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    }),
  ]);

  return { accessToken: accessPlain, refreshToken: refreshPlain, expiresAt };
}

export async function rotateTokenPair(refreshPlain: string, name = "iOS App"): Promise<TokenPair | null> {
  const hash = hashToken(refreshPlain);
  const existing = await prisma.apiToken.findUnique({
    where: { tokenHash: hash },
  });

  if (
    !existing ||
    existing.type !== "refresh" ||
    existing.revokedAt ||
    (existing.expiresAt && existing.expiresAt < new Date())
  ) {
    return null;
  }

  await prisma.apiToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return createTokenPair(existing.userId, name);
}

export async function revokeToken(plain: string): Promise<void> {
  const hash = hashToken(plain);
  await prisma.apiToken.updateMany({
    where: { tokenHash: hash },
    data: { revokedAt: new Date() },
  });
}
