# FEAT-025 – Reihenspiele unabhängig vom Sammlungsbesitz – Implementierungsplan

> **Für ausführende Agenten:** REQUIRED SUB-SKILLS: `test-driven-development` und `skills/testing/SKILL.md`; für Next.js/React `.agents/skills/next-best-practices/SKILL.md` sowie `.agents/skills/vercel-react-best-practices/SKILL.md` lesen. Vor dem Schemaeingriff Bestand und Datenbankmigration prüfen. Web zuerst; bestehende mobile DTOs kompatibel halten und native iOS-UI getrennt planen.

**Ziel:** Ein Spiel in einer Reihe führen können, ohne es dauerhaft in der eigenen Sammlung zu besitzen, und Fortschritt/Spielhistorie beim Entfernen aus der Sammlung erhalten.

**Architektur:** `GameSeriesEntry` wird zum eigenständigen Reihenobjekt mit gespeichertem Spiel-Snapshot und optionalem Verweis auf ein Sammlungsspiel. Bestehende Einträge werden per Migration mit Daten aus `Game` befüllt; vorhandene Sammlungsspiele bleiben verknüpft, temporäre BGG-Einträge erhalten keinen Sammlungsdatensatz. Entfernen eines Sammlungsspiels löst die Verknüpfung innerhalb einer Transaktion, bewahrt Snapshot und Reihe und lässt Sessions bestehen. „Temporär“ bedeutet keine automatische Ablaufzeit; der Eintrag bleibt bis zur ausdrücklichen Entfernung aus der Reihe.

**Technik:** Next.js 16, Prisma 7/PostgreSQL, additive Migration mit Backfill, NextAuth, Vitest, isolierte PostgreSQL-Abnahme.

**Planungsstand:** 03.11.2026, bei Erstellung HEAD `23cd674`. Aktualitätsprüfung und Umsetzungsfreigabe: 04.11.2026, HEAD `fcae557`, Version `0.50.75`, Arbeitsbaum vor Änderungen sauber. FEAT-024 ist inzwischen umgesetzt; Mehrfachauswahl führt weiterhin über denselben Series-POST, deshalb bleibt der Server der zentrale Eigentums-/Duplikatwächter. Schema ist unverändert: `GameSeriesEntry.gameId` ist verpflichtend, die Game-FK löscht bei physischem Delete mit; `GameService` nutzt Soft-Delete. Web- und iOS-DTOs erwarten weiterhin `gameId` und `entry.game` direkt. Das Konzept bleibt tragfähig; API-/DTO-Kompatibilität und Snapshot-Verwendung müssen auf alle bestehenden Verbraucher ausgeweitet werden. Die Umsetzung umfasst Schema, Quellmigration, Web/API und mobile Vertragskompatibilität; Migration wird erstellt und lokal geprüft, aber nicht in Produktion angewendet. Produktionsdaten werden nicht abgefragt.

### Aktualitätsprüfung vor Umsetzung – 04.11.2026

- **Geprüfter Stand:** `fcae557`; sauberer Arbeitsbaum vor dieser Dokumentation. Aktuelles Produktpaket 0.50.75.
- **Befund:** FEAT-024 ist umgesetzt und nutzt die bestehende Einzelanlage-Route. Das Schema besitzt weiter ein verpflichtendes `gameId`; die Dashboard-Seite, Entry-Karten, Such-/Duplikatprüfung, DTO-Mapper und Swift-DTO erwarten ein `game`-Objekt. `GameService.delete` und `bulkDelete` soft-deleten Spiele ohne vorherige Serienentkopplung.
- **Plananpassung:** Snapshot-Vertrag wird auch in Dashboard- und Sync-DTOs abgebildet; bestehende Web-/iOS-Clients bleiben mit optionalem `gameId`/`game` dekodierbar. FEAT-024s Mehrfachauswahl erhält Auswahl „in Sammlung importieren“ oder „nur in diese Reihe“ für BGG-Treffer.
- **Datenbankgrenze:** additive Migration mit Backfill und Constraints wird erstellt. Produktionsbestand/Produktionsmigration werden hier nicht abgefragt oder verändert; Anwendung der Migration bleibt ein gesonderter Deployschritt.
- **Freigabe:** Der Nutzer hat die Umsetzung mit „implementiere FEAT-025“ am 04.11.2026 ausdrücklich freigegeben. Freigegebener Umfang: Web zuerst, API/Schema/Migration und mobile DTO-Kompatibilität ohne iOS-UI.

