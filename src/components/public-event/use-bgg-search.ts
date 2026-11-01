"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BggCatalogItem } from "@/lib/bgg-catalog";

export type BggSearchState =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "results"; query: string; results: BggCatalogItem[] }
  | { kind: "empty"; query: string }
  | { kind: "error"; query: string; message: string; retryAfterSeconds: number };

export function useBggSearch(token: string, onStateConflict?: () => void | Promise<void>) {
  const [state, setState] = useState<BggSearchState>({ kind: "idle" });
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const activeQuery = useRef<string | null>(null);
  const lastQuery = useRef("");
  const retryAt = useRef(0);

  const reset = useCallback(() => {
    requestId.current += 1;
    controller.current?.abort();
    controller.current = null;
    activeQuery.current = null;
    retryAt.current = 0;
    setRetryAfterSeconds(0);
    lastQuery.current = "";
    setState({ kind: "idle" });
  }, []);

  const search = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (query.length < 2 || query.length > 200 || activeQuery.current === query) return;

    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    activeQuery.current = query;
    const id = ++requestId.current;
    lastQuery.current = query;
    retryAt.current = 0;
    setRetryAfterSeconds(0);
    setState({ kind: "loading", query });

    try {
      const response = await fetch(
        `/api/public/event/${encodeURIComponent(token)}/bgg?query=${encodeURIComponent(query)}`,
        { signal: abortController.signal },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        if (response.status === 409) await onStateConflict?.();
        const seconds = response.status === 429
          ? Math.max(1, Number(response.headers.get("Retry-After")) || 1)
          : 0;
        retryAt.current = Date.now() + seconds * 1000;
        setRetryAfterSeconds(seconds);
        const apiError = Object.assign(new Error(data?.error ?? "Bitte versuche es erneut."), { retryAfterSeconds: seconds });
        apiError.name = "BggApiError";
        throw apiError;
      }
      const results = await response.json() as BggCatalogItem[];
      if (requestId.current !== id) return;
      setState(results.length ? { kind: "results", query, results } : { kind: "empty", query });
    } catch (error) {
      if (requestId.current !== id || abortController.signal.aborted) return;
      const failure = error as Error & { retryAfterSeconds?: number };
      setState({
        kind: "error",
        query,
        message: failure.name === "BggApiError" ? failure.message : "BoardGameGeek ist gerade nicht erreichbar. Bitte versuche es erneut.",
        retryAfterSeconds: failure.retryAfterSeconds ?? 0,
      });
    } finally {
      if (requestId.current === id) {
        controller.current = null;
        activeQuery.current = null;
      }
    }
  }, [onStateConflict, token]);

  const retry = useCallback(() => {
    if (Date.now() < retryAt.current) return;
    void search(lastQuery.current);
  }, [search]);

  useEffect(() => {
    if (!retryAfterSeconds) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1000));
      setRetryAfterSeconds(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  useEffect(() => {
    reset();
    return () => {
      controller.current?.abort();
      requestId.current += 1;
    };
  }, [reset, token]);

  return { state, search, retry, reset };
}
