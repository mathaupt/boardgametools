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
  Search,
  Image,
  Type,
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
  const [tab, setTab] = useState<"barcode" | "cover">("barcode");
  const [scanning, setScanning] = useState(false);
  const [manualEan, setManualEan] = useState("");
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState<BarcodeLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackSearching, setFallbackSearching] = useState(false);
  const [fallbackResults, setFallbackResults] = useState<BGGResult[]>([]);
  const [scannedEan, setScannedEan] = useState<string | null>(null);
  // Cover OCR state
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrSearching, setOcrSearching] = useState(false);
  const [ocrResults, setOcrResults] = useState<BGGResult[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const coverStreamRef = useRef<MediaStream | null>(null);
  const [coverCameraActive, setCoverCameraActive] = useState(false);
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

  const stopCoverCamera = useCallback(() => {
    if (coverStreamRef.current) {
      coverStreamRef.current.getTracks().forEach(t => t.stop());
      coverStreamRef.current = null;
    }
    setCoverCameraActive(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanner();
      stopCoverCamera();
      setTab("barcode");
      setResult(null);
      setError(null);
      setManualEan("");
      setLooking(false);
      setFallbackName("");
      setFallbackSearching(false);
      setFallbackResults([]);
      setScannedEan(null);
      setCoverImage(null);
      setOcrProcessing(false);
      setOcrText("");
      setOcrSearching(false);
      setOcrResults([]);
      setOcrError(null);
    }
  }, [open, stopScanner, stopCoverCamera]);

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
    } catch (err: unknown) {
      setScanning(false);
      const message = err instanceof Error ? err.message : String(err);
      const name = err instanceof Error ? err.name : "";
      if (message.includes("NotAllowed") || name === "NotAllowedError") {
        setError("Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen.");
      } else if (message.includes("NotFound") || name === "NotFoundError") {
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
    setScannedEan(cleaned);
    setFallbackName("");
    setFallbackResults([]);

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
      }
      // not_found is handled in the UI with fallback search
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
    const ean = result?.ean || scannedEan;
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

  // --- Cover OCR functions ---

  async function startCoverCamera() {
    setOcrError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      coverStreamRef.current = stream;
      setCoverCameraActive(true);
      // Attach to video element after render
      requestAnimationFrame(() => {
        if (videoRef.current && coverStreamRef.current) {
          videoRef.current.srcObject = coverStreamRef.current;
        }
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setOcrError("Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff.");
      } else {
        setOcrError("Kamera konnte nicht gestartet werden.");
      }
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCoverImage(dataUrl);
    stopCoverCamera();
    runOCR(dataUrl);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCoverImage(dataUrl);
      runOCR(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function runOCR(imageData: string) {
    setOcrProcessing(true);
    setOcrError(null);
    setOcrText("");
    setOcrResults([]);
    try {
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(imageData, "deu+eng", {});
      const rawText = data.text.trim();
      if (!rawText) {
        setOcrError("Kein Text erkannt. Versuche ein schärferes Foto mit gutem Licht.");
        setOcrProcessing(false);
        return;
      }
      // Extract the most prominent line (likely the title - usually longest or first significant line)
      const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 2);
      // Pick the longest line as best guess for the game title
      const bestGuess = lines.reduce((a, b) => a.length >= b.length ? a : b, "");
      setOcrText(bestGuess);
    } catch {
      setOcrError("OCR-Verarbeitung fehlgeschlagen. Versuche ein anderes Foto.");
    }
    setOcrProcessing(false);
  }

  async function handleOcrSearch(e: React.FormEvent) {
    e.preventDefault();
    if (ocrText.trim().length < 2) return;
    setOcrSearching(true);
    setOcrResults([]);
    try {
      const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(ocrText.trim())}`);
      if (res.ok) {
        setOcrResults(await res.json());
      }
    } catch {
      setOcrError("Fehler bei der BGG-Suche");
    }
    setOcrSearching(false);
  }

  function handleSelectOcrResult(bggId: string) {
    // Cover scan has no EAN, pass empty string
    onGameSelected(bggId, "");
  }

  function resetCover() {
    setCoverImage(null);
    setOcrText("");
    setOcrResults([]);
    setOcrError(null);
    setOcrProcessing(false);
    stopCoverCamera();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tab === "barcode" ? <ScanBarcode className="h-5 w-5" /> : <Image className="h-5 w-5" />}
            Spiel scannen
          </DialogTitle>
          <DialogDescription>
            Scanne einen Barcode oder fotografiere das Cover der Spieleschachtel.
          </DialogDescription>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex border-b -mx-1">
          <button
            className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "barcode"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setTab("barcode"); stopCoverCamera(); }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ScanBarcode className="h-3.5 w-3.5" />
              Barcode
            </span>
          </button>
          <button
            className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "cover"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setTab("cover"); stopScanner(); }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Cover-Foto
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
        {tab === "barcode" ? (
        <>
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
                onClick={() => { setResult(null); setError(null); setManualEan(""); }}
              >
                <ScanBarcode className="h-4 w-4 mr-2" />
                Neuen Barcode scannen
              </Button>
            </div>
          )}
        </>
        ) : (
        /* ============ COVER-FOTO TAB ============ */
        <div className="space-y-4">
          {/* Camera / photo area */}
          {!coverImage && !coverCameraActive && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Fotografiere das Cover der Spieleschachtel — der Titel wird per Texterkennung ausgelesen und auf BGG gesucht.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={startCoverCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Kamera
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => coverInputRef.current?.click()}>
                  <Image className="h-4 w-4 mr-2" />
                  Foto wählen
                </Button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {/* Live camera preview */}
          {coverCameraActive && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/50 border-dashed rounded-lg w-3/4 h-2/3" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={capturePhoto}>
                  <Camera className="h-4 w-4 mr-2" />
                  Foto aufnehmen
                </Button>
                <Button variant="outline" onClick={stopCoverCamera}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {/* Captured image preview */}
          {coverImage && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-[4/3]">
                <img
                  src={coverImage}
                  alt="Cover-Foto"
                  className="w-full h-full object-contain"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={resetCover}>
                Neues Foto aufnehmen
              </Button>
            </div>
          )}

          {/* OCR processing */}
          {ocrProcessing && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Texterkennung läuft...</p>
            </div>
          )}

          {/* OCR error */}
          {ocrError && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{ocrError}</p>
            </div>
          )}

          {/* OCR result / search */}
          {!ocrProcessing && ocrText && (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Type className="h-4 w-4" />
                Erkannter Text
              </p>
              <form onSubmit={handleOcrSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    placeholder="Spielname bearbeiten..."
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={ocrSearching || ocrText.trim().length < 2}>
                  {ocrSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
                </Button>
              </form>
            </div>
          )}

          {/* OCR searching */}
          {ocrSearching && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Suche auf BoardGameGeek...</p>
            </div>
          )}

          {/* OCR BGG results */}
          {!ocrSearching && ocrResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Gefundene Spiele auf BoardGameGeek</p>
              <div className="space-y-1">
                {ocrResults.map((bgg) => (
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
                      onClick={() => handleSelectOcrResult(bgg.bggId)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No OCR results */}
          {!ocrSearching && ocrText && ocrResults.length === 0 && !ocrProcessing && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Bearbeite den erkannten Text und suche erneut.
            </p>
          )}
        </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
