# FEAT-024 – Mehrere Spiele zu einer Reihe hinzufügen – Implementierungsplan

> **Für ausführende Agenten:** REQUIRED SUB-SKILLS: `test-driven-development` und `skills/testing/SKILL.md`; für Next.js/React `.agents/skills/next-best-practices/SKILL.md` sowie `.agents/skills/vercel-react-best-practices/SKILL.md` lesen. Schritte einzeln abarbeiten. Den Webumfang erst nach Umsetzung und Aktualitätsprüfung von FEAT-025 beginnen; native iOS-Oberflächen sind separat zu planen.

**Ziel:** Mehrere Sammlungs- oder BGG-Spiele in einem Durchgang einer Spielreihe hinzufügen und Teilergebnisse verständlich verwalten.

**Architektur:** Die Auswahl bleibt im Dialog als geordnete Liste stabil, auch wenn Suchbegriff oder Quelle wechseln. Ein begrenzter Sammel-Endpunkt verarbeitet jeden Eintrag unabhängig und liefert pro Position einen eindeutigen Status; ein Fehler eines BGG-Eintrags rollt erfolgreiche Sammlungseinträge nicht zurück. Die endgültige Eintragsidentität muss aus FEAT-025 übernommen werden.

**Technik:** Next.js 16 Route Handler, Prisma, React, TypeScript, Vitest/Testing Library, Playwright für nicht schreibende Darstellung; vorhandene BGG-Ratenlimits.

**Planungsstand:** 03.11.2026, HEAD `23cd674`, Version 0.50.67, Arbeitsbaum vor dieser Dokuänderung sauber. FEAT-023 ist umgesetzt; der aktuelle Add-Dialog fügt je einen Eintrag hinzu und erwartet `gameId` oder `bggId`. `GameSeriesEntry` verlangt derzeit ein `gameId`; deshalb muss FEAT-025 vor der Mehrfachauswahl umgesetzt werden.

---

## Aktualitätsprüfung vor Umsetzung

- [ ] HEAD, Arbeitsbaum, Schema, API-Verträge und zwischenzeitliche Änderungen seit 03.11.2026 prüfen.
- [ ] FEAT-025 ist umgesetzt oder sein Datenvertrag wurde ausdrücklich freigegeben. Andernfalls Mehrfachauswahl nicht implementieren.
- [ ] Bestätigte Obergrenze von 20 Einträgen pro Anfrage, Reihenfolge der Auswahl und maximal zwei gleichzeitige BGG-Abrufe erneut prüfen. Bei höherer BGG-Last sequenziell verarbeiten.
- [ ] Umfang bleibt Web. Mobile-API-DTOs auf Kompatibilität prüfen und iOS-UI unverändert separat planen.
- [ ] Prüfen, ob ein Bulk-Endpunkt weiterhin vorteilhafter ist als begrenzte Einzelrequests. Die Empfehlung gilt nur, wenn partielle Ergebnisse stabil/idempotent zurückgegeben werden.

## Betroffene Dateien

- `src/app/(dashboard)/dashboard/series/[id]/add-game-dialog.tsx`: Auswahl über Sammlung/BGG und sichtbare Anzahl.
- `src/app/(dashboard)/dashboard/series/[id]/series-bgg-search.tsx`: Trefferzustand und Hinzufügen-zur-Auswahl-Aktion.
- `src/app/(dashboard)/dashboard/series/[id]/use-series-game-add.ts`: Sammelrequest, Ergebniszuordnung, Wiederholen.
- `src/app/api/series/[id]/entries/bulk/route.ts` (neu): Auth, Eigentümerprüfung, Begrenzung, individuelle Ergebnisse.
- `src/lib/series/bulk-add-entries.ts` (neu): deterministische, unabhängig testbare Verarbeitung je Eintrag.
- `src/lib/series/entry-identity.ts` (FEAT-025-Vertrag): Eingabe-/Identitätsnormalisierung wiederverwenden, nicht duplizieren.
- `tests/unit/lib/series/bulk-add-entries.test.ts` (neu), `tests/unit/api/series-bulk-entries.test.ts` (neu), `tests/unit/components/series-bulk-add.test.tsx` (neu).
- `docs/openapi.yaml`, `docs/FEATURES.md`, `src/lib/faq.ts`, `src/lib/changelog.ts`, `docs/FEATURE-BACKLOG.md`.

## Aufgabe 1 – Sammelvertrag RED/GREEN/REFACTOR

- [ ] **RED:** Verarbeitungstest für drei Positionen schreiben: zwei erfolgreich, eine bereits vorhanden; Reihenfolge und drei unterschiedliche Resultate müssen der Eingabe entsprechen.
- [ ] **RED prüfen:** `npx vitest run tests/unit/lib/series/bulk-add-entries.test.ts` muss wegen des fehlenden Helpers scheitern.
- [ ] **GREEN:** Jedes Element unabhängig validieren; maximal 20 akzeptieren; Collection-IDs gegen angemeldeten Eigentümer und aktive Spiele prüfen; BGG-IDs validieren; Duplikate im Request und bereits vorhandene Einträge als `already_present` zurückgeben. Response-Vertrag: `{ results: Array<{ index: number; status: "added" | "already_present" | "failed"; entry?: SeriesEntryDto; error?: string }> }`.
- [ ] BGG-Abrufe begrenzen, nur für gültige nicht vorhandene BGG-IDs ausführen und keine Netzwerkoperation innerhalb einer Prisma-Transaktion starten. Fehlertexte dürfen keine fremden Datensätze offenlegen.
- [ ] **GREEN prüfen:** gezielter Lib-Test besteht für Reihenfolge, Teilfehler, doppelte Auswahl, Maximalgröße und Abbruch/Rate-Limit.
- [ ] **REFACTOR:** gemeinsame Einzelanlage aus `POST /api/series/[id]/entries` wiederverwenden, ohne den bestehenden Einzelvertrag zu ändern.

