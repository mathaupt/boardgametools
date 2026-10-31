# FEAT-014 – Suchzustände und Beschriftung der BGG-Suche

**Status:** Implementierungsplan zur Prüfung; keine Umsetzungsfreigabe.

**Ziel:** Die öffentliche BGG-Suche funktioniert für Gäste und Konten und unterscheidet ungesucht, ladend, Treffer, leere Suche und Fehler mit klarer Beschriftung.

**Architektur:** Ein kontrollierter Suchhook verwaltet die Zustände und veraltete Requests. Eine tokengebundene öffentliche GET-Route liefert freigegebene Katalogdaten über einen gemeinsamen BGG-Service, der Fehler nicht in leere Trefferlisten umwandelt. Vorschlagen bleibt eine gesonderte, berechtigte Mutation.

**Technik:** Next.js 16, React/TypeScript, bestehender BGG-XML-Parser, Auth-/Share-Resolver und Rate-Limiter, Vitest/Testing Library und CodeceptJS. Keine neue Abhängigkeit.

**Abarbeitung:** Nach ausdrücklicher Freigabe testgetrieben, jeweils roten Test, minimale Umsetzung, grüne Prüfung und Commit. Keine automatische Delegation.

## 1. Bestand und Ursachen

- bgg-game-search.tsx zeigt „Keine Ergebnisse“ schon bei zwei eingegebenen Zeichen ohne abgeschlossenen Suchlauf (BUG-040).
- Das Suchfeld hat nur einen Platzhalter und keinen dauerhaft sichtbaren Label (BUG-043).
- bggLoading, bggResults und Toasts bilden Fehler und gültige leere Ergebnisse nicht eindeutig ab.
- Die Komponente ruft /api/bgg auf. Diese Route verlangt requireAuth; der öffentliche Gastablauf kann damit scheitern, obwohl die Oberfläche eine Suche ohne Konto verspricht (BUG-052).
- src/lib/bgg.ts besitzt einen Suchpfad, der einige HTTP-/Netzwerkfehler als [] zurückgibt. Die Verwendung dieses Pfades allein würde einen Fehler weiter als leere Suche darstellen.
- /api/bgg enthält außerdem einen eigenen Parser. Für die neue öffentliche Route sollen die gemeinsamen Parser-/Textregeln verwendet werden, keine weitere private Parserkopie.
- Such-, Detail- und Vorschlagsrequests besitzen unterschiedliche Lebenszyklen; verspätete Antworten dürfen eine neuere Suche oder ein anderes Event nicht überschreiben.

**Abhängigkeiten:** FEAT-010 liefert Zustandsschutz, FEAT-013 die einzige aktive UI-Identität. Die Parser-/Textkorrekturen aus FEAT-009 nach Möglichkeit zuerst übernehmen; über dessen bestehenden Parserexport integrieren, keinen zweiten Entity-Decoder anlegen. FEAT-012 verändert nur die Position dieser Suchkomponente.

## 2. Such- und Interaktionsvertrag

| Zustand | Anzeige / Aktion |
|---|---|
| idle | Label „Spiel auf BoardGameGeek suchen“, Hinweis „Mindestens zwei Zeichen eingeben“, keine Leere-Meldung |
| loading | „Suche nach … läuft“, aria-busy; Suchfeld bleibt editierbar |
| results | Anzahl und Ergebnisse des tatsächlich abgesendeten Begriffs |
| empty | „Keine Spiele für … gefunden“ erst nach erfolgreicher abgeschlossener Suche |
| error | Fehlertext beim Suchbereich und „Erneut versuchen“ für den letzten abgesendeten Begriff |

- Suche ausschließlich über Formularabsenden mit Enter oder „Suchen“, nicht automatisch beim Tippen.
- Suchbegriff trimmen, 2–200 Zeichen erlauben. Ungültige Eingabe am Feld erklären, ohne Request.
- Beim Ändern des Begriffs alte Requests abbrechen und Treffer/Detail zurücksetzen; neuer Zustand idle. Vorherige Treffer nicht einem neuen Begriff zuordnen.
- Derselbe laufende Suchbegriff startet keinen zweiten Request. Ein anderer abgesendeter Begriff ersetzt den vorherigen Request.
- Request-ID und AbortController verwenden; nur die neueste Anfrage im selben Event darf Zustand, Fehler oder Ladeanzeige setzen. Abort ist kein Benutzerfehler.
- Erfolg und Fehler als kurze Statusmeldung ansagen; nicht die gesamte Trefferliste zum Live-Bereich machen. Fokus bleibt nach Suche auf dem bisherigen Control.
- Bei Detailöffnung Lade-, Fehler-/Wiederholen- und Nicht-mehr-verfügbar-Zustand separat behandeln. Schließen führt zum zugehörigen Ergebnisauslöser zurück; ist dieser entfernt, zum Suchfeld.
- Vorschlagen verwendet den Actor aus FEAT-013 und die Sperre aus FEAT-010. Eine Suche allein erstellt keinen Gast und keinen Vorschlag.
- Nach bestätigtem Vorschlag den gelieferten Proposal-Datensatz einmal an den Parent melden. Abgelehnte Writes dürfen keine scheinbar gespeicherte Zeile erzeugen.

