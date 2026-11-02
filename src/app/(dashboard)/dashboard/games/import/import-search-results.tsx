import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BGGSearchResult } from "@/lib/bgg-types";

export function ImportSearchResults({ results, onSelect }: { results: BGGSearchResult[]; onSelect: (id:string)=>void }) {
  if (!results.length) return null;
  return <Card>
    <CardHeader><CardTitle as="h2">Suchergebnisse</CardTitle></CardHeader>
    <CardContent>
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {results.map(result=><li key={result.bggId}>
          <Button variant="ghost" onClick={()=>onSelect(result.bggId)} className="h-auto w-full min-w-0 justify-start whitespace-normal p-2 text-left">
            <span className="min-w-0 font-medium [overflow-wrap:anywhere]">{result.name}</span>
            {result.yearPublished && <span className="text-muted-foreground">({result.yearPublished})</span>}
          </Button>
        </li>)}
      </ul>
    </CardContent>
  </Card>;
}
