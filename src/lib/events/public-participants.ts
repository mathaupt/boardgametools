import type { PublicGuest } from "@/lib/public-event";

export function upsertPublicGuest(items: readonly PublicGuest[], guest: PublicGuest): PublicGuest[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  byId.set(guest.id, guest);
  return Array.from(byId.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );
}