---

## Aktualitätsprüfung vor Umsetzung

- [ ] HEAD/Schema/Migrationen und alle Verbraucher von `GameSeriesEntry.gameId` seit 03.11.2026 abgleichen.
- [ ] Produktionsdatenbestand ausschließlich lesend inventarisieren; Anzahl verwaister, soft-deleted oder doppelter Referenzen vor Migration dokumentieren.
- [ ] Festgelegte Zustände: „Aus Sammlung“ (verknüpft), „Temporär“ (Snapshot ohne `Game`), „Entkoppelt“ (ursprünglich verknüpft, aus Sammlung entfernt). „Ausgeliehen/mitgebracht/verkauft“ sind optionale Herkunftsnotizen, keine Lebensdauer- oder Löschbefehle.
- [ ] Lösch-/Aufbewahrungsregeln, Datenexport und mobile DTOs anhand der aktuellen API/iOS-Verträge bestätigen. Physisches Löschen, Datenbereinigung und Produktionsmigration benötigen getrennte Freigabe.
- [ ] Migration zuerst auf isoliertem PostgreSQL-Snapshot testen; niemals `db push` oder automatische Baseline als Ersatz.

## Datenvertrag und betroffene Dateien

- `prisma/schema.prisma`: `GameSeriesEntry.gameId String?`, `game Game?`, gespeicherte Felder `gameName`, `gameDescription`, `gameImageUrl`, `minPlayers`, `maxPlayers`, `playTimeMinutes`, `complexity`, `bggId`, `source` und optionale `temporaryReason`. `source` kennt `COLLECTION`, `TEMPORARY_BGG`, `DETACHED_COLLECTION`; `temporaryReason` erlaubt `BORROWED`, `BROUGHT_BY_SOMEONE`, `NO_LONGER_OWNED` oder `OTHER`, bleibt optional. Externe BGG-ID als String validieren.
- Neue Prisma-Migration unter `prisma/migrations/`, durch Prisma mit Zeitstempel erzeugt: nullable Verknüpfung, Snapshot-Spalten, Backfill aus `Game`, FK `ON DELETE SET NULL`; bestehenden Unique-Index für verknüpfte Games erhalten und partiellen Unique-Index für `(seriesId, bggId)` bei temporären BGG-Einträgen ergänzen.
- `src/lib/series/entry-identity.ts` (neu): normalisiert `collectionGameId` vs. temporäre BGG-Identität und prüft Duplikate.
- `src/app/api/series/[id]/entries/route.ts`, `src/app/api/series/[id]/entries/[entryId]/route.ts`, `src/app/api/series/[id]/entries/reorder/route.ts`: Anlage, Ausgabe, Änderung, Löschung und Sortierung auf Snapshot-Vertrag umstellen.
- `src/lib/services/game.service.ts`: `delete`/`bulkDelete` entkoppeln betroffene Einträge transaktional, bevor Sammlungseinträge soft-deleted werden.
- `src/app/(dashboard)/dashboard/series/[id]/page.tsx`, `types.ts`, `SeriesDetailClient.tsx`, `series-entry-card.tsx`, `series-entry-list.tsx`, `series-delete-dialogs.tsx`: Daten aus Snapshot rendern, Herkunft/Status zugänglich anzeigen.
- `BoardGameTools/BoardGameTools/Models/` und `Networking/`: mobile Vertragsmodelle gegen nullable `gameId`/Snapshot prüfen; notwendige reine Kompatibilitätsanpassung und Swift-Vertragstest, ohne iOS-Oberfläche.
- Tests: `tests/unit/lib/series/entry-identity.test.ts` (neu), `tests/unit/lib/services/game.service.test.ts` (neu), bestehende Series API/Komponententests erweitern; Migrationstest mit isolierter PostgreSQL.
- `docs/openapi.yaml`, `docs/FEATURES.md`, `CONCEPT.md`, `src/lib/faq.ts`, `AGENTS.md`, Backlog und Changelog aktualisieren.

## Aufgabe 1 – Fachliche Identität RED/GREEN/REFACTOR

