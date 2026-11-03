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

interface ActorStorage {
  key: string;
  hydrated: boolean;
  guest: GuestStorage | null;
  guestVerified: boolean;
  reauthRequired: boolean;
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
  reauthRequired: boolean;
  registerGuest: (guest: Pick<StoredGuestState, "id" | "nickname">) => void;
  persistGuestVotes: (votes: Set<string>) => void;
} {
  const storageKey = `${STORAGE_PREFIX}${token}`;
  const [storage, setStorage] = useState<ActorStorage>({
    key: storageKey,
    hydrated: false,
    guest: null,
    guestVerified: false,
    reauthRequired: false,
  });

  useEffect(() => {
    let active = true;
    if (user?.id) {
      setStorage({ key: storageKey, hydrated: true, guest: null, guestVerified: false, reauthRequired: false });
      return () => { active = false; };
    }

    let guest: GuestStorage | null = null;
    try {
      guest = parseGuestStorage(window.localStorage.getItem(storageKey));
    } catch {
      // Storage is optional; public participation still works in memory.
    }
    if (!guest) {
      setStorage({ key: storageKey, hydrated: true, guest: null, guestVerified: false, reauthRequired: false });
      return () => { active = false; };
    }

    setStorage({ key: storageKey, hydrated: false, guest: null, guestVerified: false, reauthRequired: false });
    void fetch(`/api/public/event/${encodeURIComponent(token)}/join?guestId=${encodeURIComponent(guest.id)}`, {
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error("Gastidentität konnte nicht geprüft werden.");
      const result = await response.json() as { authorized?: boolean };
      if (!active) return;
      if (result.authorized) {
        setStorage({ key: storageKey, hydrated: true, guest, guestVerified: true, reauthRequired: false });
        return;
      }
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Removing stale local identity is best-effort; API writes still require proof.
      }
      setStorage({ key: storageKey, hydrated: true, guest: null, guestVerified: false, reauthRequired: true });
    }).catch(() => {
      if (active) setStorage({ key: storageKey, hydrated: true, guest: null, guestVerified: false, reauthRequired: true });
    });
    return () => { active = false; };
  }, [storageKey, token, user?.id]);

  const currentStorage = storage.key === storageKey ? storage : {
    key: storageKey, hydrated: false, guest: null, guestVerified: false, reauthRequired: false,
  };
  const actor = useMemo(() => resolvePublicActor({
    user,
    hydrated: currentStorage.hydrated,
    storedGuest: currentStorage.guestVerified ? currentStorage.guest : null,
    guests,
  }), [currentStorage.guest, currentStorage.guestVerified, currentStorage.hydrated, guests, user]);

  const proposalSet = useMemo(() => new Set(proposalIds), [proposalIds]);
  const guestVotes = useMemo(() => actor.kind === "guest" && currentStorage.guestVerified
    ? new Set((currentStorage.guest?.votes ?? []).filter((id) => proposalSet.has(id)))
    : new Set<string>(), [actor.kind, currentStorage.guest?.votes, currentStorage.guestVerified, proposalSet]);

  const writeStorage = useCallback((guest: GuestStorage) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(guest));
    } catch {
      // A full or disabled storage must not block the current in-memory session.
    }
  }, [storageKey]);

  const registerGuest = useCallback((guest: Pick<StoredGuestState, "id" | "nickname">) => {
    const next = { ...guest, votes: [] };
    setStorage({ key: storageKey, hydrated: true, guest: next, guestVerified: true, reauthRequired: false });
    writeStorage(next);
  }, [storageKey, writeStorage]);

  const persistGuestVotes = useCallback((votes: Set<string>) => {
    if (actor.kind !== "guest" || !currentStorage.guestVerified || !currentStorage.guest || currentStorage.guest.id !== actor.guestId) return;
    const next = { ...currentStorage.guest, votes: Array.from(votes).filter((id) => proposalSet.has(id)) };
    setStorage({ key: storageKey, hydrated: true, guest: next, guestVerified: true, reauthRequired: false });
    writeStorage(next);
  }, [actor, currentStorage.guest, currentStorage.guestVerified, proposalSet, storageKey, writeStorage]);

  return { actor, guestVotes, reauthRequired: currentStorage.reauthRequired, registerGuest, persistGuestVotes };
}
