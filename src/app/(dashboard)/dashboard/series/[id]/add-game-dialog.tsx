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
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Search, Plus, Loader2, Users, Clock, ExternalLink, ScanBarcode } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";

interface CollectionGame {
  id: string;
  name: string;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  bggId: string | null;
}

interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}

interface AddGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  existingGameIds: string[];
  onGameAdded: () => void;
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
  const [adding, setAdding] = useState<string | null>(null);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);

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
      setSearch("");
      setBggSearch("");
      setBggResults([]);
      setTab("collection");
    }
  }, [open, loadGames]);

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

  async function handleAddFromCollection(gameId: string) {
    setAdding(gameId);
    try {
      const res = await fetch(`/api/series/${seriesId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      if (res.ok) {
        onGameAdded();
      }
    } catch {
      // ignore
    }
    setAdding(null);
  }

  async function handleAddFromBGG(bggId: string) {
    setAdding(bggId);
    try {
      const res = await fetch(`/api/series/${seriesId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bggId }),
      });

      if (res.ok) {
        onGameAdded();
      }
    } catch {
      // ignore
    }
    setAdding(null);
  }

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
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Spiel hinzufügen</DialogTitle>
          <DialogDescription>
            Wähle ein Spiel aus deiner Sammlung oder importiere eins von BoardGameGeek.
          </DialogDescription>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 flex items-center gap-2"
            onClick={() => setBarcodeScannerOpen(true)}
          >
            <ScanBarcode className="h-4 w-4" />
            Barcode scannen
          </Button>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex border-b -mx-1">
          <button
            className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "collection"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("collection")}
          >
            Aus Sammlung
          </button>
          <button
            className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "bgg"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("bgg")}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              BGG Import
            </span>
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
          {tab === "collection" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Spiel suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingGames ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Lade Sammlung...</p>
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
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
                          <Image src={game.imageUrl} alt="" className="object-cover" fill />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{game.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Users className="h-3 w-3" />
                            {game.minPlayers}-{game.maxPlayers}
                          </span>
                          {game.playTimeMinutes && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {game.playTimeMinutes} Min.
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFromCollection(game.id)}
                        disabled={adding === game.id}
                        className="shrink-0"
                      >
                        {adding === game.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
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
            <div className="space-y-3">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearchBGG(); }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Spiel auf BGG suchen..."
                    value={bggSearch}
                    onChange={(e) => setBggSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={bggSearching || bggSearch.length < 2}>
                  {bggSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
                </Button>
              </form>

              {bggSearching ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Suche auf BoardGameGeek...</p>
                </div>
              ) : bggResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ExternalLink className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground text-center">
                    {bggSearch.length >= 2
                      ? "Keine Ergebnisse. Versuche einen anderen Suchbegriff."
                      : "Gib einen Suchbegriff ein, um auf BoardGameGeek zu suchen."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {bggResults.map((result) => (
                    <div
                      key={result.bggId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        {result.yearPublished && (
                          <p className="text-xs text-muted-foreground">{result.yearPublished}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFromBGG(result.bggId)}
                        disabled={adding === result.bggId}
                        className="shrink-0"
                      >
                        {adding === result.bggId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
