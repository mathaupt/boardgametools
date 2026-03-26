"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  Loader2,
  AlertCircle,
  Plus,
  Image,
  Search,
  Type,
} from "lucide-react";

interface BGGResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}

interface CoverScanTabProps {
  onGameSelected: (bggId: string, ean: string) => void;
}

export function CoverScanTab({ onGameSelected }: CoverScanTabProps) {
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

  const stopCoverCamera = useCallback(() => {
    if (coverStreamRef.current) {
      coverStreamRef.current.getTracks().forEach(t => t.stop());
      coverStreamRef.current = null;
    }
    setCoverCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCoverCamera();
    };
  }, [stopCoverCamera]);

  async function startCoverCamera() {
    setOcrError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      coverStreamRef.current = stream;
      setCoverCameraActive(true);
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
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image aria-hidden className="h-4 w-4 mr-2" />
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
  );
}
