"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  Loader2,
  ScanBarcode,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Plus,
  ImageIcon,
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

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGameSelected: (bggId: string, ean: string) => void;
  onLocalGameFound?: (gameId: string) => void;
}

export function BarcodeScanner({
  open,
  onOpenChange,
  onGameSelected,
  onLocalGameFound,
}: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualEan, setManualEan] = useState("");
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState<BarcodeLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<any>(null);

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        const state = html5QrcodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrcodeRef.current.stop();
        }
      } catch {
        // ignore
      }
      html5QrcodeRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setResult(null);
      setError(null);
      setManualEan("");
      setLooking(false);
    }
  }, [open, stopScanner]);

  async function startScanner() {
    setError(null);
    setResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerRef.current) return;

      const scannerId = "barcode-scanner-element";
      // Ensure the element exists
      let el = document.getElementById(scannerId);
      if (!el) {
        el = document.createElement("div");
        el.id = scannerId;
        scannerRef.current.appendChild(el);
      }

      const scanner = new Html5Qrcode(scannerId);
      html5QrcodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
        },
        async (decodedText: string) => {
          // Barcode detected
          await stopScanner();
          handleLookup(decodedText);
        },
        () => {
          // scan error (no barcode found in frame) - ignore
        }
      );
    } catch (err: any) {
      setScanning(false);
      if (err?.message?.includes("NotAllowed") || err?.name === "NotAllowedError") {
        setError("Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen.");
      } else if (err?.message?.includes("NotFound") || err?.name === "NotFoundError") {
        setError("Keine Kamera gefunden. Du kannst den Barcode auch manuell eingeben.");
      } else {
        setError("Kamera konnte nicht gestartet werden. Versuche die manuelle Eingabe.");
      }
    }
  }

  async function handleLookup(ean: string) {
    const cleaned = ean.replace(/\D/g, "");
    if (cleaned.length < 8) {
      setError("Ungültiger Barcode. EAN muss mindestens 8 Ziffern haben.");
      return;
    }

    setLooking(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/barcode/lookup?ean=${encodeURIComponent(cleaned)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Fehler bei der Barcode-Suche");
        return;
      }

      const data: BarcodeLookupResponse = await res.json();
      setResult(data);

      if (data.source === "local" && data.localGame && onLocalGameFound) {
        // Game already in collection
      } else if (data.source === "not_found") {
        setError("Barcode nicht in der Produktdatenbank gefunden. Versuche die Suche per Name.");
      }
    } catch {
      setError("Netzwerkfehler bei der Barcode-Suche");
    } finally {
      setLooking(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualEan.trim()) {
      handleLookup(manualEan.trim());
    }
  }

  function handleSelectBGGResult(bggId: string) {
    if (result?.ean) {
      onGameSelected(bggId, result.ean);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
          <DialogDescription>
            Scanne den Barcode auf der Spieleschachtel oder gib die EAN-Nummer manuell ein.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Camera Scanner Area */}
          {!result && (
            <>
              <div
                ref={scannerRef}
                className="relative w-full rounded-lg overflow-hidden bg-muted min-h-[200px]"
              >
                {!scanning && !looking && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <Button onClick={startScanner} size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Kamera starten
                    </Button>
                  </div>
                )}
                {scanning && (
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Barcode suchen...
                    </Badge>
                  </div>
                )}
              </div>

              {scanning && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={stopScanner}
                >
                  <X className="h-4 w-4 mr-2" />
                  Scanner stoppen
                </Button>
              )}

              {/* Manual EAN input */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Oder EAN manuell eingeben:</p>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <Input
                    value={manualEan}
                    onChange={(e) => setManualEan(e.target.value)}
                    placeholder="z.B. 4002051692865"
                    className="flex-1"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <Button type="submit" disabled={looking || !manualEan.trim()}>
                    {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
                  </Button>
                </form>
              </div>
            </>
          )}

          {/* Loading state */}
          {looking && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Suche Barcode in Produktdatenbank...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {result === null && !scanning && !looking && (
                  <button
                    onClick={() => { setError(null); setResult(null); }}
                    className="text-xs underline mt-1"
                  >
                    Erneut versuchen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !looking && (
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
                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
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
                    Versuche die Suche per Name auf der Import-Seite.
                  </p>
                </div>
              )}

              {/* Scan again button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setResult(null); setError(null); setManualEan(""); }}
              >
                <ScanBarcode className="h-4 w-4 mr-2" />
                Neuen Barcode scannen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
