interface NamedOption { id: string; name: string | null }
export interface SessionDraft {
  text: string;
  gameId: string | null;
  userIds: string[];
  durationMinutes: number | null;
  issues: string[];
}
function normalize(value: string) {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE").replace(/\s+/g, " ");
}
function resolve(value: string, options: NamedOption[]) {
  const matches = options.filter((option) => option.name && normalize(option.name) === normalize(value));
  return matches.length === 1 ? matches[0].id : null;
}

/** A deliberately limited grammar. IDs can only come from the supplied authorized options. */
export function parseSessionDraft(text: string, options: { games: NamedOption[]; users: NamedOption[] }): SessionDraft {
  const draft: SessionDraft = { text, gameId: null, userIds: [], durationMinutes: null, issues: [] };
  if (!text.trim() || text.length > 2000) {
    draft.issues.push("Bitte einen Text mit 1 bis 2000 Zeichen eingeben.");
    return draft;
  }
  // A duration is recognized only as a complete final clause, never as part of a game title.
  const duration = text.match(/,\s*([^,]+?)\s+Minuten?\s*[.!]?\s*$/i);
  let remaining = text.trim();
  if (duration) {
    const value = duration[1].trim();
    if (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1440) draft.durationMinutes = Number(value);
    else draft.issues.push("Dauer ungeklärt: Bitte 1 bis 1440 ganze Minuten auswählen.");
    remaining = text.slice(0, duration.index).trim();
  }
  const parts = remaining.split(/\s+mit\s+/i);
  const title = parts[0].trim();
  draft.gameId = resolve(title, options.games);
  if (!draft.gameId) draft.issues.push(`Spiel ungeklärt: „${title}“. Bitte im Formular auswählen.`);
  if (parts.length !== 2 || !parts[1].trim()) {
    draft.issues.push("Mitspielende ungeklärt. Bitte im Formular auswählen.");
  } else {
    for (const name of parts[1].split(/\s+und\s+|,/i).map((name) => name.trim()).filter(Boolean)) {
      const id = resolve(name, options.users);
      if (!id) draft.issues.push(`Person ungeklärt: „${name}“. Bitte im Formular auswählen.`);
      else if (!draft.userIds.includes(id)) draft.userIds.push(id);
    }
  }
  return draft;
}
