"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionResult { isFinal: boolean; [index: number]: { transcript: string } }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type RecognitionConstructor = new () => Recognition;
function getRecognition(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const browser = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function useSpeechInput(maxLength: number) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef<Recognition | null>(null);
  const cancel = useCallback(() => {
    const current = active.current;
    active.current = null;
    current?.abort();
    setRecording(false);
    setText("");
    setHasResult(false);
    setMessage("");
  }, []);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    const stopWhenHidden = () => { if (document.visibilityState === "hidden") cancel(); };
    document.addEventListener("visibilitychange", stopWhenHidden);
    window.addEventListener("pagehide", cancel);
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      window.removeEventListener("pagehide", cancel);
      const current = active.current;
      active.current = null;
      current?.abort();
    };
  }, [cancel]);

  function start() {
    const Constructor = getRecognition();
    if (!Constructor || active.current) return;
    setText("");
    setHasResult(false);
    setMessage("");
    let current: Recognition;
    try { current = new Constructor(); } catch {
      setMessage("Spracheingabe konnte nicht gestartet werden. Bitte tippe den Text ein.");
      return;
    }
    active.current = current;
    current.lang = "de-DE";
    current.continuous = false;
    current.interimResults = false;
    let captured = "";
    current.onresult = (event) => {
      if (active.current !== current) return;
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) captured = [captured, result[0].transcript].filter(Boolean).join(" ").trim();
      }
      if (captured.length > maxLength) {
        active.current = null;
        current.abort();
        setRecording(false);
        setText("");
        setHasResult(false);
        setMessage(`Der erkannte Text ist zu lang. Bitte höchstens ${maxLength} Zeichen diktieren.`);
      } else { setText(captured); setHasResult(Boolean(captured)); }
    };
    current.onerror = ({ error }) => {
      if (active.current !== current) return;
      active.current = null;
      current.abort();
      setRecording(false);
      setText("");
      setHasResult(false);
      setMessage(error === "not-allowed" || error === "service-not-allowed"
        ? "Mikrofonzugriff wurde nicht erlaubt. Bitte tippe den Text ein."
        : error === "no-speech"
          ? "Keine Sprache erkannt. Bitte erneut versuchen oder tippen."
          : "Die Verbindung zur Spracherkennung ist fehlgeschlagen. Bitte tippe den Text ein.");
    };
    current.onend = () => {
      if (active.current !== current) return;
      active.current = null;
      setRecording(false);
      setMessage(captured ? "Text prüfen und bei Bedarf bearbeiten." : "Keine Sprache erkannt. Bitte erneut versuchen oder tippen.");
    };
    setRecording(true);
    try { current.start(); } catch {
      active.current = null;
      current.abort();
      setRecording(false);
      setMessage("Spracheingabe konnte nicht gestartet werden. Bitte tippe den Text ein.");
    }
  }
  return { supported, recording, text, hasResult, setText, message, start, cancel, stop: () => active.current?.stop() };
}