Zustandsmodell:

```ts
export type BggSearchState =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "results"; query: string; results: BggCatalogItem[] }
  | { kind: "empty"; query: string }
  | { kind: "error"; query: string; message: string; retryAfterSeconds: number | null };
```

Neue Komponenten-Props:

```ts
import type { PublicActor } from "@/lib/events/public-actor";
import type { Proposal } from "./types";

export interface BggGameSearchProps {
  token: string;
  actor: PublicActor;
  proposalOpen: boolean;
  onProposalAdded: (proposal: Proposal) => void;
  onEventChanged: () => void;
}
```

proposalOpen stammt ausschließlich aus der FEAT-010-Auswertung; der Observer darf im offenen Event suchen, aber ohne Identität nicht vorschlagen.

## 3. Öffentliche API und Fehlersemantik

**Neu:** GET /api/public/event/{token}/bgg mit genau einem der Parameter query oder bggId.

- Nur gültiger, aktueller öffentlicher Share-Token und ein für neue Vorschläge offener Zustand gemäß FEAT-010. Für lesende Katalogsuche keine Gastregistrierung und keine Session verlangen.
- Allgemeine /api/bgg-Route bleibt geschützt. Keine globale Auth-Ausnahme schaffen.
- query: getrimmt 2–200 Zeichen; bggId: 1–12 Ziffern; beide oder keiner → 400.
- Ergebnisliste maximal 20 Einträge. Suchantwort als Array mit bggId, name, yearPublished:number|null, imageUrl:string|null; Details zusätzlich mit vorhandener Beschreibung und numerischen Spieler-/Zeit-/Bewertungsangaben.
- Fehlende Cover sind zulässig. Optionales Thumbnail-Batchladen für höchstens 20 IDs darf eine erfolgreiche Suche nicht in einen Fehler verwandeln; kein zusätzlicher Request je sichtbarem Ergebnis.
- HTTP-Vertrag: 400 ungültige Eingabe; 404 Token widerrufen/Event nicht öffentlich beziehungsweise Detailspiel nicht gefunden; 409 Event nicht mehr offen; 429 lokales Rate-Limit; 502 ungültige BGG-Antwort; 503 BGG nicht verfügbar/weiter in Bearbeitung; 504 Zeitüberschreitung. Fehler immer { error: string }.
- Erfolgreiche leere Ergebnisse nur bei gültiger, vollständig ausgewerteter BGG-Antwort. Fehler, HTML-Fehlerseite und unverständliches XML dürfen niemals 200 [] werden.
- Pro IP 20 öffentliche Kataloganfragen/Minute mit eigenem Schlüsselpräfix. Token vor jedem Ergebnis prüfen; Cache-Control: private, no-store auf der öffentlichen Antwort.
- Upstream nur feste boardgamegeek.com-Hosts verwenden. Gesamtes Zeitbudget zehn Sekunden, maximal zwei Wiederholungen bei 202 innerhalb dieses Budgets; tatsächliche Antwortgröße auch ohne Content-Length auf 2 MB begrenzen.
- Externe Bilder nur mit freigegebenem http-/https-Schema. Keine vom Request frei vorgegebene URL abrufen; keine BGG-Tokens oder privaten Spielbeschreibungen ausgeben.
- Bestehendes withApiLogging redigiert öffentliche Eventtokens. Neue Fehlerlogs enthalten nur Fehlerklasse/HTTP-Status, keine vollständige Token-URL oder Such-/Gastdaten.

## 4. Dateien