- [ ] **RED:** Tests für Identität verknüpftes Spiel, temporäre BGG-ID, doppeltes temporäres Spiel derselben Reihe und doppelten Eigentümerverweis schreiben.
- [ ] **RED prüfen:** `npx vitest run tests/unit/lib/series/entry-identity.test.ts` scheitert zunächst, weil der Identitätsvertrag fehlt.
- [ ] **GREEN:** explizite Eingabe-Union definieren: `{ kind: "collection", gameId }` oder `{ kind: "temporary", bggId, reason?: "BORROWED" | "BROUGHT_BY_SOMEONE" | "NO_LONGER_OWNED" | "OTHER" }`; niemals vom Client gelieferte Eigentümer-/Snapshotwerte vertrauen.
- [ ] **GREEN prüfen:** Identitätstests bestehen; ungültige IDs und doppelte Auswahl ergeben klar unterscheidbare Validierungsergebnisse.
- [ ] **REFACTOR:** Helper ist unabhängig von Prisma und wird von Einzel- und Sammel-Route (FEAT-024) verwendet.

## Aufgabe 2 – Additive Schemaänderung und Migration RED/GREEN/REFACTOR

- [ ] **RED:** Integrationstest mit vorher angelegtem Game und GameSeriesEntry verlangt nach Backfill vollständige Snapshots; temporärer Eintrag mit `gameId: null` muss speicherbar sein.
- [ ] Migration erstellen mit `npx prisma migrate dev --create-only --name series_entry_game_snapshot`; SQL auf Backfill, Nullability, FK-Verhalten und Indizes prüfen.
- [ ] **GREEN:** Migration auf isolierter PostgreSQL-Datenbank anwenden, Prisma Client generieren und den Integrationstest ausführen. Bestehende Einträge behalten Fortschritt, Reihenfolge, Bewertungen und Spielmetadaten.
- [ ] Nicht nullable Daten während des Backfills nicht durch leere/falsche Standardwerte überschreiben; `gameName` muss aus dem zugehörigen Game kommen.
- [ ] **REFACTOR:** Constraints/Indizes an realer PostgreSQL-Semantik prüfen; mehrere `NULL`-Werte in Unique-Indizes nicht als Duplikatschutz missverstehen.

## Aufgabe 3 – API und Entkopplung RED/GREEN/REFACTOR

- [ ] **RED:** API-Tests für Eigentümergrenzen, temporäre Anlage ohne Game, Spiel aus fremder Sammlung, bereits verknüpfte/temporäre Duplikate und Erhalt von Fortschritt nach Sammlungsentfernung erstellen.
- [ ] **GREEN:** Authentifizierte Series-Route lädt temporäre BGG-Metadaten serverseitig und schreibt Snapshot; vorhandenes Sammlungsspiel referenziert dessen ID und Snapshot. Nur der Reihenbesitzer kann schreiben.
- [ ] **RED:** `game.service`-Tests fordern, dass Einzel- und Bulk-Softdelete unter einer Transaktion erst Snapshot-Aktualisierung/Entkopplung und dann Softdelete durchführen.
- [ ] **GREEN:** Entkopplung schützt Reihenstatus und Spielsessions; Fehler rollt alle Änderungen zurück. Physische Löschung wird nicht eingeführt.
- [ ] **GREEN prüfen:** `npx vitest run tests/unit/api/series-entry-conflict.test.ts tests/unit/api/series-crud.test.ts tests/unit/lib/services/game.service.test.ts` plus isolierte PostgreSQL-Migrationstests bestehen.
- [ ] **REFACTOR:** GET-/PUT-/DELETE-/Reorder-Antworten liefern einen gemeinsamen serialisierbaren `SeriesEntryDto`; sichere `select`-Projektionen statt kompletter Relations.

## Aufgabe 4 – Webdarstellung, Importwahl und Plattformvertrag

