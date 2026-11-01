"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { resolvePublicActor, type PublicActor } from "@/lib/events/public-actor";
import type { StoredGuestState } from "./types";

const STORAGE_PREFIX = "bgt-public-guest:";

interface PublicActorInput {
  token: string;
  user: { id: string; name: string | null } | null;
  guests: readonly { id: string; nickname: string }[];
  proposalIds: readonly string[];
}

interface GuestStorage {
  id: string;
  nickname: string;
  votes: string[];
}

function parseGuestStorage(raw: string | null): GuestStorage | null {
  if (!raw || raw.length > 16_384) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.id !== "string" || candidate.id.length < 1 || candidate.id.length > 100) return null;
    if (typeof candidate.nickname !== "string" || candidate.nickname.length < 1 || candidate.nickname.length > 80) return null;
    const votes = Array.isArray(candidate.votes)
      ? candidate.votes.filter((vote): vote is string => typeof vote === "string" && vote.length <= 100).slice(0, 500)
      : [];
    return { id: candidate.id, nickname: candidate.nickname, votes };
  } catch {
    return null;
  }
}

export function usePublicActor({ token, user, guests, proposalIds }: PublicActorInput): {
  actor: PublicActor;
  guestVotes: Set<string>;
  registerGuest: (guest: Pick<StoredGuestState, "id" | "nickname">) => void;
  persistGuestVotes: (votes: Set<string>) => void;
} {
  const storageKey = `${STORAGE_PREFIX}${token}`;
  const [storage, setStorage] = useState<{ key: string; hydrated: boolean; guest: GuestStorage | null }>({
    key: storageKey,
    hydrated: false,
    guest: null,
  });

  useEffect(() => {
    if (user?.id) {
      setStorage({ key: storageKey, hydrated: true, guest: null });
      return;
    }

    let guest: GuestStorage | null = null;
    try {
      guest = parseGuestStorage(window.localStorage.getItem(storageKey));
    } catch {
      // Storage is optional; public participation still works in memory.
    }
    setStorage({ key: storageKey, hydrated: true, guest });
  }, [storageKey, user?.id]);

  const currentStorage = storage.key === storageKey ? storage : { key: storageKey, hydrated: false, guest: null };
  const actor = useMemo(() => resolvePublicActor({
    user,
    hydrated: currentStorage.hydrated,
    storedGuest: currentStorage.guest,
    guests,
  }), [currentStorage.guest, currentStorage.hydrated, guests, user]);

  const proposalSet = useMemo(() => new Set(proposalIds), [proposalIds]);
  const guestVotes = useMemo(() => actor.kind === "guest"
    ? new Set((currentStorage.guest?.votes ?? []).filter((id) => proposalSet.has(id)))
    : new Set<string>(), [actor.kind, currentStorage.guest?.votes, proposalSet]);

  const writeStorage = useCallback((guest: GuestStorage) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(guest));
    } catch {
      // A full or disabled storage must not block the current in-memory session.
    }
  }, [storageKey]);

  const registerGuest = useCallback((guest: Pick<StoredGuestState, "id" | "nickname">) => {
    const next = { ...guest, votes: [] };
    setStorage({ key: storageKey, hydrated: true, guest: next });
    writeStorage(next);
  }, [storageKey, writeStorage]);

  const persistGuestVotes = useCallback((votes: Set<string>) => {
    if (actor.kind !== "guest" || !currentStorage.guest || currentStorage.guest.id !== actor.guestId) return;
    const next = { ...currentStorage.guest, votes: Array.from(votes).filter((id) => proposalSet.has(id)) };
    setStorage({ key: storageKey, hydrated: true, guest: next });
    writeStorage(next);
  }, [actor, currentStorage.guest, proposalSet, storageKey, writeStorage]);

  return { actor, guestVotes, registerGuest, persistGuestVotes };
}
