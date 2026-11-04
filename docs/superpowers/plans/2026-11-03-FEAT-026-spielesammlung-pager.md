# FEAT-026 – Seitennavigation in der Spielesammlung – Implementierungsplan

> **Für ausführende Agenten:** REQUIRED SUB-SKILLS: `test-driven-development` und `skills/testing/SKILL.md`; für Next.js/React `.agents/skills/next-best-practices/SKILL.md` sowie `.agents/skills/vercel-react-best-practices/SKILL.md` lesen. Webumfang `/dashboard/games`; vorhandene Filter, Sortierung und Server-Paginierung zuerst als Vertrag erfassen. iOS ist nicht Teil dieser Oberfläche.

**Ziel:** Große Sammlungen in klar navigierbare Seiten aufteilen, ohne Filter, Sortierung oder Aktionen zu verlieren.

**Architektur:** Serverseitige Paginierung wird verwendet, da `/api/games` und `GameService.list` sie bereits unterstützen, während die aktuelle Server-Seite alle Spiele lädt. Suche, Tag, Spielerzahl, Komplexität und Sortierung werden als validierte Query-Parameter ausgewertet; Gesamtzahl wird nach Filterung berechnet und Seitenzustand in der URL gehalten. Eine stabile sekundäre ID-Sortierung verhindert Sprünge bei gleichen Sortierwerten.

**Technik:** Next.js App Router, Prisma, `GameService`, URLSearchParams, React, Vitest/Testing Library, Playwright für gerenderte Viewport-Abnahme.

**Planungsstand:** 03.11.2026, HEAD `23cd674`, Version 0.50.67. **Aktualitätsprüfung und Umsetzungsfreigabe:** 04.11.2026, HEAD `f1fc945`, Version `0.50.76`, Arbeitsbaum zu Beginn der Umsetzung sauber. `/dashboard/games` lud alle aktiven Spiele samt Tags und Sessionzähler; Filter/Sortierung liefen clientseitig. `GET /api/games` und `GameService.list` unterstützten 1-basierte `page`/`limit`, jedoch ohne Filtervertrag. FEAT-025 wurde inzwischen umgesetzt: `GameService` entkoppelt beim Löschen Reihenbezüge transaktional; keine Änderung am Game-Filtermodell. Freigegeben: Web-Sammlung, serverseitige Suche/Filter/Sortierung und Paging mit 24 Spielen pro Seite; URL-Zustand. Die bestehende Aktion „Alle Spiele entfernen“ muss weiterhin über alle Seiten gelten.

---

## Aktualitätsprüfung vor Umsetzung – 04.11.2026

- [x] HEAD `f1fc945`, `GameService.list`, API-Pagination und Filter-/Tagmodell geprüft; lokale Datenmenge nicht in eine Produktionsabfrage überführt.
- [x] FEAT-025-Lösch-/Entkopplungsverhalten geprüft; Listenfilter verwenden ausschließlich aktive, dem Nutzer gehörende Spiele und eigene Tags.
- [x] Seitenlimit 24 bestätigt; API-Aufrufer können `limit` weiter bis 100 anfordern.
- [x] URL-Vertrag: `page` 1-basiert; Dashboard lädt mit `page`/`limit`. API-Aufrufe ohne Paging-/Filterparameter behalten die unpagierte Antwort.
- [x] Umsetzungsfreigabe durch „setze FEAT-026 um“ am 04.11.2026.

## Betroffene Dateien

- `src/app/(dashboard)/dashboard/games/page.tsx`: Filter-/Page-Query serverseitig laden, nicht alle Spiele ins Client-Bundle serialisieren.
- `src/app/api/games/route.ts`: validierte Filter- und Sortierparameter (oder separater reiner GET-Query-Parser).
- `src/lib/services/game.service.ts`: Filter/Sortierung mit Eigentümerfilter und `count` auf identischer WHERE-Klausel.
- `src/app/(dashboard)/dashboard/games/games-list-client.tsx`: Pager, URL-Update, Filter-/Sortierzustand und Aktions-Rücksprung.
- `src/app/(dashboard)/dashboard/games/collection-filters.tsx`: bestehende Controls kontrolliert an URL-/Serverzustand binden.
- `src/app/(dashboard)/dashboard/games/games-pagination.tsx` und `games-list-overlays.tsx`: Pager plus getrennte Dialog-/Scanner-Oberfläche.
- `src/lib/game-list-query.ts`: begrenzter Queryparser und URL-Serialisierung.
- Tests: `tests/unit/lib/game-list-query.test.ts`, `tests/unit/components/games-pagination.test.tsx`, `tests/unit/api/games-bulk-delete.test.ts` (neu), `tests/unit/lib/services/game.test.ts`, `tests/unit/api/games.test.ts` und `tests/unit/components/games-list-client.test.tsx` erweitert.
- `docs/openapi.yaml`, `docs/FEATURES.md`, FAQ und Changelog (Umsetzung), Backlog.

