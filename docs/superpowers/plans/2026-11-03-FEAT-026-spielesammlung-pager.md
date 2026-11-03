# FEAT-026 – Seitennavigation in der Spielesammlung – Implementierungsplan

> **Für ausführende Agenten:** REQUIRED SUB-SKILLS: `test-driven-development` und `skills/testing/SKILL.md`; für Next.js/React `.agents/skills/next-best-practices/SKILL.md` sowie `.agents/skills/vercel-react-best-practices/SKILL.md` lesen. Webumfang `/dashboard/games`; vorhandene Filter, Sortierung und Server-Paginierung zuerst als Vertrag erfassen. iOS ist nicht Teil dieser Oberfläche.

**Ziel:** Große Sammlungen in klar navigierbare Seiten aufteilen, ohne Filter, Sortierung oder Aktionen zu verlieren.

**Architektur:** Serverseitige Paginierung wird verwendet, da `/api/games` und `GameService.list` sie bereits unterstützen, während die aktuelle Server-Seite alle Spiele lädt. Suche, Tag, Spielerzahl, Komplexität und Sortierung werden als validierte Query-Parameter ausgewertet; Gesamtzahl wird nach Filterung berechnet und Seitenzustand in der URL gehalten. Eine stabile sekundäre ID-Sortierung verhindert Sprünge bei gleichen Sortierwerten.

**Technik:** Next.js App Router, Prisma, `GameService`, URLSearchParams, React, Vitest/Testing Library, Playwright für gerenderte Viewport-Abnahme.

**Planungsstand:** 03.11.2026, HEAD `23cd674`, Version 0.50.67, Arbeitsbaum vor dieser Dokuänderung sauber. `/dashboard/games` lädt aktuell alle aktiven Spiele samt Tags und Sessionzähler serverseitig; Filter und Sortierung laufen im Client. `GET /api/games` und `GameService.list` haben bereits `page`/`limit` mit 1-basierter Seite, aber keinen Filtervertrag. Der neue Sammlungsabruf muss Tags/Zähler und Gesamtumfang mitliefern.

---

## Aktualitätsprüfung vor Umsetzung

- [ ] HEAD, Datenmenge, `GameService.list`, Cache-Tags und bestehende API-Paginierung prüfen.
- [ ] Sicherstellen, ob FEAT-025 Änderungen an Sammlungslöschung/Abfragen berühren; Filter nur für aktive Sammlungsdatensätze verwenden.
- [ ] Seitenlimit 24 als Startwert gegen reale Cover-/Kartengröße prüfen; API-Maximum bleibt 100.
- [ ] URL-Vertrag festlegen: `page` beginnt bei 1; die bestehende `buildPagination`-Funktion erwartet ebenfalls positive, 1-basierte Seiten und berechnet den Offset. Dashboard-Anfragen senden immer `page` und `limit`; Aufrufer ohne diese Parameter behalten vorerst die bestehende unpagierte Antwort.

## Betroffene Dateien

- `src/app/(dashboard)/dashboard/games/page.tsx`: Filter-/Page-Query serverseitig laden, nicht alle Spiele ins Client-Bundle serialisieren.
- `src/app/api/games/route.ts`: validierte Filter- und Sortierparameter (oder separater reiner GET-Query-Parser).
- `src/lib/services/game.service.ts`: Filter/Sortierung mit Eigentümerfilter und `count` auf identischer WHERE-Klausel.
- `src/app/(dashboard)/dashboard/games/games-list-client.tsx`: Pager, URL-Update, Filter-/Sortierzustand und Aktions-Rücksprung.
- `src/app/(dashboard)/dashboard/games/collection-filters.tsx`: bestehende Controls kontrolliert an URL-/Serverzustand binden.
- `src/components/ui/pagination.tsx` (nur falls vorhandene Komponente nicht passt; zuerst Bestand prüfen).
- Tests: `tests/unit/lib/services/game.service.test.ts` (neu), `tests/unit/api/games.test.ts` erweitern, `tests/unit/components/games-list-client.test.tsx` erweitern; Server-Page-Test dort ergänzen, wo App Router testbar ist.
- `docs/openapi.yaml`, `docs/FEATURES.md`, FAQ und Changelog (Umsetzung), Backlog.

