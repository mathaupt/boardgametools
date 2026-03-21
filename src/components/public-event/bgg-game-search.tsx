"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  Search,
  X,
  Globe,
  ExternalLink,
  Gamepad2,
} from "lucide-react";
import type { Proposal } from "./types";

interface BggSearchResult {
  bggId: string;
  name: string;
  yearPublished?: string;
  type?: string;
  imageUrl?: string;
}

interface BggGameDetail {
  bggId: string;
  name: string;
  imageUrl?: string;
  minPlayers?: string;
  maxPlayers?: string;
  playTimeMinutes?: string;
  complexity?: string;
  rating?: string;
  description?: string;
}

interface BggGameSearchProps {
  token: string;
  activeGuestId: string | null;
  currentUserId: string | null;
  onProposalAdded: (proposal: Proposal) => void;
}

export function BggGameSearch({
  token,
  activeGuestId,
  currentUserId,
  onProposalAdded,
}: BggGameSearchProps) {
  const { toast } = useToast();
  const [bggQuery, setBggQuery] = useState("");
  const [bggResults, setBggResults] = useState<BggSearchResult[]>([]);
  const [bggLoading, setBggLoading] = useState(false);
  const [bggDetail, setBggDetail] = useState<BggGameDetail | null>(null);
  const [bggDetailLoading, setBggDetailLoading] = useState<string | null>(null);
  const [bggProposing, setBggProposing] = useState(false);

  const handleBggSearch = async () => {
    const q = bggQuery.trim();
    if (q.length < 2) {
      toast({ title: "Suchbegriff zu kurz", description: "Bitte mindestens 2 Zeichen eingeben.", variant: "destructive" });
      return;
    }
    setBggLoading(true);
    setBggResults([]);
    setBggDetail(null);
    try {
      const res = await fetch(`/api/bgg?query=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("BGG-Suche fehlgeschlagen");
      const data: BggSearchResult[] = await res.json();
      setBggResults(data.slice(0, 20));
    } catch (error) {
      console.error("BGG search error", error);
      toast({
        title: "BGG-Suche fehlgeschlagen",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setBggLoading(false);
    }
  };

  const handleBggDetail = async (bggId: string) => {
    if (bggDetailLoading) return;
    setBggDetailLoading(bggId);
    try {
      const res = await fetch(`/api/bgg?bggId=${encodeURIComponent(bggId)}`);
      if (!res.ok) throw new Error("BGG-Details konnten nicht geladen werden");
      const data: BggGameDetail = await res.json();
      setBggDetail(data);
    } catch (error) {
      console.error("BGG detail error", error);
      toast({
        title: "Details laden fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setBggDetailLoading(null);
    }
  };

  const handleBggPropose = async (bggId: string) => {
    if (!activeGuestId && !currentUserId) {
      toast({
        title: "Bitte zuerst registrieren",
        description: "Registriere dich als Gast oder logge dich ein, um Spiele vorzuschlagen.",
        variant: "destructive",
      });
      return;
    }
    setBggProposing(true);
    try {
      const res = await fetch(`/api/public/event/${token}/propose-bgg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bggId,
          guestId: activeGuestId ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Vorschlag fehlgeschlagen");
      }
      const proposal: Proposal = await res.json();
      onProposalAdded(proposal);
      setBggDetail(null);
      toast({ title: "Spiel vorgeschlagen!", description: `"${proposal.game.name}" wurde zur Abstimmung hinzugefügt.` });
    } catch (error) {
      console.error("BGG propose error", error);
      toast({
        title: "Fehler beim Vorschlag",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setBggProposing(false);
    }
  };

  return (
    <section>
      <Card className="border-border/60 bg-background/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Spiel von BoardGameGeek vorschlagen
          </CardTitle>
          <CardDescription>
            Suche auf BoardGameGeek nach einem Spiel und schlage es direkt vor &ndash; ohne Account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeGuestId && !currentUserId && (
            <div className="rounded-lg border border-warning bg-warning/10 p-3 text-sm text-muted-foreground">
              Bitte registriere dich oben als Gast, um Spiele vorschlagen zu können.
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Spielname eingeben (z.B. Catan, Azul, ...)"
              value={bggQuery}
              onChange={(e) => setBggQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBggSearch()}
              className="bg-background"
              disabled={bggLoading}
            />
            <Button
              onClick={handleBggSearch}
              disabled={bggLoading || bggQuery.trim().length < 2}
            >
              {bggLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {bggLoading ? "Suche..." : "BGG Suchen"}
            </Button>
          </div>

          {/* BGG Detail View */}
          {bggDetail && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex gap-4">
                {bggDetail.imageUrl && (
                  <Image
                    src={bggDetail.imageUrl}
                    alt={bggDetail.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">{bggDetail.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    {bggDetail.minPlayers && bggDetail.maxPlayers && (
                      <span>{bggDetail.minPlayers}-{bggDetail.maxPlayers} Spieler</span>
                    )}
                    {bggDetail.playTimeMinutes && <span>• {bggDetail.playTimeMinutes} Min.</span>}
                    {bggDetail.complexity && (
                      <span>• Komplexität: {parseFloat(bggDetail.complexity).toFixed(1)}/5</span>
                    )}
                    {bggDetail.rating && (
                      <span>• Rating: {parseFloat(bggDetail.rating).toFixed(1)}/10</span>
                    )}
                  </div>
                  {bggDetail.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {bggDetail.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBggPropose(bggDetail.bggId)}
                  disabled={bggProposing || (!activeGuestId && !currentUserId)}
                  className="flex-1"
                >
                  {bggProposing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {bggProposing ? "Wird vorgeschlagen..." : "Vorschlagen"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBggDetail(null)}
                  title="Schließen"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  title="Auf BGG ansehen"
                >
                  <a
                    href={`https://boardgamegeek.com/boardgame/${bggDetail.bggId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* BGG Search Results */}
          {bggResults.length > 0 && !bggDetail && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground">
                {bggResults.length} Ergebnis{bggResults.length !== 1 ? "se" : ""} gefunden
              </p>
              {bggResults.map((result) => (
                <div
                  key={result.bggId}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2"
                >
                  <div className="flex-shrink-0">
                    {result.imageUrl ? (
                      <Image
                        src={result.imageUrl}
                        alt={result.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted/40">
                        <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {result.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.yearPublished ? `(${result.yearPublished})` : ""} BGG #{result.bggId}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 ml-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleBggDetail(result.bggId)}
                      disabled={bggDetailLoading === result.bggId}
                      title="Details anzeigen"
                      className="h-8 w-8 sm:h-8 sm:w-auto sm:px-3"
                    >
                      {bggDetailLoading === result.bggId ? (
                        <Loader2 className="h-4 w-4 animate-spin sm:mr-1 sm:h-3 sm:w-3" />
                      ) : (
                        <Search className="h-4 w-4 sm:mr-1 sm:h-3 sm:w-3" />
                      )}
                      <span className="hidden sm:inline text-xs">Details</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleBggPropose(result.bggId)}
                      disabled={bggProposing || (!activeGuestId && !currentUserId)}
                      title="Spiel vorschlagen"
                      className="h-8 w-8 sm:h-8 sm:w-auto sm:px-3"
                    >
                      {bggProposing ? (
                        <Loader2 className="h-4 w-4 animate-spin sm:mr-1 sm:h-3 sm:w-3" />
                      ) : (
                        <Plus className="h-4 w-4 sm:mr-1 sm:h-3 sm:w-3" />
                      )}
                      <span className="hidden sm:inline text-xs">Vorschlagen</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {bggResults.length === 0 && !bggLoading && bggQuery.trim().length >= 2 && !bggDetail && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Ergebnisse gefunden. Versuche einen anderen Suchbegriff.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
