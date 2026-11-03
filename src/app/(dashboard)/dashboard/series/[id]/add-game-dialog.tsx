"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Search, Loader2, ExternalLink, ScanBarcode } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { SeriesBggSearch, type BGGSearchResult } from "./series-bgg-search";
import type { AddSeriesGameInput, SeriesGameSelection } from "./types";
import { useSeriesGameAdd } from "./use-series-game-add";
import { useBggCollectionPresence, fetchBggCollectionPresence } from "@/components/bgg/use-bgg-collection-presence";
import { getSeriesGameSelectionKey } from "@/lib/series/bulk-add-entries";
import { SeriesGameSelectionSummary } from "./series-game-selection-summary";
import { SeriesCollectionGameList, type CollectionGame } from "./series-collection-game-list";


interface AddGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  existingGameIds: string[];
  existingBggIds?: string[];
  onGamesAdded: (inputs: AddSeriesGameInput[], closeDialog: boolean) => void | Promise<void>;
}

export function AddGameDialog({
  open,
  onOpenChange,
  seriesId,
  existingGameIds,
  existingBggIds = [],
  onGamesAdded,
}: AddGameDialogProps) {
  const [tab, setTab] = useState<"collection" | "bgg">("collection");
  const [games, setGames] = useState<CollectionGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [search, setSearch] = useState("");
  const [bggSearch, setBggSearch] = useState("");
  const [bggResults, setBggResults] = useState<BGGSearchResult[]>([]);
  const [bggSearching, setBggSearching] = useState(false);
  const [bggSearchError, setBggSearchError] = useState<string | null>(null);
  const [bggHasSearched, setBggHasSearched] = useState(false);
  const bggRequestId = useRef(0);
  const presence = useBggCollectionPresence(bggResults.map(result => result.bggId));
  const [selections, setSelections] = useState<SeriesGameSelection[]>([]);
  const { adding, error, batchProgress, batchResults, clearError, addGame, addGames } = useSeriesGameAdd(seriesId, onGamesAdded);
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
      bggRequestId.current += 1;
      setBggResults([]);
      setBggSearchError(null);
      setBggHasSearched(false);
      setTab("collection");
      setSelections([]);
    }
  }, [open, loadGames, clearError]);

  async function handleSearchBGG() {
    if (bggSearch.length < 2) return;
    setBggSearching(true);
    setBggSearchError(null);
    setBggResults([]);
    setBggHasSearched(false);
    const requestId = ++bggRequestId.current;
    try {
      const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(bggSearch)}`);
      if (!res.ok) throw new Error("BoardGameGeek ist gerade nicht erreichbar. Bitte versuche es erneut.");
      const results = await res.json();
      if (requestId === bggRequestId.current) {
        setBggResults(results);
        setBggHasSearched(true);
      }
    } catch {
      if (requestId === bggRequestId.current) setBggSearchError("BoardGameGeek ist gerade nicht erreichbar. Bitte versuche es erneut.");
    }
    if (requestId === bggRequestId.current) setBggSearching(false);
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

  function toggleSelection(selection: SeriesGameSelection) {
    setSelections((current) => {
      if (current.some((item) => item.key === selection.key)) return current.filter((item) => item.key !== selection.key);
      if (current.length >= 20) return current;
      return [...current, selection];
    });
  }

  function collectionSelection(game: CollectionGame): SeriesGameSelection {
    const input = { gameId: game.id } as const;
    return { key: getSeriesGameSelectionKey(input), input, name: game.name, imageUrl: game.imageUrl, source: "collection" };
  }

  function toggleBggSelection(bggId: string) {
    const match = presence.matches[bggId];
    const input = match ? { gameId: match.id } as const : { bggId } as const;
    const result = bggResults.find((game) => game.bggId === bggId);
    if (!result) return;
    toggleSelection({ key: getSeriesGameSelectionKey(input), input, name: result.name, imageUrl: null, source: "bgg" });
  }

  function handleBatchSubmit() {
    const pending = selections.filter((selection) => !batchResults[selection.key]);
    void addGames(pending);
  }

  function handleRetryFailed() {
    const failedKeys = new Set(Object.values(batchResults).filter((result) => result.status === "failed").map((result) => result.key));
    void addGames(selections.filter((selection) => failedKeys.has(selection.key)));
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block w-[calc(100%_-_2rem)] min-w-0 max-w-lg max-h-[85dvh] space-y-4 overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="pr-6 [overflow-wrap:anywhere]">Spiel hinzufügen</DialogTitle>
          <DialogDescription className="text-pretty">
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
        <SeriesGameSelectionSummary selections={selections} results={batchResults} progress={batchProgress} onSubmit={handleBatchSubmit} onRetry={handleRetryFailed} onRemove={(key) => setSelections((current) => current.filter((item) => item.key !== key))} />

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
                <SeriesCollectionGameList games={filteredGames} selections={selections} disabled={batchProgress !== null || adding !== null} adding={adding} onToggle={(game) => toggleSelection(collectionSelection(game))} onAdd={(gameId) => { void handleAddFromCollection(gameId); }} />
              )}
            </div>
          ) : (
            <SeriesBggSearch bggSearch={bggSearch} setBggSearch={(value) => { bggRequestId.current += 1; setBggSearching(false); setBggSearch(value); setBggResults([]); setBggSearchError(null); setBggHasSearched(false); }} bggResults={bggResults} bggSearching={bggSearching} hasSearched={bggHasSearched} searchError={bggSearchError} handleSearchBGG={handleSearchBGG} handleAddFromBGG={handleAddFromBGG} adding={adding} presenceStatus={presence.status} matches={presence.matches} retryPresence={presence.retry} existingGameIds={existingGameIds} existingBggIds={existingBggIds} selectedKeys={selections.map((item) => item.key)} canSelectMore={selections.length < 20} disabled={batchProgress !== null} onToggle={toggleBggSelection} />
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