| Datei | Aufgabe |
|---|---|
| src/lib/bgg-catalog.ts | Neuer strikt typisierter Such-/Detailservice mit BggCatalogError |
| src/lib/bgg-fetch.ts | Neuer begrenzter BGG-Transport; Fehler nicht zu [] umwandeln |
| src/lib/bgg-xml.ts, src/lib/bgg-types.ts | Gemeinsame Parser-/DTO-Typen verwenden beziehungsweise gezielt erweitern |
| src/app/api/public/event/[token]/bgg/route.ts | Neue tokengebundene öffentliche GET-Route |
| src/components/public-event/use-bgg-search.ts | Neuer Such-/Abbruchzustand ohne UI |
| src/components/public-event/bgg-game-search.tsx | Beschriftetes Formular und Zustandsdarstellung |
| src/components/public-event/bgg-search-results.tsx | Neue Ergebnisliste mit sichtbaren Aktionen |
| src/components/public-event/bgg-catalog-detail.tsx | Neue fokussierbare Detaildarstellung und Wiederholung |
| src/components/public-event/public-event-client.tsx | Actor und Zustandsschutz weiterreichen |

Bestehende Aufrufer von searchBGGGames/fetchBGGGame nicht ungeprüft auf neue Fehlerwürfe umstellen. Falls Transport geteilt wird, deren bisherigen Rückgabevertrag durch Adapter erhalten; die neue öffentliche API verwendet ausdrücklich die strikte Variante.

## 5. Aufgaben

### Aufgabe 1 – Strikte Katalogantwort und Gastzugriff testgetrieben

**Neu:** tests/unit/lib/bgg-catalog.test.ts und tests/unit/api/public-bgg.test.ts.

- [ ] Vorlauf npm run review-evaluate:report; BUG-050/051 als bestehende Prüfblocker berücksichtigen, Ausführungsfehler eines Audits nicht als Erfolg werten.
- [ ] Tests zuerst schreiben: gültiger öffentlicher Token ohne Session erhält Treffer; fehlender/widerrufener Token → 404; geschlossen → 409; ungültige Query → 400; Rate-Limit → 429.
- [ ] Servicefälle: gültige leere Suche, Treffer, 202-Wiederholung, 429/5xx upstream, Timeout, beschädigtes XML, HTML statt XML, Größenlimit ohne Header und fehlendes optionales Cover.
- [ ] npx vitest run tests/unit/lib/bgg-catalog.test.ts tests/unit/api/public-bgg.test.ts ausführen; fehlende Route/Service als roten Ausgangspunkt belegen.
- [ ] Folgende Servicegrenzen implementieren:

```ts
export interface BggCatalogItem {
  bggId: string;
  name: string;
  yearPublished: number | null;
  imageUrl: string | null;
}

export class BggCatalogError extends Error {
  constructor(
    public readonly status: 404 | 502 | 503 | 504,
    message: string
  ) { super(message); }
}

export function searchBggCatalog(query: string, signal?: AbortSignal): Promise<BggCatalogItem[]>;
export function getBggCatalogDetail(bggId: string, signal?: AbortSignal): Promise<BGGGameData>;
```

- [ ] BGGGameData aus src/lib/bgg-types.ts übernehmen. Transport und Parser getrennt halten; input-/output-Typen zur Laufzeit validieren, fremdes JSON/XML nicht nur casten.
- [ ] Suchlauf und optionale Thumbnailanreicherung teilen dieselbe Zehn-Sekunden-Deadline; keinen zweiten vollen Timeout nach der Suche starten. Reicht das Restbudget nicht, mit gültigen Treffern ohne Cover antworten.
- [ ] findPublicEventByToken und FEAT-010-Policy vor dem Katalogservice auswerten. requireAuth nicht auf die neue öffentliche Suchroute übertragen.
- [ ] API-Fehlerstatus gemäß Abschnitt 3 abbilden und Retry-After bei lokalem 429 erhalten.
- [ ] Tests grün ausführen. Commit: feat: add token scoped public BGG catalog lookup.

### Aufgabe 2 – Suchzustände und Schutz vor verspäteten Antworten

**Neu:** tests/unit/components/bgg-game-search.test.tsx und tests/unit/components/use-bgg-search.test.tsx.

- [ ] Zuerst den ursprünglichen Fehler als Test schreiben:

```tsx
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
const openEventSearchProps = {
  token: "test-public-token",
  actor: { kind: "observer" } as PublicActor,
  proposalOpen: true,
  onProposalAdded: vi.fn(),
  onEventChanged: vi.fn(),
};

it("zeigt vor dem Absenden keine leere Suche", async () => {
  const user = userEvent.setup();
  render(<BggGameSearch {...openEventSearchProps} />);
  await user.type(screen.getByRole("textbox", { name: "Spiel auf BoardGameGeek suchen" }), "Az");
  expect(screen.queryByText(/Keine Spiele/)).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});
```

  Die Fixture bleibt lokal im Test; beforeEach setzt die Mockaufrufe zurück. userEvent, render, screen, vi, BggGameSearch und PublicActor aus den oben benannten Test-/Produktmodulen importieren.