## Aufgabe 2 – Geschützten API-Endpunkt RED/GREEN/REFACTOR

- [ ] **RED:** Route-Tests für unauthentifizierte Anfrage (401), fremde/gelöschte Reihe (404), >20 Einträge (400), fremde Sammlungsspiel-ID (404/400 gemäß bestehendem API-Vertrag) und Teilresultate ergänzen.
- [ ] **RED prüfen:** `npx vitest run tests/unit/api/series-bulk-entries.test.ts` schlägt zunächst bei fehlendem Endpunkt fehl.
- [ ] **GREEN:** `POST /api/series/[id]/entries/bulk` verlangt Auth, prüft Reihenbesitz einmal und Berechtigung je Sammlungsspiel, validiert Body strikt, begrenzt Rate und Payload. Der Endpunkt gibt HTTP 200 mit einzelnem Resultatstatus für fachliche Teilerfolge zurück; ungültiger Gesamtbody gibt 400.
- [ ] Gleichzeitige Requests dürfen keine doppelten Einträge erzeugen; DB-Unique-Konflikt wird als `already_present` normalisiert. Cache der Reihe nach Änderungen invalidieren.
- [ ] **GREEN prüfen:** `npx vitest run tests/unit/api/series-bulk-entries.test.ts tests/unit/api/series-entry-conflict.test.ts` besteht.
- [ ] **REFACTOR:** sichere DTO-Projektion verwenden; keine ungefilterten `user`-/`createdBy`-Relations zurückgeben.

## Aufgabe 3 – Mehrfachauswahl und Nutzerfeedback RED/GREEN/REFACTOR

- [ ] **RED:** Komponententests schreiben für Auswahl aus beiden Tabs, Auswahl erhalten nach Suchbegriffwechsel, Anzahl/Entfernen, Reihenfolge, laufende Anfrage, Teilerfolg und gezieltes Wiederholen fehlgeschlagener Zeilen.
- [ ] **RED prüfen:** `npx vitest run tests/unit/components/series-bulk-add.test.tsx` muss am bisherigen Einzel-Auswahlvertrag scheitern.
- [ ] **GREEN:** Zeilen per stabiler FEAT-025-Identität auswählen; Button zeigt Anzahl, bei 0 Auswahl deaktiviert. Je Zeile Status „Hinzugefügt“, „Bereits enthalten“ oder verständlicher Fehler; nur fehlgeschlagene Elemente sind wiederholbar.
- [ ] Erfolgreiche Einträge nicht erneut senden, auch wenn andere Einträge fehlschlagen. Während des Requests Mehrfachabsendung verhindern; Dialog bei Teilfehlern offen lassen.
- [ ] **GREEN prüfen:** `npx vitest run tests/unit/components/series-bulk-add.test.tsx tests/unit/components/series-entry-conflict.test.tsx` besteht.
- [ ] **REFACTOR:** Zustände in fokussierte Auswahl-/Ergebnis-Komponenten aufteilen; jede Datei möglichst unter 300 Zeilen.

## Aufgabe 4 – Impeccable, Sicherheit und Abnahme

- [ ] Impeccable: lokale Vorschau mit synthetischen API-Antworten. Prüfen 390 px, Desktop, 200 % Zoom, Tastaturfokus, Screenreader-Ankündigung der Anzahl/Teilergebnisse und Touch-Ziele mindestens 44 px; keine DB-Schreibtests im Browser ohne isolierte Testdatenbank.
- [ ] Security: Auth vor Schreibzugriff, Reihen- und Spielbesitz, Größen-/Ratenbegrenzung, BGG-ID-Validierung, URL-/Providerfehler, keine Datenlecks und idempotente Konfliktbehandlung testen.
- [ ] API-Vertrag in `docs/openapi.yaml`; Bedienung in FEATURES/FAQ; Backlog auf „Plan erstellt; Umsetzung nicht freigegeben“ verlinken; Changelog bei späterer Umsetzung.
- [ ] Abnahme: gezielte Lib/API/UI-Tests, `npm run typecheck`, `npm run lint`, `npm run security-check:fast`, `npm run build`, `npm run review-evaluate:regression`; lokaler gerenderter Impeccable-Nachweis.
- [ ] Commit mit regulären Hooks; Review-Evaluator-Score, Finding-Status und Regressionscheck in `docs/code-reviews/` dokumentieren.

**Freigabe:** Nicht erteilt. Vor Umsetzung Planaktualität erneut protokollieren und Umfang ausdrücklich freigeben lassen.
