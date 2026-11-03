# FEAT-027 – Keine Treffer in der BGG-Suche eindeutig melden – Implementierungsplan

> **Für ausführende Agenten:** REQUIRED SUB-SKILLS: `test-driven-development` und `skills/testing/SKILL.md`; für Next.js/React `.agents/skills/next-best-practices/SKILL.md` sowie `.agents/skills/vercel-react-best-practices/SKILL.md` lesen. Erst alle BGG-Suchflächen und Providerantworten inventarisieren. Vorhandene FEAT-014-Zustände der öffentlichen Eventseite beibehalten; nur echte Lücken schließen.

**Ziel:** Eine leere BGG-Treffermenge klar und auf Deutsch anzeigen, ohne Providerfehler oder noch nicht abgeschlossene Suche als „keine Treffer“ auszugeben.

**Architektur:** Suchergebnis `[]` bedeutet ausschließlich erfolgreiche Suche ohne Treffer. Providerfehler, Rate-Limit und Zeitüberschreitung werden als unterscheidbare Fehlerantworten transportiert. Die bestehenden Suchflächen erhalten einen gemeinsamen fachlichen Zustandsvertrag `idle | loading | results | empty | error`; veraltete Antworten werden ignoriert/abgebrochen. Die öffentliche Eventseite mit FEAT-014-Vertrag wird geprüft und nur bei nachweisbarer Abweichung angepasst.

**Technik:** Next.js Route Handler, vorhandenes `searchBGGGames`, typed BGG-Fehler, React-Hooks/Komponenten, Vitest/Testing Library.

**Planungsstand:** 03.11.2026, HEAD `23cd674`, Version 0.50.67, Arbeitsbaum vor dieser Dokuänderung sauber. Die öffentliche Eventsuche aus FEAT-014 unterscheidet bereits `idle`, `loading`, `results`, `empty` und `error`. In authentifizierten Suchflächen unterscheiden Aufrufer diese Zustände uneinheitlich; `searchBGGGames` gibt nach Providerfehlern teilweise `[]` oder Beispieltreffer zurück. Die Implementierung muss zuerst die Fehlerquelle auflösen, sonst wäre eine leere Trefferliste weiterhin mehrdeutig.

---

## Aktualitätsprüfung vor Umsetzung

- [ ] HEAD und FEAT-014 Browser-/Komponentenvertrag prüfen; öffentliches `useBggSearch` hat bereits explizite `empty`/`error` Zustände.
- [ ] Suchflächen vollständig mit `rg` erfassen und Endpunkte zuordnen: `/dashboard/bgg`, `/dashboard/games/import`, Reihen-Dialog, Gruppen-Poll-Picker, Event-Voting, Cover-/Barcode-Suche und öffentliche Eventseite.
- [ ] `searchBGGGames`-Verhalten erneut prüfen: aktuelle Fallback-Beispiele und Providerfehler dürfen nicht als echte Treffer oder leere Suche erscheinen.
- [ ] Betroffene API-Verbraucher und OpenAPI-Schemas prüfen; keine pauschale Änderung auf neues Response-Envelope ohne vollständige Migration aller Aufrufer.

## Betroffene Dateien

- `src/lib/bgg.ts`: Suchfehler getrennt von erfolgreichem Leerresultat modellieren; keine synthetischen Catan-Treffer bei Providerfehler.
- `src/app/api/bgg/route.ts`, `src/app/api/bgg/search/route.ts`: valide Suchparameter, HTTP-Status/Retry-After und deutsches Fehlerobjekt.
- `src/app/(dashboard)/dashboard/bgg/page.tsx`, `src/app/(dashboard)/dashboard/games/import/page.tsx`, `src/app/(dashboard)/dashboard/series/[id]/add-game-dialog.tsx`, `src/app/(dashboard)/dashboard/series/[id]/series-bgg-search.tsx`, `src/app/(dashboard)/dashboard/groups/[id]/game-option-picker.tsx`, `src/app/(dashboard)/dashboard/events/[id]/voting/voting-client.tsx`, `src/app/(dashboard)/dashboard/events/[id]/voting/game-proposal-panel.tsx`: sichtbare Zustände je Suchoberfläche.
- `src/components/cover-scan-tab.tsx`, `src/components/barcode-results-panel.tsx`: bestehende Suche nicht mit Scan-/OCR-Leerzustand verwechseln; gezielt nur BGG-Suchergebniszustände vereinheitlichen.
- `src/components/public-event/use-bgg-search.ts`, `src/components/public-event/bgg-game-search.tsx`: Regressionstest/kleine Abweichungskorrektur, falls FEAT-014-Vertrag noch gilt.
- Neue shared Zustandskomponente/Hook nur, wenn UI-Verträge tatsächlich gleich sind: `src/components/bgg/bgg-search-state.tsx` und ggf. `use-authenticated-bgg-search.ts`.
- Tests: `tests/unit/lib/bgg.test.ts`, `tests/unit/api/bgg-route.test.ts`, `tests/unit/api/bgg-search.test.ts` (neu), `tests/unit/api/public-bgg.test.ts`, `tests/unit/components/bgg-game-search.test.tsx`, `tests/unit/components/use-bgg-search.test.tsx`, `tests/unit/components/bgg-import-editions.test.tsx`, `tests/unit/components/series-bgg-search.test.tsx` (neu), `tests/unit/components/game-option-picker.test.tsx` (neu), `tests/unit/components/event-voting-page-client.test.tsx` und bestehende Cover-/Barcode-Tests erweitern.
- `docs/openapi.yaml`, `docs/FEATURES.md`, `src/lib/faq.ts`, Backlog und Changelog.

