"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ExternalLink, Plus } from "lucide-react";
import { BggCollectionStatus } from "@/components/bgg/bgg-collection-status";
import type { BggCollectionMatch } from "@/components/bgg/use-bgg-collection-presence";
import { Checkbox } from "@/components/ui/checkbox";
import { getSeriesGameSelectionKey } from "@/lib/series/bulk-add-entries";

export interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}
interface SeriesBggSearchProps {
  bggSearch: string;
  setBggSearch: (value: string) => void;
  bggResults: BGGSearchResult[];
  bggSearching: boolean;
  hasSearched: boolean;
  searchError: string | null;
  handleSearchBGG: () => Promise<void>;
  handleAddFromBGG: (id: string) => Promise<void>;
  adding: string | null;
  presenceStatus: "loading" | "ready" | "error";
  matches: Record<string, BggCollectionMatch | null>;
  retryPresence: () => void;
  existingGameIds: string[];
  existingBggIds: string[];
  selectedKeys: string[];
  canSelectMore: boolean;
  disabled: boolean;
  onToggle: (bggId: string) => void;
  addMode: "collection" | "temporary";
}
export function SeriesBggSearch({ bggSearch, setBggSearch, bggResults, bggSearching, hasSearched, searchError, handleSearchBGG, handleAddFromBGG, adding, presenceStatus, matches, retryPresence, existingGameIds, existingBggIds, selectedKeys, canSelectMore, disabled, onToggle, addMode }: SeriesBggSearchProps) {
  return (
<div className="space-y-3">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearchBGG(); }}
                className="flex flex-col gap-2 min-[24rem]:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Spiel auf BGG suchen…"
                    value={bggSearch}
                    onChange={(e) => setBggSearch(e.target.value)}
                    className="min-w-0 pl-9"
                    aria-label="Spiel auf BGG suchen"
                  />
                </div>
                <Button type="submit" disabled={bggSearching || bggSearch.length < 2} aria-label="Suchen" className="min-h-11 w-full min-[24rem]:w-auto">
                  {bggSearching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Suchen"}
                </Button>
              </form>

              {bggSearching ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Suche auf BoardGameGeek…</p>
                </div>
              ) : searchError ? (
                <div role="alert" className="space-y-2 text-center text-sm">
                  <p className="text-destructive">{searchError}</p>
                  <Button type="button" variant="outline" onClick={() => void handleSearchBGG()}>Erneut versuchen</Button>
                </div>
              ) : bggResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ExternalLink className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground text-center">
                    {hasSearched
                      ? "Keine passenden Spiele gefunden. Ändere den Suchbegriff oder prüfe die Schreibweise."
                      : bggSearch.length >= 2
                        ? "Starte die Suche, um passende Spiele zu finden."
                        : "Gib einen Suchbegriff ein, um auf BoardGameGeek zu suchen."}
                  </p>
                </div>
              ) : (
                <>
                {addMode === "collection" && <BggCollectionStatus status={presenceStatus} retry={retryPresence} hideAbsent />}
                <div className="space-y-1">
                  {bggResults.map((result) => (
                    <div
                      key={result.bggId}
                      className="grid min-h-14 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring min-[24rem]:grid-cols-[auto_minmax(0,1fr)_auto]"
                    >
                      {(() => {
                        const match = matches[result.bggId];
                        const key = addMode === "temporary" ? getSeriesGameSelectionKey({ kind: "temporary", bggId: result.bggId }) : getSeriesGameSelectionKey(match ? { gameId: match.id } : { bggId: result.bggId });
                        const alreadyInSeries = existingBggIds.includes(result.bggId) || (!!match && existingGameIds.includes(match.id));
                        return <Checkbox aria-label={`${result.name} auswählen`} checked={selectedKeys.includes(key)} disabled={disabled || adding !== null || (addMode === "collection" && presenceStatus !== "ready") || alreadyInSeries || (!canSelectMore && !selectedKeys.includes(key))} onChange={() => onToggle(result.bggId)} />;
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        {result.yearPublished && (
                          <p className="text-xs text-muted-foreground">{result.yearPublished}</p>
                        )}
                      </div>
                      <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-2 min-[24rem]:col-span-1 min-[24rem]:justify-end">
                      {presenceStatus === "ready" && matches[result.bggId] && (() => {
                        const match = matches[result.bggId]!;
                        return <span className="basis-full truncate text-right text-xs text-muted-foreground sm:basis-auto" title={match.name}>
                          {existingGameIds.includes(match.id) ? "Bereits in dieser Reihe" : `In Sammlung: ${match.name}`}
                        </span>;
                      })()}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFromBGG(result.bggId)}
                        disabled={adding !== null || disabled || (addMode === "collection" && presenceStatus !== "ready") || existingBggIds.includes(result.bggId) || (!!matches[result.bggId] && existingGameIds.includes(matches[result.bggId]!.id))}
                        className="min-h-11 shrink-0 whitespace-normal"
                        aria-label={adding === `temporary:${result.bggId}` || adding === `bgg:${result.bggId}` || adding === `game:${matches[result.bggId]?.id}` ? "Wird hinzugefügt" : addMode === "temporary" ? "Nur zur Reihe hinzufügen" : matches[result.bggId] ? "Aus Sammlung hinzufügen" : "Importieren"}
                      >
                        {adding === `temporary:${result.bggId}` || adding === `bgg:${result.bggId}` || adding === `game:${matches[result.bggId]?.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <><Plus className="mr-1 h-4 w-4" aria-hidden="true" /><span className="sm:hidden">{addMode === "temporary" ? "Nur zur Reihe" : "Hinzufügen"}</span><span className="hidden sm:inline">{addMode === "temporary" ? "Nur zur Reihe" : matches[result.bggId] ? "Aus Sammlung hinzufügen" : "Importieren"}</span></>}
                      </Button>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
  );
}
