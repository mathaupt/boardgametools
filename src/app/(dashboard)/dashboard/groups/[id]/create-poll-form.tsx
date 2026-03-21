"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  X,
  Gamepad2,
  Search,
  ExternalLink,
  Loader2,
  ImageIcon,
  Users,
  Clock,
} from "lucide-react";
import Image from "next/image";

interface GameItem {
  id: string;
  name: string;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  bggId: string | null;
}

interface BGGResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}

interface CreatePollFormProps {
  groupId: string;
  loading: string;
  setLoading: (v: string) => void;
  onCreated: () => void;
  onCancel: () => void;
}

export function CreatePollForm({ groupId, loading, setLoading, onCreated, onCancel }: CreatePollFormProps) {
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollType, setPollType] = useState("single");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollError, setPollError] = useState("");
  const [optionsAreGames, setOptionsAreGames] = useState(false);
  const [gameTab, setGameTab] = useState<"collection" | "bgg">("collection");
  const [collectionGames, setCollectionGames] = useState<GameItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [bggSearch, setBggSearch] = useState("");
  const [bggResults, setBggResults] = useState<BGGResult[]>([]);
  const [bggSearching, setBggSearching] = useState(false);

  useEffect(() => {
    if (optionsAreGames && collectionGames.length === 0) {
      setLoadingGames(true);
      fetch("/api/games")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setCollectionGames(data))
        .finally(() => setLoadingGames(false));
    }
  }, [optionsAreGames, collectionGames.length]);

  async function handleSearchBGG() {
    if (bggSearch.length < 2) return;
    setBggSearching(true);
    try {
      const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(bggSearch)}`);
      if (res.ok) setBggResults(await res.json());
    } catch { /* ignore */ }
    setBggSearching(false);
  }

  function addGameAsOption(name: string) {
    if (pollOptions.includes(name)) return;
    const emptyIdx = pollOptions.findIndex((o) => !o.trim());
    if (emptyIdx >= 0) {
      const newOpts = [...pollOptions];
      newOpts[emptyIdx] = name;
      setPollOptions(newOpts);
    } else {
      setPollOptions([...pollOptions, name]);
    }
  }

  async function addBGGGameAsOption(bggId: string) {
    try {
      const res = await fetch(`/api/bgg?bggId=${bggId}`);
      if (res.ok) {
        const game = await res.json();
        addGameAsOption(game.name || bggId);
      }
    } catch {
      const result = bggResults.find((r) => r.bggId === bggId);
      if (result) addGameAsOption(result.name);
    }
  }

  const filteredCollectionGames = collectionGames.filter(
    (g) =>
      g.name.toLowerCase().includes(gameSearch.toLowerCase()) &&
      !pollOptions.includes(g.name)
  );

  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    setPollError("");
    const validOptions = pollOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setPollError("Mindestens 2 Optionen erforderlich");
      return;
    }
    setLoading("poll");
    try {
      const res = await fetch(`/api/groups/${groupId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pollTitle,
          description: pollDescription || null,
          type: pollType,
          options: validOptions,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPollError(data.error);
        return;
      }
      onCreated();
    } finally {
      setLoading("");
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4">
        <form onSubmit={handleCreatePoll} className="space-y-3">
          <div className="space-y-2">
            <Label>Frage / Titel *</Label>
            <Input
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              placeholder="z.B. Welches Legacy-Spiel als nächstes?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Input
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              placeholder="Optionale Details zur Abstimmung"
            />
          </div>
          <div className="space-y-2">
            <Label>Typ</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="single"
                  checked={pollType === "single"}
                  onChange={() => setPollType("single")}
                />
                Einzelwahl
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="multiple"
                  checked={pollType === "multiple"}
                  onChange={() => setPollType("multiple")}
                />
                Mehrfachwahl
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Optionen *</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="game-switch" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gamepad2 className="h-3 w-3" />
                  Optionen sind Spiele
                </Label>
                <Switch
                  id="game-switch"
                  checked={optionsAreGames}
                  onCheckedChange={(checked) => {
                    setOptionsAreGames(checked);
                    if (checked) {
                      setPollOptions(["", ""]);
                      setGameSearch("");
                      setBggSearch("");
                      setBggResults([]);
                      setGameTab("collection");
                    }
                  }}
                />
              </div>
            </div>

            {/* Selected options (both modes) */}
            {pollOptions.filter((o) => o.trim()).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pollOptions.filter((o) => o.trim()).map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm"
                  >
                    {optionsAreGames && <Gamepad2 className="h-3 w-3" />}
                    {opt}
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {optionsAreGames ? (
              <div className="border rounded-lg overflow-hidden">
                {/* Sammlung / BGG Import Tabs */}
                <div className="flex border-b">
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      gameTab === "collection"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setGameTab("collection")}
                  >
                    Aus Sammlung
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      gameTab === "bgg"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setGameTab("bgg")}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      BGG Import
                    </span>
                  </button>
                </div>

                <div className="p-3 max-h-56 overflow-y-auto">
                  {gameTab === "collection" ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Spiel suchen..."
                          value={gameSearch}
                          onChange={(e) => setGameSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {loadingGames ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredCollectionGames.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {gameSearch ? "Keine Spiele gefunden." : "Keine weiteren Spiele verfügbar."}
                        </p>
                      ) : (
                        filteredCollectionGames.map((game) => (
                          <button
                            key={game.id}
                            type="button"
                            onClick={() => addGameAsOption(game.name)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            <div className="relative w-8 h-8 rounded bg-muted flex-shrink-0 overflow-hidden">
                              {game.imageUrl ? (
                                <Image src={game.imageUrl} alt="" className="object-cover" fill />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                  <ImageIcon className="h-3 w-3" />
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
                            <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Spiel auf BGG suchen..."
                            value={bggSearch}
                            onChange={(e) => setBggSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchBGG())}
                            className="pl-9"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSearchBGG}
                          disabled={bggSearching || bggSearch.length < 2}
                        >
                          {bggSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
                        </Button>
                      </div>
                      {bggSearching ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : bggResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {bggSearch.length >= 2
                            ? "Keine Ergebnisse gefunden."
                            : "Suchbegriff eingeben und auf BGG suchen."}
                        </p>
                      ) : (
                        bggResults.map((result) => (
                          <button
                            key={result.bggId}
                            type="button"
                            onClick={() => addBGGGameAsOption(result.bggId)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.name}</p>
                              {result.yearPublished && (
                                <p className="text-xs text-muted-foreground">{result.yearPublished}</p>
                              )}
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Option hinzufügen
                </Button>
              </>
            )}
          </div>
          {pollError && <p className="text-sm text-destructive">{pollError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading === "poll"}>
              {loading === "poll" ? "Erstelle..." : "Abstimmung erstellen"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
