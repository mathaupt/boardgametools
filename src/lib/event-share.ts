import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { decryptId } from "@/lib/crypto";

type EventWithInclude<T extends Prisma.EventInclude | undefined> = Prisma.EventGetPayload<{
  include: T;
}>;

export async function findPublicEventByToken<T extends Prisma.EventInclude | undefined>(
  token: string,
  include?: T
): Promise<EventWithInclude<T> | null> {
  let eventId: string;

  try {
    eventId = decryptId(token);
  } catch (error) {
    return null;
  }

  return prisma.event.findFirst({
    where: {
      id: eventId,
      shareToken: token,
      isPublic: true,
    },
    include,
  }) as Promise<EventWithInclude<T> | null>;
}

export async function resolveEventIdFromToken(token: string) {
  let eventId: string;

  try {
    eventId = decryptId(token);
  } catch (error) {
    return null;
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      shareToken: token,
      isPublic: true,
    },
    select: { id: true },
  });

  return event?.id ?? null;
}