## Aufgabe 1 – Providervertrag RED/GREEN/REFACTOR

- [ ] **RED:** Tests schreiben, die echte leere XML-Suche von HTTP-500, Netzwerkfehler, 202 nach ausgeschöpften Wiederholungen und 429 unterscheiden.
- [ ] **RED prüfen:** `npx vitest run tests/unit/lib/bgg.test.ts` schlägt bei bisherigem Verhalten fehl, das Fehler als `[]` oder synthetische Catan-Treffer liefert.
- [ ] **GREEN:** Erfolgreiches XML mit null Items ergibt `[]`; Provider-/Transportfehler werfen einen typisierten Fehler mit sicherem Status und optionalem RetryAfter. Keine API-Antwort behauptet Ergebnisse, die BGG nicht geliefert hat.
- [ ] **GREEN prüfen:** Bibliothekstest besteht; Logs enthalten keine Tokens oder unnötigen vollständigen URLs/Nutzereingaben.
- [ ] **REFACTOR:** XML-Parser bleibt getrennt vom Transportfehler; vorhandene Verzögerungen/Warteschleifen und BGG-Lastschutz behalten.

## Aufgabe 2 – Routeverträge RED/GREEN/REFACTOR

- [ ] **RED:** API-Tests für erfolgreiche `[]` (200), echte Treffer (200), ungültige/minimale/maximale Query, Providerfehler (5xx/503), Rate-Limit (429 + Retry-After) und Auth schreiben.
- [ ] **RED prüfen:** `npx vitest run tests/unit/api/bgg-route.test.ts tests/unit/api/public-bgg.test.ts` muss die fehlende Fehlerunterscheidung reproduzieren.
- [ ] **GREEN:** Bestehendes Arrayformat bei erfolgreicher Suche erhalten; Fehler immer `{ error: string }` und passende HTTP-Statuscodes. Öffentliche Event-Route gibt keine privaten Kontodaten zurück; Limits und Rate-Limits bleiben aktiv.
- [ ] **GREEN prüfen:** Routen- und öffentliche BGG-Vertragstests bestehen; `docs/openapi.yaml` passt zum echten Antwortvertrag.
- [ ] **REFACTOR:** Gemeinsame Fehlerabbildung verwenden, ohne öffentliche und authentifizierte Rechte zu vermischen.

## Aufgabe 3 – Oberflächenzustände RED/GREEN/REFACTOR

- [ ] **RED:** Für jede inventorierte Oberfläche gezielt Tests für „noch nicht gesucht“, Mindestlänge, Laden, echte 0 Treffer, Treffer, Providerfehler, Wiederholen und neue Suche während alter Anfrage ergänzen. Gemeinsame Zustände werden in drei Paketen getestet: Import/Reihe/Gruppe, Event/Öffentlich und Cover/Barcode.
- [ ] **RED prüfen:** `npx vitest run tests/unit/components/bgg-game-search.test.tsx tests/unit/components/use-bgg-search.test.tsx tests/unit/components/bgg-import-editions.test.tsx tests/unit/components/series-bgg-search.test.tsx tests/unit/components/game-option-picker.test.tsx tests/unit/components/event-voting-page-client.test.tsx tests/unit/components/cover-scan-tab.test.tsx tests/unit/components/barcode-results-panel.test.tsx` zeigt die fehlenden Zustände pro betroffener Oberfläche.
- [ ] **GREEN:** Text „Keine passenden Spiele gefunden. Ändere den Suchbegriff oder prüfe die Schreibweise.“ erst nach erfolgreichem HTTP-200-Leerresultat zeigen. Fehler erscheint mit erneutem Versuch; Loading und Resultatzahl mit `role=status`/`aria-live`, Fehler mit `role=alert`.
- [ ] Responses anhand Request-ID/AbortController abgrenzen; Ergebnisse einer alten Query dürfen neuere Treffer oder Leermeldung nicht überschreiben.
- [ ] **GREEN prüfen:** derselbe gezielte Komponentenbefehl besteht, FEAT-014-Ergebnis-/Fehler-/Retry-Verträge bleiben unverändert.
- [ ] **REFACTOR:** Zustandskomponente nur dann teilen, wenn Beschriftung/Interaktionen in authentifizierten und öffentlichen Flächen übereinstimmen; keine Änderung der jeweiligen Berechtigungslogik.

## Aufgabe 4 – Impeccable, Sicherheit und Abschluss

- [ ] Impeccable: lokale Webvorschau für Import, Reihen, Gruppe, Voting und öffentliche Eventseite; 390/1440 px, 200 % Zoom, Hell/Dunkel, Tastaturfokus, Screenreader-Status und Fehler/Leerzustände prüfen.
- [ ] Security: Auth auf geschützten Endpunkten, öffentliche Share-Token-Grenze, query length/encoding, Rate-Limits, Response-Größen und keine BGG-Credentials in Clientantworten testen.
- [ ] Doku: OpenAPI, FAQ, FEATURES und Backlog aktualisieren; fehlende Treffer und Providerfehler verständlich voneinander erklären.
- [ ] Abnahme: gezielte Tests, `npm run typecheck`, `npm run lint`, `npm run security-check:fast`, `npm run build`, `npm run review-evaluate:regression`; gerenderte Impeccable-Prüfung pro betroffenem Layout.
- [ ] Commit mit regulären Hooks; Review-Score, behobene Findings und Regressionsstatus in `docs/code-reviews/` nachführen.

**Freigabe:** Nicht erteilt. Inventar und Endpunktfehlervertrag vor Umsetzung aktualisieren und Umfang ausdrücklich freigeben lassen.
