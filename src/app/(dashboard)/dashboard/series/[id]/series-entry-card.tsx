"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUp,
  ChevronDown,
  Users,
  Clock,
  ImageIcon,
  Check,
  Trash2,
  Trophy,
  ChevronRight,
} from "lucide-react";
import type { SeriesEntry } from "./types";
import { StarRating } from "./star-rating";
import { EntryPlayDetails } from "./entry-play-details";

const DIFFICULTY_CONFIG: Record<string, { label: string; className: string }> = {
  einsteiger: { label: "Einsteiger", className: "bg-success/10 text-success border-success" },
  fortgeschritten: { label: "Fortgeschritten", className: "bg-warning/10 text-warning border-warning" },
  profi: { label: "Profi", className: "bg-destructive/10 text-destructive border-destructive" },
};

interface SeriesEntryCardProps {
  entry: SeriesEntry;
  displayIndex: number;
  originalIndex: number;
  totalEntries: number;
  canReorder: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onTogglePlayed: (entry: SeriesEntry) => void;
  onMoveEntry: (entry: SeriesEntry, direction: "up" | "down") => void;
  onRatingChange: (entry: SeriesEntry, rating: number | null) => void;
  onDifficultyChange: (entry: SeriesEntry, difficulty: string | null) => void;
  onPlayDetailChange: (entry: SeriesEntry, field: string, value: unknown) => void;
  onDelete: (entry: SeriesEntry) => void;
}

export function SeriesEntryCard({
  entry,
  displayIndex,
  originalIndex,
  totalEntries,
  canReorder,
  isExpanded,
  onToggleExpanded,
  onTogglePlayed,
  onMoveEntry,
  onRatingChange,
  onDifficultyChange,
  onPlayDetailChange,
  onDelete,
}: SeriesEntryCardProps) {
  return (
            <Card
              className={`transition-all hover:shadow-sm ${
                entry.played
                  ? "bg-muted/30 border-muted"
                  : ""
              }`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Order number + sort controls */}
                  <div className="flex flex-col items-center gap-0 w-6 shrink-0">
                    {canReorder ? (
                      <>
                        <button
                          onClick={() => onMoveEntry(entry, "up")}
                          disabled={originalIndex === 0}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                          aria-label="Nach oben"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-medium text-muted-foreground leading-none">{originalIndex + 1}</span>
                        <button
                          onClick={() => onMoveEntry(entry, "down")}
                          disabled={originalIndex === totalEntries - 1}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                          aria-label="Nach unten"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">{displayIndex + 1}</span>
                    )}
                  </div>

                  {/* Played toggle */}
                  <button
                    onClick={() => onTogglePlayed(entry)}
                    className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      entry.played
                        ? "bg-success border-success text-primary-foreground scale-100"
                        : "border-muted-foreground/30 hover:border-primary hover:scale-105"
                    }`}
                    aria-label={entry.played ? "Als nicht gespielt markieren" : "Als gespielt markieren"}
                  >
                    {entry.played && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* Game image */}
                  <Link
                    href={`/dashboard/games/${entry.game.id}`}
                    className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    {entry.game.imageUrl ? (
                      <Image
                        src={entry.game.imageUrl}
                        alt={entry.game.name}
                        className="object-cover"
                        fill
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </Link>

                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/games/${entry.game.id}`}
                        className={`font-medium hover:underline truncate text-sm sm:text-base ${
                          entry.played ? "line-through decoration-1 text-muted-foreground" : ""
                        }`}
                      >
                        {entry.game.name}
                      </Link>
                      {entry.difficulty && DIFFICULTY_CONFIG[entry.difficulty] && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${DIFFICULTY_CONFIG[entry.difficulty].className}`}>
                          {DIFFICULTY_CONFIG[entry.difficulty].label}
                        </Badge>
                      )}
                      {entry.played && entry.successful === true && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-success/10 text-success border-success">
                          Erfolgreich
                        </Badge>
                      )}
                      {entry.played && entry.successful === false && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-destructive/10 text-destructive border-destructive">
                          Nicht geschafft
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {entry.game.minPlayers}-{entry.game.maxPlayers}
                      </span>
                      {entry.game.playTimeMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.game.playTimeMinutes} Min.
                        </span>
                      )}
                      {entry.played && entry.playedAt && (
                        <span>
                          gespielt {new Date(entry.playedAt).toLocaleDateString("de-DE")}
                        </span>
                      )}
                      {entry.played && entry.playerCount && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {entry.playerCount} Spieler
                        </span>
                      )}
                      {entry.played && entry.playTimeMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.playTimeMinutes} Min. gespielt
                        </span>
                      )}
                      {entry.played && entry.score != null && (
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {entry.score} Punkte
                        </span>
                      )}
                    </div>

                    {/* Rating + expand toggle (only when played) */}
                    {entry.played && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <StarRating
                          value={entry.rating}
                          onChange={(rating) => onRatingChange(entry, rating)}
                        />
                        <button
                          onClick={onToggleExpanded}
                          className="ml-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                          aria-label="Details bearbeiten"
                        >
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          Details
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={entry.difficulty || ""}
                      onChange={(e) => onDifficultyChange(entry, e.target.value || null)}
                      className="text-xs border rounded-md px-1.5 py-1 bg-background text-foreground hidden sm:block w-[100px]"
                      aria-label="Schwierigkeit"
                    >
                      <option value="">Schwierigkeit</option>
                      <option value="einsteiger">Einsteiger</option>
                      <option value="fortgeschritten">Fortgeschritten</option>
                      <option value="profi">Profi</option>
                    </select>

                    <button
                      onClick={() => onDelete(entry)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Aus Reihe entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded play details */}
                {entry.played && isExpanded && (
                  <EntryPlayDetails entry={entry} onPlayDetailChange={onPlayDetailChange} />
                )}
              </CardContent>
            </Card>
  );
}
