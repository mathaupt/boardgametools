export interface SeriesBulkAddItem<Input> {
  key: string;
  input: Input;
}

export type SeriesBulkAddResult =
  | { key: string; status: "added" | "already_present" }
  | { key: string; status: "failed"; message: string };

type SeriesEntryRequest<Input> = (input: Input) => Promise<Response>;

export function getSeriesGameSelectionKey(input: { gameId: string } | { bggId: string } | { kind: "temporary"; bggId: string }): string {
  return "gameId" in input ? `game:${input.gameId}` : `${"kind" in input && input.kind === "temporary" ? "temporary" : "bgg"}:${input.bggId}`;
}

export async function addSeriesGamesSequentially<Input>(
  items: SeriesBulkAddItem<Input>[],
  request: SeriesEntryRequest<Input>,
  onResult?: (result: SeriesBulkAddResult, completed: number) => void,
): Promise<SeriesBulkAddResult[]> {
  const results: SeriesBulkAddResult[] = [];

  for (const item of items) {
    try {
      const response = await request(item.input);
      if (response.status === 409) {
        results.push({ key: item.key, status: "already_present" });
      } else if (response.ok) {
        results.push({ key: item.key, status: "added" });
      } else {
        const payload = await response.json().catch(() => null) as { error?: unknown } | null;
        const message = response.status === 401
            ? "Bitte melde dich erneut an."
            : response.status >= 500
              ? "Das Spiel konnte nicht hinzugefügt werden. Bitte versuche es erneut."
              : typeof payload?.error === "string"
                ? payload.error
                : "Das Spiel konnte nicht hinzugefügt werden.";
        results.push({ key: item.key, status: "failed", message });
      }
    } catch {
      results.push({
        key: item.key,
        status: "failed",
        message: "Verbindungsfehler. Bitte versuche es erneut.",
      });
    }
    onResult?.(results[results.length - 1], results.length);
  }

  return results;
}
