"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { BGGGameData } from "@/lib/bgg-types";
import type { BggCatalogItem } from "@/lib/bgg-catalog";
import type { Proposal } from "./types";
import { BggCatalogDetail } from "./bgg-catalog-detail";
import { BggSearchResults } from "./bgg-search-results";
import { useBggSearch } from "./use-bgg-search";

interface BggGameSearchProps {
  token: string;
  activeGuestId: string | null;
  currentUserId: string | null;
  proposalOpen: boolean;
  onProposalAdded: (proposal: Proposal) => void;
  onStateConflict?: () => void | Promise<void>;
  onSessionExpired?: () => void;
}

export function BggGameSearch({ token, activeGuestId, currentUserId, proposalOpen, onProposalAdded, onStateConflict, onSessionExpired }: BggGameSearchProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<BGGGameData | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [proposing, setProposing] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);
  const detailId = useRef<string | null>(null);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const proposingRef = useRef(false);
  const { state, search, retry, reset } = useBggSearch(token, onStateConflict);
  const hasIdentity = Boolean(activeGuestId || currentUserId);

  useEffect(() => {
    setDetail(null);
    setDetailError(null);
    detailRequest.current?.abort();
    return () => detailRequest.current?.abort();
  }, [token]);

  const closeDetail = useCallback(() => {
    detailRequest.current?.abort();
    detailRequest.current = null;
    detailId.current = null;
    setDetail(null);
    setDetailError(null);
    setDetailLoadingId(null);
    const trigger = detailTrigger.current;
    if (trigger?.isConnected) trigger.focus();
    else inputRef.current?.focus();
  }, []);

  const loadDetail = useCallback(async (result: BggCatalogItem, trigger: HTMLButtonElement) => {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    detailId.current = result.bggId;
    detailTrigger.current = trigger;
    setDetail(null);
    setDetailError(null);
    setDetailLoadingId(result.bggId);
    try {
      const response = await fetch(`/api/public/event/${encodeURIComponent(token)}/bgg?bggId=${encodeURIComponent(result.bggId)}`, { signal: controller.signal });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        if (response.status === 409) await onStateConflict?.();
        if (response.status === 401 && currentUserId) onSessionExpired?.();
        const apiError = new Error(data?.error ?? "Bitte versuche es erneut.");
        apiError.name = "BggApiError";
        throw apiError;
      }
      const data = await response.json() as BGGGameData;
      if (detailId.current === result.bggId) setDetail(data);
    } catch (error) {
      if (controller.signal.aborted) return;
      const failure = error as Error;
      setDetailError(failure.name === "BggApiError" ? failure.message : "BoardGameGeek ist gerade nicht erreichbar. Bitte versuche es erneut.");
    } finally {
      if (detailId.current === result.bggId) setDetailLoadingId(null);
    }
  }, [currentUserId, onSessionExpired, onStateConflict, token]);

  const retryDetail = useCallback(() => {
    const id = detailId.current;
    if (!id) return;
    const result = state.kind === "results" ? state.results.find((item) => item.bggId === id) : null;
    if (result && detailTrigger.current) void loadDetail(result, detailTrigger.current);
  }, [loadDetail, state]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    detailRequest.current?.abort();
    setDetail(null);
    setDetailError(null);
    void search(query);
  };

  const handlePropose = async () => {
    if (!detail || !proposalOpen || !hasIdentity || proposingRef.current) return;
    proposingRef.current = true;
    setProposing(true);
    try {
      const response = await fetch(`/api/public/event/${encodeURIComponent(token)}/propose-bgg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bggId: detail.bggId, guestId: activeGuestId ?? undefined }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        if (response.status === 409) await onStateConflict?.();
        if (response.status === 409) throw new Error("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
        throw new Error(data?.error ?? "Vorschlag fehlgeschlagen.");
      }
      const proposal = await response.json() as Proposal;
      onProposalAdded(proposal);
      toast({ title: "Spiel vorgeschlagen!", description: `„${proposal.game.name}“ wurde zur Abstimmung hinzugefügt.` });
      closeDetail();
    } catch (error) {
      toast({ title: "Fehler beim Vorschlag", description: error instanceof Error ? error.message : "Bitte versuche es erneut.", variant: "destructive" });
    } finally {
      proposingRef.current = false;
      setProposing(false);
    }
  };

  return (
    <section aria-labelledby="bgg-search-title">
      <Card className="border-border/60 bg-background/70">
        <CardHeader>
          <CardTitle id="bgg-search-title" className="flex items-center gap-2 text-lg" as="h2">
            <Globe className="h-5 w-5" aria-hidden="true" />Spiel von BoardGameGeek vorschlagen
          </CardTitle>
          <CardDescription>Suche auf BoardGameGeek nach einem Spiel. Zum Vorschlagen brauchst du eine aktive Identität im Event.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasIdentity && <p className="rounded-lg border border-warning bg-warning/10 p-3 text-sm text-foreground">Du kannst Spiele suchen. Zum Vorschlagen tritt dem Event als Gast bei oder melde dich an.</p>}
          {!proposalOpen && <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">Für dieses Event sind keine neuen Vorschläge möglich.</p>}
          <form onSubmit={handleSearch} className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1 space-y-1">
              <label htmlFor="public-bgg-query" className="text-sm font-medium text-foreground">Spiel auf BoardGameGeek suchen</label>
              <Input
                ref={inputRef}
                id="public-bgg-query"
                name="query"
                type="search"
                value={query}
                maxLength={200}
                onChange={(event) => {
                  setQuery(event.target.value);
                  reset();
                  detailRequest.current?.abort();
                  setDetail(null);
                  setDetailError(null);
                }}
                aria-describedby="public-bgg-query-hint"
                className="min-h-11 bg-background"
                placeholder="z. B. Catan oder Azul"
              />
              <p id="public-bgg-query-hint" className="text-sm text-muted-foreground">Mindestens zwei Zeichen; die Suche startet erst nach dem Absenden.</p>
            </div>
            <Button type="submit" className="min-h-11 self-end" disabled={!proposalOpen || query.trim().length < 2 || (state.kind === "loading" && state.query === query.trim())}>
              {state.kind === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="mr-2 h-4 w-4" aria-hidden="true" />}
              Suchen
            </Button>
          </form>

          <div aria-busy={state.kind === "loading"} aria-live="polite" className="min-w-0 text-sm">
            {state.kind === "idle" && <p className="text-muted-foreground">Gib mindestens zwei Zeichen ein.</p>}
            {state.kind === "loading" && <p role="status">Suche nach „{state.query}“ läuft …</p>}
            {state.kind === "results" && <p role="status">{state.results.length} Ergebnis{state.results.length === 1 ? "" : "se"} für „{state.query}“ gefunden.</p>}
            {state.kind === "empty" && <p role="status">Keine Spiele für „{state.query}“ gefunden.</p>}
          </div>
          {state.kind === "error" && (
            <div role="alert" className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-destructive/40 p-3 text-sm">
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">Die Suche nach „{state.query}“ ist fehlgeschlagen: {state.message}</span>
              <Button type="button" variant="outline" className="min-h-11" onClick={retry} disabled={state.retryAfterSeconds > 0}>
                {state.retryAfterSeconds > 0 ? `Erneut versuchen in ${state.retryAfterSeconds} s` : "Erneut versuchen"}
              </Button>
            </div>
          )}
          {state.kind === "results" && !detail && (
            <BggSearchResults results={state.results} detailLoadingId={detailLoadingId} onShowDetails={(result, trigger) => void loadDetail(result, trigger)} />
          )}
          {(detail || detailLoadingId || detailError) && (
            <BggCatalogDetail
              detail={detail}
              loading={detailLoadingId !== null}
              error={detailError}
              canPropose={proposalOpen && hasIdentity}
              proposing={proposing}
              onRetry={retryDetail}
              onPropose={handlePropose}
              onClose={closeDetail}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
