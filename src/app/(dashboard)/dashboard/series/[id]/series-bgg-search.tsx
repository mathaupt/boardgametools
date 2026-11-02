"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ExternalLink, Plus } from "lucide-react";

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
  handleSearchBGG: () => Promise<void>;
  handleAddFromBGG: (id: string) => Promise<void>;
  adding: string | null;
}
export function SeriesBggSearch({ bggSearch, setBggSearch, bggResults, bggSearching, handleSearchBGG, handleAddFromBGG, adding }: SeriesBggSearchProps) {
  return (
<div className="space-y-3">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearchBGG(); }}
                className="flex flex-wrap gap-2"
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
                <Button type="submit" disabled={bggSearching || bggSearch.length < 2} aria-label="Suchen">
                  {bggSearching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Suchen"}
                </Button>
              </form>

              {bggSearching ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Suche auf BoardGameGeek…</p>
                </div>
              ) : bggResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ExternalLink className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground text-center">
                    {bggSearch.length >= 2
                      ? "Keine Ergebnisse. Versuche einen anderen Suchbegriff."
                      : "Gib einen Suchbegriff ein, um auf BoardGameGeek zu suchen."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {bggResults.map((result) => (
                    <div
                      key={result.bggId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        {result.yearPublished && (
                          <p className="text-xs text-muted-foreground">{result.yearPublished}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFromBGG(result.bggId)}
                        disabled={adding !== null}
                        className="shrink-0"
                        aria-label={adding === result.bggId ? "Wird importiert" : "Importieren"}
                      >
                        {adding === result.bggId ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
  );
}
