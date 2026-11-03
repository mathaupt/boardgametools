"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Search, Plus, Loader2, Users, Clock, ExternalLink, ScanBarcode } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { SeriesBggSearch, type BGGSearchResult } from "./series-bgg-search";
import type { AddSeriesGameInput } from "./types";
import { useSeriesGameAdd } from "./use-series-game-add";
import { gameTextForRead } from "@/lib/game-text";
import { useBggCollectionPresence, fetchBggCollectionPresence } from "@/components/bgg/use-bgg-collection-presence";

interface CollectionGame {
  id: string;
  name: string;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  bggId: string | null;
}


interface AddGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  existingGameIds: string[];
  onGameAdded: (input: AddSeriesGameInput) => void | Promise<void>;
}

export function AddGameDialog({
  open,
  onOpenChange,
  seriesId,
  existingGameIds,
  onGameAdded,
}: AddGameDialogProps) {
  const [tab, setTab] = useState<"collection" | "bgg">("collection");
  const [games, setGames] = useState<CollectionGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [search, setSearch] = useState("");
  const [bggSearch, setBggSearch] = useState("");
  const [bggResults, setBggResults] = useState<BGGSearchResult[]>([]);
  const [bggSearching, setBggSearching] = useState(false);
  const presence = useBggCollectionPresence(bggResults.map(result => result.bggId));
  const { adding, error, clearError, addGame } = useSeriesGameAdd(seriesId, onGameAdded);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [presenceError, setPresenceError] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    setLoadingGames(true);
    const res = await fetch("/api/games");
    if (res.ok) {
      setGames(await res.json());
    }
    setLoadingGames(false);
  }, []);

  useEffect(() => {
    if (open) {
      loadGames();
      clearError();
      setSearch("");
      setBggSearch("");
      setBggResults([]);
      setTab("collection");
    }
  }, [open, loadGames, clearError]);

  async function handleSearchBGG() {
    if (bggSearch.length < 2) return;
    setBggSearching(true);
    try {
      const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(bggSearch)}`);
      if (res.ok) {
        setBggResults(await res.json());
      }
    } catch {
      // ignore
    }
    setBggSearching(false);
  }

  const handleAddFromCollection = (gameId: string) => addGame({ gameId });
  const handleAddFromBGG = async (bggId: string) => {
    setPresenceError(null);
    try {
      const checked = await fetchBggCollectionPresence([bggId]);
      const match = checked[bggId];
      await addGame(match ? {gameId: match.id} : {bggId});
    } catch {
      setPresenceError("Sammlung konnte nicht geprüft werden. Bitte versuche es erneut.");
      presence.retry();
    }
  };

  async function handleBarcodeGameSelected(bggId: string, _ean: string) {
    setBarcodeScannerOpen(false);
    await handleAddFromBGG(bggId);
  }

  function handleLocalGameFound(gameId: string) {
    setBarcodeScannerOpen(false);
    handleAddFromCollection(gameId);
  }

  const filteredGames = games.filter(
    (g) =>
      !existingGameIds.includes(g.id) &&
      g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block w-[calc(100%_-_2rem)] min-w-0 max-w-lg max-h-[85dvh] space-y-4 overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="pr-6 [overflow-wrap:anywhere]">Spiel hinzufügen</DialogTitle>
          <DialogDescription>
            Wähle ein Spiel aus deiner Sammlung oder importiere eins von BoardGameGeek.
          </DialogDescription>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 flex h-auto min-h-11 min-w-0 items-center gap-2 whitespace-normal py-2"
            onClick={() => setBarcodeScannerOpen(true)}
          >
            <ScanBarcode className="h-4 w-4" aria-hidden="true" />
            Barcode scannen
          </Button>
        </DialogHeader>

        {presenceError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{presenceError}</p>}
        {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        {/* Tab navigation */}
        <div className="flex flex-wrap border-b -mx-1" role="tablist">
          <Button
            type="button"
            variant="ghost"
            className={`min-w-0 flex-1 whitespace-normal rounded-none border-b-2 px-4 py-2.5 h-auto text-sm font-medium transition-colors ${
              tab === "collection"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("collection")}
            role="tab"
            aria-selected={tab === "collection"}
            aria-label="Aus Sammlung"
          >
            Aus Sammlung
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`min-w-0 flex-1 whitespace-normal rounded-none border-b-2 px-4 py-2.5 h-auto text-sm font-medium transition-colors gap-1.5 ${
              tab === "bgg"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("bgg")}
            role="tab"
            aria-selected={tab === "bgg"}
            aria-label="BGG Import"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            BGG Import
          </Button>
        </div>

        {/* Tab content */}
        <div className="min-w-0 -mx-1 px-1">
          {tab === "collection" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Spiel suchen…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Spiel suchen"
                />
              </div>

              {loadingGames ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Lade Sammlung…</p>
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground text-center">
                    {search
                      ? "Keine passenden Spiele gefunden."
                      : existingGameIds.length > 0
                        ? "Alle Spiele sind bereits in dieser Reihe."
                        : "Noch keine Spiele in der Sammlung."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="relative w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {game.imageUrl ? (
                          <Image src={game.imageUrl} alt="" className="object-cover" fill sizes="40px" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{gameTextForRead(game.name)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            {game.minPlayers}-{game.maxPlayers}
                          </span>
                          {game.playTimeMinutes && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {game.playTimeMinutes} Min.
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFromCollection(game.id)}
                        disabled={adding !== null}
                        className="shrink-0"
                        aria-label={adding === game.id ? "Wird hinzugefügt" : "Hinzufügen"}
                      >
                        {adding === game.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                            <span className="hidden sm:inline">Hinzufügen</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <SeriesBggSearch bggSearch={bggSearch} setBggSearch={setBggSearch} bggResults={bggResults} bggSearching={bggSearching} handleSearchBGG={handleSearchBGG} handleAddFromBGG={handleAddFromBGG} adding={adding} presenceStatus={presence.status} matches={presence.matches} retryPresence={presence.retry} existingGameIds={existingGameIds} />
          )}
        </div>
      </DialogContent>
    </Dialog>

    <BarcodeScanner
      open={barcodeScannerOpen}
      onOpenChange={setBarcodeScannerOpen}
      onGameSelected={handleBarcodeGameSelected}
      onLocalGameFound={handleLocalGameFound}
    />
    </>
  );
}
