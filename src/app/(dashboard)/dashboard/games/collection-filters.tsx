import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Tag } from "lucide-react";

interface CollectionFiltersProps {
  searchText: string; setSearchText: (value: string) => void;
  playerCount: string; setPlayerCount: (value: string) => void;
  sortOption: string; setSortOption: (value: string) => void;
  minComplexity: number | null; setMinComplexity: (value: number | null) => void;
  activeTag: string | null; setActiveTag: (value: string | null) => void;
  allTags: [string, string][];
}
export function CollectionFilters({ searchText, setSearchText, playerCount, setPlayerCount, sortOption, setSortOption, minComplexity, setMinComplexity, activeTag, setActiveTag, allTags }: CollectionFiltersProps) {
  return (
        <div className="club-collection-filters space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Input
              placeholder="Spiele durchsuchen…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
              aria-label="Spiele durchsuchen"
            />

            <div className="flex flex-wrap gap-2 items-center">
              <Select value={playerCount} onValueChange={setPlayerCount}>
                <SelectTrigger className="w-[140px]" aria-label="Spieleranzahl filtern">
                  <SelectValue placeholder="Spieler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Spieler</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count} Spieler
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]" aria-label="Sortierung">
                  <SelectValue placeholder="Sortierung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z–A)</SelectItem>
                  <SelectItem value="complexity_asc">Komplexität (↑)</SelectItem>
                  <SelectItem value="complexity_desc">Komplexität (↓)</SelectItem>
                  <SelectItem value="players_asc">Spieler (↑)</SelectItem>
                  <SelectItem value="players_desc">Spieler (↓)</SelectItem>
                  <SelectItem value="newest">Neueste zuerst</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchText("");
                  setActiveTag(null);
                  setPlayerCount("all");
                  setMinComplexity(null);
                  setSortOption("name_asc");
                }}
                aria-label="Filter zurücksetzen"
              >
                Zurücksetzen
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Mindest-Komplexität:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  type="button"
                  key={star}
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setMinComplexity(minComplexity === star ? null : star)}
                  aria-label={`Mindestens ${star} Sterne`}
                  aria-pressed={minComplexity === star}
                >
                  <Star
                    className={`h-4 w-4 ${minComplexity != null && star <= minComplexity ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    aria-hidden="true"
                  />
                </Button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={!activeTag ? "default" : "secondary"}
                size="xs"
                className={`rounded-full ${
                  !activeTag
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                aria-pressed={!activeTag}
                onClick={() => setActiveTag(null)}
              >
                Alle
              </Button>
              {allTags.map(([id, name]) => (
                <Button
                  type="button"
                  key={id}
                  variant={activeTag === id ? "default" : "secondary"}
                  size="xs"
                  className={`rounded-full ${
                    activeTag === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  aria-pressed={activeTag === id}
                  onClick={() => setActiveTag(activeTag === id ? null : id)}
                >
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {name}
                </Button>
              ))}
            </div>
          )}
        </div>
  );
}