## Aufgabe 1 – Filtervertrag RED/GREEN/REFACTOR

- [ ] **RED:** Service-Tests für Filter + Count mit gleichem Eigentümer-/deletedAt-Filter und stabilem Sortieren bei gleichen Namen schreiben.
- [ ] **RED prüfen:** `npx vitest run tests/unit/lib/services/game.service.test.ts` muss am bisher nicht implementierten Filtervertrag scheitern.
- [ ] **GREEN:** Query-Parser akzeptiert nur begrenzte Suchlänge, bekannte Tags, Spielerzahl 1–99, Komplexität 1–5, erlaubte Sortierschlüssel und positive Seitennummer. Ungültige Werte geben 400 oder sichere Defaults gemäß dokumentiertem Vertrag.
- [ ] `GameService.list` liefert `{ items, total, page, limit, totalPages }`; dieselbe `where`-Bedingung wird für `findMany` und `count` verwendet. Reihenfolge nutzt gewählten Wert und `id` als eindeutigen Tie-Breaker.
- [ ] **GREEN prüfen:** Test für Filter-/Sortier-Kombination, Nullwerte, leere Seite und totalPages=0 besteht.
- [ ] **REFACTOR:** vorhandene Pagination-Utilities und `NOT_DELETED` wiederverwenden; unpaginierten API-Vertrag für andere Dialoge erhalten, bis alle Verbraucher migriert sind.

## Aufgabe 2 – URL-gesteuerte Oberfläche RED/GREEN/REFACTOR

- [ ] **RED:** UI-Tests für „Nächste Seite“, „Zurück“, erste/letzte Seite, leere Ergebnisse, Filterwechsel setzt Seite auf 1, Löschen/Import/Refresh erhalten Filter und gültige Seite schreiben.
- [ ] **RED prüfen:** `npx vitest run tests/unit/components/games-list-client.test.tsx` scheitert zunächst an fehlendem Pager-/URL-Vertrag.
- [ ] **GREEN:** Links/Buttons mit klarer Beschriftung, Anzahl „Seite X von Y“ und deaktivierten Randaktionen ergänzen. Filter/Suche/Sortierung bleiben in URL und werden serverseitig geladen.
- [ ] Wenn ein Löschen die letzte Seite leert, auf die dann letzte gültige Seite zurückwechseln; bei Import und Filterwechsel `page=1`.
- [ ] **GREEN prüfen:** UI-Tests und `npx vitest run tests/unit/api/games.test.ts tests/unit/lib/services/game.service.test.ts` bestehen.
- [ ] **REFACTOR:** Paging-Zustand und Query-Serialisierung in kleinen typisierten Helpers halten; bestehende Filterbedienung nicht duplizieren.

## Aufgabe 3 – Impeccable, Performance, Security und Doku

- [ ] Impeccable: lokal gerendert auf 390/768/1440 px und bei 200 % Zoom prüfen; Pager nicht horizontal überlaufen lassen, Fokusreihenfolge/ARIA und mindestens 44 px große Hauptaktionen sicherstellen. Lade-/Fehler-/Leerseite darstellen.
- [ ] Security: Auth und Eigentümerfilter bleiben serverseitig; Querylängen, numerische Limits, Sortier-Whitelist und Tag-ID-Ownership prüfen. Keine dynamische Prisma-Sortierung aus ungeprüfter Eingabe.
- [ ] Performance: Count und Items effizient abfragen; keine Gesamtmenge in Client übertragen; `EXPLAIN`/Indexbedarf mit Datenbestand beurteilen, keine ungeprüften Schemaänderungen.
- [ ] OpenAPI Query-Parameter und Antwortschema, FEATURES/FAQ und Backlog aktualisieren.
- [ ] Abnahme: gezielte Tests, `npm run typecheck`, `npm run lint`, `npm run security-check:fast`, `npm run build`, `npm run review-evaluate:regression`; Browserbelege mit kleinen und großen Datensätzen aus synthetischen Fixtures.
- [ ] Commit mit regulären Hooks; Review-Ergebnis, Finding-Status und Regressionen in `docs/code-reviews/` nachvollziehen.

**Freigabe:** Nicht erteilt. Vor Umsetzung Query-/URL-Vertrag und Seitenumfang ausdrücklich freigeben lassen.
