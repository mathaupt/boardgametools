import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { decryptId } from "@/lib/crypto";

type GroupWithInclude<T extends Prisma.GroupInclude | undefined> = Prisma.GroupGetPayload<{
  include: T;
}>;

export async function findPublicGroupByToken<T extends Prisma.GroupInclude | undefined>(
  token: string,
  include?: T
): Promise<GroupWithInclude<T> | null> {
  let groupId: string;

  try {
    groupId = decryptId(token);
  } catch {
    return null;
  }

  return prisma.group.findFirst({
    where: {
      id: groupId,
      shareToken: token,
      isPublic: true,
    },
    include,
  }) as Promise<GroupWithInclude<T> | null>;
}

export async function resolveGroupIdFromToken(token: string) {
  let groupId: string;

  try {
    groupId = decryptId(token);
  } catch {
    return null;
  }

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      shareToken: token,
      isPublic: true,
    },
    select: { id: true },
  });

  return group?.id ?? null;
}
