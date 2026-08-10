"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/date";
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
      className={`transition-shadow hover:shadow-sm ${
        entry.played ? "bg-muted/30 border-muted" : ""
      }`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Order number + sort controls */}
          <div className="flex flex-col items-center gap-0 w-6 shrink-0">
            {canReorder ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onMoveEntry(entry, "up")}
                  disabled={originalIndex === 0}
                  className="h-auto w-auto p-0.5 disabled:opacity-20"
                  aria-label="Nach oben"
                >
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <span className="text-xs font-medium text-muted-foreground leading-none">{originalIndex + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onMoveEntry(entry, "down")}
                  disabled={originalIndex === totalEntries - 1}
                  className="h-auto w-auto p-0.5 disabled:opacity-20"
                  aria-label="Nach unten"
                >
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">{displayIndex + 1}</span>
            )}
          </div>

          {/* Played toggle */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onTogglePlayed(entry)}
            className={`h-7 w-7 rounded-full p-0 shrink-0 transition-colors ${
              entry.played
                ? "bg-success border-success text-success-foreground"
                : "bg-transparent border-muted-foreground/30 hover:border-primary hover:scale-105"
            }`}
            aria-label={entry.played ? "Als nicht gespielt markieren" : "Als gespielt markieren"}
          >
            {entry.played && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          </Button>

          {/* Game image */}
          <Link
            href={`/dashboard/games/${entry.game.id}`}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted shrink-0 hover:ring-2 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
          >
            {entry.game.imageUrl ? (
              <Image
                src={entry.game.imageUrl}
                alt={entry.game.name}
                className="object-cover"
                fill
                sizes="56px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
              </div>
            )}
          </Link>

          {/* Game info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/games/${entry.game.id}`}
                className={`font-medium hover:underline truncate text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${
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
                <Users className="h-3 w-3" aria-hidden="true" />
                {entry.game.minPlayers}-{entry.game.maxPlayers}
              </span>
              {entry.game.playTimeMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {entry.game.playTimeMinutes} Min.
                </span>
              )}
              {entry.played && entry.playedAt && (
                <span>
                  gespielt {formatDate(entry.playedAt)}
                </span>
              )}
              {entry.played && entry.playerCount && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  {entry.playerCount} Spieler
                </span>
              )}
              {entry.played && entry.playTimeMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {entry.playTimeMinutes} Min. gespielt
                </span>
              )}
              {entry.played && entry.score != null && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" aria-hidden="true" />
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
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={onToggleExpanded}
                  className="ml-1 h-auto p-0 gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Details bearbeiten"
                >
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} aria-hidden="true" />
                  Details
                </Button>
              </div>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Select value={entry.difficulty || ""} onValueChange={(v) => onDifficultyChange(entry, v || null)}>
              <SelectTrigger className="text-xs h-7 px-1.5 py-1 hidden sm:flex w-[100px]" aria-label="Schwierigkeit">
                <SelectValue placeholder="Schwierigkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Schwierigkeit</SelectItem>
                <SelectItem value="einsteiger">Einsteiger</SelectItem>
                <SelectItem value="fortgeschritten">Fortgeschritten</SelectItem>
                <SelectItem value="profi">Profi</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(entry)}
              className="hover:bg-destructive/10 hover:text-destructive"
              aria-label="Aus Reihe entfernen"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
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
