/** Prisma where-clause guard for private event Server Component queries. */
export function privateEventAccessFilter(userId: string) {
  return {
    OR: [
      { createdById: userId },
      { invites: { some: { userId } } },
    ],
  };
}
