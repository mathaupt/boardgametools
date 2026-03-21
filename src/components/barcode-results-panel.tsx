"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ScanBarcode,
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
} from "lucide-react";

interface BGGResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}

interface BarcodeLookupResponse {
  source: "local" | "upcitemdb" | "not_found";
  ean: string;
  localGame: {
    id: string;
    name: string;
    imageUrl: string | null;
    bggId: string | null;
  } | null;
  productName?: string;
  cleanedName?: string;
  brand?: string;
  bggResults: BGGResult[];
}

interface BarcodeResultsPanelProps {
  result: BarcodeLookupResponse;
  scannedEan: string | null;
  onGameSelected: (bggId: string, ean: string) => void;
  onLocalGameFound?: (gameId: string) => void;
  onScanAgain: () => void;
}

export function BarcodeResultsPanel({
  result,
  scannedEan,
  onGameSelected,
  onLocalGameFound,
  onScanAgain,
}: BarcodeResultsPanelProps) {
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackSearching, setFallbackSearching] = useState(false);
  const [fallbackResults, setFallbackResults] = useState<BGGResult[]>([]);

  function handleSelectBGGResult(bggId: string) {
    const ean = result.ean || scannedEan;
    if (ean) {
      onGameSelected(bggId, ean);
    }
  }

  async function handleFallbackSearch(e: React.FormEvent) {
    e.preventDefault();
    if (fallbackName.trim().length < 2) return;
    setFallbackSearching(true);
    setFallbackResults([]);
    try {
      const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(fallbackName.trim())}`);
      if (res.ok) {
        setFallbackResults(await res.json());
      }
    } catch {
      // ignore
    }
    setFallbackSearching(false);
  }

  function handleSelectFallbackResult(bggId: string) {
    if (scannedEan) {
      onGameSelected(bggId, scannedEan);
    }
  }

  return (
            <div className="space-y-4">
              {/* EAN info */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                <ScanBarcode className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono">{result.ean}</span>
                {result.productName && (
                  <span className="text-muted-foreground truncate">
                    — {result.productName}
                  </span>
                )}
              </div>

              {/* Local game found */}
              {result.source === "local" && result.localGame && (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{result.localGame.name}</p>
                      <p className="text-sm text-muted-foreground">Bereits in deiner Sammlung</p>
                    </div>
                    {onLocalGameFound && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLocalGameFound(result.localGame!.id)}
                      >
                        Auswählen
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* BGG results */}
              {result.bggResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Gefundene Spiele auf BoardGameGeek
                    {result.cleanedName && (
                      <span className="text-muted-foreground font-normal"> — Suche: &ldquo;{result.cleanedName}&rdquo;</span>
                    )}
                  </p>
                  <div className="space-y-1">
                    {result.bggResults.map((bgg) => (
                      <div
                        key={bgg.bggId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{bgg.name}</p>
                          {bgg.yearPublished && (
                            <p className="text-xs text-muted-foreground">{bgg.yearPublished}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectBGGResult(bgg.bggId)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No BGG results */}
              {result.source === "upcitemdb" && result.bggResults.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Produkt gefunden, aber kein passendes Spiel auf BoardGameGeek.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gib den Spielnamen ein, um auf BGG zu suchen.
                  </p>
                </div>
              )}

              {/* Not found in product database - fallback name search */}
              {result.source === "not_found" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Barcode nicht in der Produktdatenbank gefunden</p>
                      <p className="text-muted-foreground mt-0.5">
                        Gib den Spielnamen ein — die EAN wird beim Import trotzdem gespeichert.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual name search (shown for not_found AND upcitemdb with no BGG results) */}
              {(result.source === "not_found" || (result.source === "upcitemdb" && result.bggResults.length === 0)) && (
                <div className="space-y-3">
                  <form onSubmit={handleFallbackSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={fallbackName}
                        onChange={(e) => setFallbackName(e.target.value)}
                        placeholder="Spielname eingeben..."
                        className="pl-9"
                      />
                    </div>
                    <Button type="submit" disabled={fallbackSearching || fallbackName.trim().length < 2}>
                      {fallbackSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
                    </Button>
                  </form>

                  {fallbackSearching && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Suche auf BoardGameGeek...</p>
                    </div>
                  )}

                  {!fallbackSearching && fallbackResults.length > 0 && (
                    <div className="space-y-1">
                      {fallbackResults.map((bgg) => (
                        <div
                          key={bgg.bggId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{bgg.name}</p>
                            {bgg.yearPublished && (
                              <p className="text-xs text-muted-foreground">{bgg.yearPublished}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSelectFallbackResult(bgg.bggId)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Import
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!fallbackSearching && fallbackName.trim().length >= 2 && fallbackResults.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Keine Ergebnisse. Versuche einen anderen Suchbegriff.
                    </p>
                  )}
                </div>
              )}

              {/* Scan again button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={onScanAgain}
              >
                <ScanBarcode className="h-4 w-4 mr-2" />
                Neuen Barcode scannen
              </Button>
            </div>
  );
}