- [ ] Weitere Tests: Enter/Submit genau ein Request, loading, Ergebnisse, echte leere Antwort, Fehler/Wiederholen, Änderung des Begriffs zurück auf idle, abgebrochener Request ohne Fehlermeldung und A/B-Antworten in umgekehrter Reihenfolge.
- [ ] Neue Route mit encodeURIComponent für Query/ID verwenden. Suchfeld nicht während des Requests entfernen oder den Eingabetext überschreiben.
- [ ] useBggSearch als Hook mit state, search(query), retry() und reset() implementieren. reset/unmount/token-Wechsel brechen laufende Suche und Details ab; alte finally-Blöcke dürfen loading der neueren Anfrage nicht beenden.
- [ ] Formular mit echtem label/htmlFor, maxLength=200, Feldhinweis über aria-describedby und verständlichen deutschen Meldungen implementieren. Kein zusätzliches onKeyDown neben onSubmit.
- [ ] Statusmeldung kurz halten; Fehlermeldung beim Suchbereich mit beschrifteter Wiederholungsaktion anzeigen. 429 erst nach angegebenem Intervall erneut senden; keine automatische Endlosschleife.
- [ ] Tests grün ausführen. Commit: fix: model public BGG search states explicitly.

### Aufgabe 3 – Details und Vorschlagen verlässlich anbinden

- [ ] Tests für fehlgeschlagene Details, Wiederholung, Schließen/Fokus, Event-/Querywechsel während Detailrequest und Vorschlagsfehler ohne neue Listenzeile ergänzen.
- [ ] bgg-catalog-detail.tsx und bgg-search-results.tsx extrahieren; Dateien jeweils ungefähr unter 300 Zeilen halten. Vorhandene Spielinformationen und optionalen BGG-Link erhalten.
- [ ] Vollständige umbrechende Namen, Cover-Platzhalter und dauerhaft erreichbare Aktionen verwenden; alle Haupt-/Iconaktionen mindestens 44 × 44 px.
- [ ] Vor jeder Vorschlagsaktion Actor und FEAT-010-Capability prüfen. Backend bleibt maßgeblich; bei 409 Daten aktualisieren und die Suchmutation sperren.
- [ ] Zwei schnelle Vorschlagsklicks dürfen nur einen Request auslösen. Nach erfolgreicher Antwort onProposalAdded einmal mit dem zurückgegebenen Vorschlag aufrufen; aktuelle Sortierung erhalten.
- [ ] Nur Klartext rendern; vorhandene FEAT-009-Normalisierung übernehmen. BGG-Link ausschließlich aus validierter numerischer ID konstruieren, extern mit rel=noopener noreferrer.
- [ ] Tests grün ausführen. Commit: feat: harden BGG result details and proposing.

### Aufgabe 4 – Abnahme und Dokumentation

- [ ] E2E in tests/e2e/public_bgg_search_test.ts: ohne Login echten öffentlichen Eventendpunkt verwenden, kontrollierte BGG-Antwort am Servertransport einspeisen, suchen, Gastbeitritt und Vorschlagen prüfen. Kein Browsermock darf die zu prüfende öffentliche API umgehen.
- [ ] Fixtures für 0/1/20 Treffer, lange Namen, fehlende Cover, leer/ladend/Fehler/429, Gast/Konto/ohne Identität und während der Suche geschlossenes Event.
- [ ] 390/1440 px, hell/dunkel und 200 % Zoom; sichtbares Label, Fokus, Ansagen, 44-px-Ziele und fehlendes horizontales Seitenscrollen prüfen.
- [ ] Impeccable-Kontext/Craft-Floor vor UI-Arbeit anwenden; gerenderte Detektorprüfung plus manuelle Kontrolle der Zustandswechsel.
- [ ] npm run test, typecheck, lint, build und security-check; bestehende BGG-/Import-Tests wegen geteilter Parser-/Transportmodule ausführen.
- [ ] docs/openapi.yaml um die öffentliche GET-Route mit Parametern, DTOs, security: [] und Fehlerantworten erweitern. FEATURES, FAQ, CONCEPT, Backlog und Changelog aktualisieren.
- [ ] BUG-040/043/052 erst nach bestandenen Zustands-, Label- und Gastzugriffstests schließen. Commit und Reviewdokumentation gemäß AGENTS.md; bestehende Hookblocker nicht umgehen.

## 6. Abnahmegrenze

Eine optisch richtige Leere-Meldung genügt nicht: Auch Gastzugriff und tatsächliche Upstreamfehler müssen korrekt abgebildet werden. Die Planung selbst führt keine BGG-Abfragen, Gastregistrierungen oder API-Änderungen aus.
