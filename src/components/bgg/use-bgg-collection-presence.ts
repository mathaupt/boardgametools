"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface BggCollectionMatch { id: string; name: string }
type Presence = {key: string; status: "loading" | "ready" | "error"; matches: Record<string, BggCollectionMatch | null>};

export async function fetchBggCollectionPresence(bggIds: string[], signal?: AbortSignal) {
  if (bggIds.length === 0) return {};
  const response = await fetch("/api/games/bgg-presence", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({bggIds}), signal,
  });
  if (!response.ok) throw new Error("Die Sammlung konnte nicht geprüft werden.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("matches" in data) || !data.matches || typeof data.matches !== "object") {
    throw new Error("Die Sammlungsprüfung lieferte eine ungültige Antwort.");
  }
  const result = data.matches as Record<string, unknown>;
  if (bggIds.some(id => !(id in result) || (result[id] !== null && (!result[id] || typeof result[id] !== "object" || typeof (result[id] as {id?: unknown}).id !== "string" || typeof (result[id] as {name?: unknown}).name !== "string")))) {
    throw new Error("Die Sammlungsprüfung war unvollständig.");
  }
  return Object.fromEntries(bggIds.map(id => [id, result[id] as BggCollectionMatch | null]));
}

export function useBggCollectionPresence(bggIds: string[]) {
  const key = useMemo(() => [...new Set(bggIds)].sort().join(","), [bggIds]);
  const ids = useMemo(() => key ? key.split(",") : [], [key]);
  const [presence, setPresence] = useState<Presence>({key: "", status: "loading", matches: {}});
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!ids.length) { setPresence({key, status: "ready", matches: {}}); return; }
    const controller = new AbortController();
    setPresence({key, status: "loading", matches: {}});
    fetchBggCollectionPresence(ids, controller.signal).then(matches => {
      if (!controller.signal.aborted) setPresence({key, status: "ready", matches});
    }).catch(() => {
      if (!controller.signal.aborted) setPresence({key, status: "error", matches: {}});
    });
    return () => controller.abort();
  }, [key, revision, ids]);
  return {...presence, status: presence.key === key ? presence.status : "loading", retry};
}
