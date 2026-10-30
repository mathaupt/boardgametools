"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Info, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { VotingGameDetail } from "@/lib/voting/types";

interface ProposalGameDetailsProps {
  proposalId: string;
  name: string;
  eventId?: string;
  token?: string;
  titleClassName?: string;
  headingLevel?: 2 | 3;
}

export function ProposalGameDetails({
  proposalId,
  name,
  eventId,
  token,
  titleClassName,
  headingLevel = 3,
}: ProposalGameDetailsProps) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<VotingGameDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError(null);
    setDetail(null);

    const endpoint = token
      ? `/api/public/event/${encodeURIComponent(token)}/proposals/${encodeURIComponent(proposalId)}/game`
      : `/api/events/${encodeURIComponent(eventId ?? "")}/proposals/${encodeURIComponent(proposalId)}/game`;

    fetch(endpoint, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || (response.status === 404
            ? "Dieser Spielvorschlag ist nicht mehr verfügbar."
            : "Die Spieldetails konnten nicht geladen werden."));
        }
        return response.json() as Promise<VotingGameDetail>;
      })
      .then((data) => { if (current) setDetail(data); })
      .catch((reason: unknown) => {
        if (current && !(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Die Spieldetails konnten nicht geladen werden.");
        }
      })
      .finally(() => { if (current) setLoading(false); });

    return () => {
      current = false;
      controller.abort();
    };
  }, [open, proposalId, eventId, token, attempt]);

  const openDetails = (event: MouseEvent<HTMLButtonElement>) => {
    lastTriggerRef.current = event.currentTarget;
    setOpen(true);
  };
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <>
      <div className="min-w-0">
        <Heading className={titleClassName}>
          <button
            type="button"
            onClick={openDetails}
            aria-label={`Spielname: ${name} – Spieldetails öffnen`}
            className="rounded-sm text-left underline decoration-dotted underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {name}
          </button>
        </Heading>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="-ml-3 mt-1 min-h-11 px-3"
          onClick={openDetails}
          aria-label={`Spieldetails zu ${name} öffnen`}
        >
          <Info className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Spieldetails
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            lastTriggerRef.current?.focus();
          }}
        >
          <DialogHeader className="shrink-0 border-b border-border/60 px-6 pb-4 pt-6 pr-14 text-left">
            <DialogTitle className="text-xl leading-snug">{detail?.name ?? name}</DialogTitle>
            <DialogDescription>Spieldetails zum Vorschlag</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {loading && (
              <div className="flex min-h-40 items-center justify-center gap-3 text-muted-foreground" role="status">
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                Spieldetails werden geladen …
              </div>
            )}
            {!loading && error && (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                <p role="alert" className="max-w-md text-sm text-destructive">{error}</p>
                <Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Erneut versuchen
                </Button>
              </div>
            )}
            {!loading && detail && (
              <div className="grid gap-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="space-y-4">
                  {detail.imageUrl ? (
                    <Image
                      src={detail.imageUrl}
                      alt={`Cover von ${detail.name}`}
                      width={640}
                      height={640}
                      unoptimized
                      className="mx-auto max-h-80 w-full max-w-sm rounded-xl object-contain"
                    />
                  ) : (
                    <div className="flex h-48 w-full max-w-sm items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground sm:aspect-square sm:h-auto sm:max-h-72">
                      Kein Cover verfügbar
                    </div>
                  )}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {detail.minPlayers !== null && detail.maxPlayers !== null && (
                      <div><dt className="text-muted-foreground">Spieler</dt><dd className="font-medium">{detail.minPlayers}–{detail.maxPlayers}</dd></div>
                    )}
                    {detail.playTimeMinutes !== null && (
                      <div><dt className="text-muted-foreground">Spieldauer</dt><dd className="font-medium">{detail.playTimeMinutes} Min.</dd></div>
                    )}
                    {detail.complexity !== null && (
                      <div><dt className="text-muted-foreground">Komplexität</dt><dd className="font-medium">{detail.complexity} / 5</dd></div>
                    )}
                  </dl>
                </div>
                <div className="space-y-4">
                  {detail.description ? (
                    <section aria-labelledby="proposal-game-description">
                      <h3 id="proposal-game-description" className="mb-2 font-semibold">Beschreibung</h3>
                      <p className="whitespace-pre-line text-sm leading-6 text-foreground/85">{detail.description}</p>
                      {detail.descriptionSource === "bgg" && <p className="mt-2 text-xs text-muted-foreground">Beschreibung von BoardGameGeek</p>}
                    </section>
                  ) : (
                    <p className="text-sm text-muted-foreground">Für dieses Spiel ist keine Beschreibung verfügbar.</p>
                  )}
                  {detail.detailsUnavailable && (
                    <p className="text-sm text-muted-foreground" role="status">BoardGameGeek ist gerade nicht erreichbar. Die verfügbaren Spieldaten werden trotzdem angezeigt.</p>
                  )}
                  {detail.bggUrl && (
                    <a href={detail.bggUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Auf BoardGameGeek ansehen <span className="sr-only"> (öffnet in neuem Tab)</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