## Aufgabe 1 – Filtervertrag RED/GREEN/REFACTOR

- [x] **RED:** Service- und Parserverträge für Filter, Count, Nullwerte, stabile Sortierung, Grenzen und Seitenkorrektur testgetrieben ergänzt.
- [x] **RED prüfen:** Die Service-Tests scheiterten zunächst an fehlenden Filtern/Seitengrenzen; der neue Parser-Test scheiterte an fehlendem Modul.
- [x] **GREEN:** Parser begrenzt Suchtext, Tag-ID, Spielerzahl, Komplexität, Sortierschlüssel, Seite und API-Limit; fehlerhafte Werte erhalten sichere Defaults. Service filtert eigene aktive Spiele und eigene Tags.
- [x] `GameService.list` liefert paginierte `{ data, total, page, limit, totalPages }`; Count/Items nutzen identische Bedingungen und stabile ID-Auflösung.
- [x] **GREEN prüfen:** Filter-/Sortierkombination, leere Seite, `totalPages=0`, Out-of-range-Seiten und API-Altvertrag sind getestet.
- [x] **REFACTOR:** `NOT_DELETED`, `buildPagination`, `paginatedResponse` wiederverwendet; Aufrufe ohne Paging-/Filterparameter behalten die vollständige Listenantwort.

## Aufgabe 2 – URL-gesteuerte Oberfläche RED/GREEN/REFACTOR

- [x] **RED:** UI-Verträge für Pager, Seitenbereich, Randaktionen, Filterwechsel und Query-Erhalt ergänzt.
- [x] **RED prüfen:** Pager-Komponententest scheiterte zunächst am fehlenden Modul; Service-/UI-Tests zeigten fehlende Filter- und Pagerzustände.
- [x] **GREEN:** beschriftete Vor/Zurück-Navigation, Ergebnisbereich, Gesamtzahl, URL-Filter und Page-1-Reset implementiert.
- [x] Löschung/Import aktualisieren serverseitig die Seite; übergroße Seiten werden auf die letzte gültige Seite umgeleitet. Filterwechsel setzt die Seite auf 1.
- [x] **GREEN prüfen:** gezielte API-, Service-, Parser-, Pager- und Clienttests bestanden.
- [x] **REFACTOR:** typisierte Parser-/Serializer-Helper; Filterzustand und Dialog/Scanner in angemessene Module aufgeteilt.

## Aufgabe 3 – Impeccable, Performance, Security und Doku

- [x] Impeccable: lokal synthetisch bei 1440/768/390/320 CSS px und 195 CSS px als Zoom-Proxy gerendert. Keine horizontalen Überläufe; bei 195 px Pager-Aktionen vertikal und erreichbar, Hauptaktionen mindestens 44 px.
- [x] Security: Auth bleibt erforderlich, WHERE enthält Eigentümer-/Soft-Deletefilter, Tag gehört zum Nutzer, Werte sind begrenzt und Sortierung allowlisted. Bulk-Delete-all führt nur eigene aktive Datensätze in einer Transaktion aus.
- [x] Performance: nur 24 Spiele und die gefilterte Gesamtzahl gelangen in die Seite; keine ungeprüfte Schemaänderung. DB-EXPLAIN mangels lokaler isolierter DB nicht ausgeführt.
- [x] OpenAPI, FEATURES, FAQ, CONCEPT, AGENTS, Changelog und Backlog aktualisiert.
- [x] Abnahme: 1.151 Tests in 167 Dateien, TypeScript, Produktionsbuild, Security-Check und `npm audit --omit=dev` (0 Vulnerabilities) bestanden. ESLint: 0 Fehler, 652 vorhandene Warnungen aus Prüfscripts. Browsernachweise mit synthetischen 24er-/60er Fixtures bei 1440/768/390/320/195 CSS px.
- [x] Review-Regressionscheck mit Registryzugriff: Exitcode 0, 10/10 gesamt und Sicherheit, 0 offene Findings, keine Regression; Snapshot `history/2026-11-04_0942.json`.
- [ ] Commit mit regulären Hooks.

**Freigabe:** Erteilt am 04.11.2026 durch „setze FEAT-026 um“ für den oben aktualisierten Webumfang.
