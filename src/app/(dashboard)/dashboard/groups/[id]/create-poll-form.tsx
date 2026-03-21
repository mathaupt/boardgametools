"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { GameOptionPicker } from "./game-option-picker";

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
            <GameOptionPicker
              pollOptions={pollOptions}
              onOptionsChange={setPollOptions}
              optionsAreGames={optionsAreGames}
              onOptionsAreGamesChange={setOptionsAreGames}
            />
            {!optionsAreGames && (
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
