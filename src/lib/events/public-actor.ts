export type PublicActor =
  | { kind: "loading" }
  | { kind: "observer" }
  | { kind: "user"; userId: string; displayName: string | null }
  | { kind: "guest"; guestId: string; nickname: string };

export function resolvePublicActor(input: {
  user: { id: string; name: string | null } | null;
  hydrated: boolean;
  storedGuest: { id: string; nickname: string } | null;
  guests: readonly { id: string; nickname: string }[];
}): PublicActor {
  if (input.user?.id) {
    return { kind: "user", userId: input.user.id, displayName: input.user.name };
  }
  if (!input.hydrated) return { kind: "loading" };

  const guest = input.guests.find((item) => item.id === input.storedGuest?.id);
  return guest
    ? { kind: "guest", guestId: guest.id, nickname: guest.nickname }
    : { kind: "observer" };
}

export function resolveProposalAuthor(userId: string | null, guestId: string | null): {
  proposedById: string | null;
  guestId: string | null;
} {
  return userId
    ? { proposedById: userId, guestId: null }
    : { proposedById: null, guestId };
}