- [ ] **RED:** UI-Tests für Snapshot-Rendering nach Entkopplung, Herkunftskennzeichnung, temporäres Hinzufügen, Übernahme in Sammlung und Löschen nur des Reiheneintrags ergänzen.
- [ ] **GREEN:** Nutzende wählen sichtbar „Aus Sammlung“ oder „Nur für diese Reihe“. Temporäre Herkunft ist optional und erklärend; sie steuert kein automatisches Löschen. Temporäre Spiele erscheinen nicht in Sammlung, Sammlungsvorschlägen/Votings und Sammlungsstatistik. Der Hinweis beim Entfernen aus der Sammlung sagt wahrheitsgemäß, dass Reihe und Spielhistorie erhalten bleiben.
- [ ] **GREEN prüfen:** gezielte Komponenten-/API-Tests bestehen; Swift-Vertragstests prüfen Dekodierung bestehender und nullable mobile Payloads.
- [ ] **REFACTOR:** `<300` Zeilen pro neuem UI-Modul, bestehende Spielkarten und BGG-Validierung wiederverwenden.

## Aufgabe 5 – Impeccable, Security, Migration und Doku

- [ ] Impeccable: lokale gerenderte Prüfung beider Auswahlvarianten, Snapshotkarte, mobile Breite 390 px, 200 % Zoom, Hell/Dunkel, Statuskontrast, Fokus/VoiceOver und Fehler-/Leerstates. Keine Produktionsdaten verwenden.
- [ ] Security: Reihenbesitz für jede Mutation, Spielbesitz bei Link-Aufnahme, IDOR, valide BGG-ID, transaktionale Entkopplung, Datenminimierung und sichere Cacheinvalidierung testen.
- [ ] Migration: Backup-/Rollback-/Deploymentfolge dokumentieren; expand/backfill/verify/contract bei Bedarf in getrennte Deployschritte aufteilen. Migration nur explizit freigegeben deployen.
- [ ] Doku: API, Produktkonzept, FAQ, FEATURES und Status im Backlog; temporäre Spiele getrennt von Sammlung und Spielhistorie erklären.
- [ ] Abnahme: Unit + isolierte DB-Migrationstests, `npm run test:ios:contracts`, `npm run typecheck`, `npm run lint`, `npm run security-check:fast`, `npm run build`, `npm run review-evaluate:regression`; lokale gerenderte UI-Prüfung.
- [ ] Commit mit regulären Hooks; danach Review-Ergebnis und Regressionsstatus in `docs/code-reviews/` prüfen und dokumentieren.

**Freigabe:** Erteilt am 04.11.2026 für den in der Aktualitätsprüfung festgehaltenen Umfang. Produktionsmigration bleibt ausgenommen.

## Umsetzungsstand – 04.11.2026

- [x] Snapshotmodell, nullable Sammlungskante, Herkunft und partielle Duplikatsicherung implementiert; Migration erstellt.
- [x] Serienansichten, Suche, Karten, API und mobile Sync-DTOs auf Snapshotwerte umgestellt.
- [x] Temporäre BGG-Aufnahme ohne Sammlungseintrag sowie optionale Herkunftsauswahl (ausgeliehen, mitgebracht, nicht mehr im Besitz, Sonstiges) umgesetzt.
- [x] Einzel- und Bulk-Löschen entkoppeln Reihenbezüge transaktional und behalten Reihenfortschritt sowie Spielhistorie.
- [x] TDD-RED/GREEN für Identität, Snapshotdarstellung, Softdelete, API-Konflikte, mobile DTOs und UI-Aufnahme ausgeführt.
- [x] 1139/1139 Unit-Tests, Typecheck, Produktionsbuild, iOS-Vertragstests, Security-Check, Prisma-Validierung und Regressionsevaluator bestanden.
- [x] Impeccable: Vorschau mit synthetischen Daten bei Desktop- und 390-px-Breite gerendert; kein horizontaler Überlauf.
- [x] Changelog, FAQ, OpenAPI, FEATURES, CONCEPT, Backlog, AGENTS und Review-Dokumentation aktualisiert.
- [ ] Isolierter PostgreSQL-Migrationstest: mangels lokalem PostgreSQL/Docker nicht ausführbar. Migration ist nicht angewendet; vor Deployment erforderlich.
- [x] Commit `523360d`; Commit-Hooks für lint-staged ESLint/Tests, Security-Check und Review-Regression bestanden.

**Abnahmestand:** Anwendungscode und Dokumentation sind umgesetzt. Die Schemaquelle validiert; wegen fehlender isolierter PostgreSQL-Instanz ist die Migration noch nicht integrationsgeprüft. Keine Produktionsdaten abgefragt, keine Migration angewendet.
