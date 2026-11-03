# FEAT-024 – Mehrere Spiele zu einer Reihe hinzufügen – Implementierungsplan

> **Für ausführende Agenten:** REQUIRED SUB-SKILLS: `test-driven-development` und `skills/testing/SKILL.md`; für Next.js/React `.agents/skills/next-best-practices/SKILL.md` sowie `.agents/skills/vercel-react-best-practices/SKILL.md` lesen. Schritte einzeln abarbeiten. Native iOS-Oberflächen sind separat zu planen.

**Ziel:** Mehrere Sammlungs- oder BGG-Spiele in einem Durchgang einer Spielreihe hinzufügen und Teilergebnisse verständlich verwalten.

**Architektur:** Die Auswahl bleibt im Dialog als geordnete Liste stabil, auch wenn Suchbegriff oder Quelle wechseln. Zum Hinzufügen ruft der Client den bestehenden Einzelendpunkt nacheinander auf; dadurch bleiben Eigentümerprüfung, Konfliktvertrag und die pro Spiel sichtbaren Teilergebnisse erhalten, ohne FEAT-025 oder einen neuen Bulk-Endpunkt vorauszusetzen. BGG-Spiele ohne Sammlungsfund behalten in FEAT-024 das heutige Verhalten und werden beim Reihenimport dauerhaft in die Sammlung übernommen; FEAT-025 ändert diese Semantik später separat.

**Technik:** Next.js 16, vorhandene Series-POST-Route, React, TypeScript, Vitest/Testing Library, Playwright für die lokale Darstellung; BGG-Anfragen seriell und begrenzt.

## Aktualitätsprüfung unmittelbar vor Umsetzung

**Geprüft:** 03.11.2026, HEAD `6cf2032`, Version 0.50.68, Arbeitsbaum sauber.
FEAT-023 ist umgesetzt; FEAT-025 ist geplant, aber nicht umgesetzt. `GameSeriesEntry.gameId` bleibt erforderlich und die Series-POST-Route validiert Eigentum und BGG-ID für jeden Eintrag. Der Add-Dialog fügt aktuell ein Spiel hinzu, und sein erfolgreicher Callback lädt die Reihe neu und schließt den Dialog.

**Ergebnis: innerhalb des freigegebenen Umfangs angepasst.** Der Nutzer hat am 03.11.2026 ausdrücklich den Start von FEAT-024 vor FEAT-025 angewiesen. Die Auswahl-/Sammel-API kann ohne Datenmodelländerung umgesetzt werden, indem maximal 20 Einträge seriell über die vorhandene POST-Route verarbeitet werden. Damit bleiben pro Eintrag Auth, Eigentümerprüfung, Fehlerstatus und Konfliktschutz erhalten. Es wird kein neuer API-Endpunkt eingeführt. BGG-Treffer, die nicht in der Sammlung vorhanden sind, werden weiterhin wie bisher als permanente Sammlungsspiele importiert. Temporäre Reihenspiele, Schemaänderungen und iOS bleiben FEAT-025 beziehungsweise separaten Plänen vorbehalten.

---

## Umsetzungsnachweis

**Abgeschlossen:** 03.11.2026, Version 0.50.69. Plan vor Arbeitsbeginn anhand
HEAD `6cf2032`, Schema, Series-POST und FEAT-023-Verhalten geprüft. Die einzige
Plananpassung war die ausdrückliche Reihenfolge vor FEAT-025; keine API- oder
Schemaänderung erforderlich.

- [x] Serielle Verarbeitung mit stabilen IDs, 201/409/Fehlerbehandlung und Netzwerkfehler-Fortsetzung.
- [x] Mehrfachauswahl für Sammlung und BGG, gemeinsame ID für bereits vorhandene Sammlungsspiele, max. 20.
- [x] Auswahl bleibt beim Such- und Quellenwechsel im geöffneten Dialog bestehen.
- [x] Einzelauswahl bleibt verfügbar; Teilergebnisse und Retry nur für fehlgeschlagene Einträge umgesetzt.
- [x] Erfolgreiche und bereits vorhandene Einträge werden nach einmaligem Neuladen der Reihe bestätigt.
- [x] Security: kein neuer Endpunkt; jeder Eintrag durchläuft weiter die bestehende authentifizierte und eigentumsgeprüfte Route.
- [x] Backlog, FEATURES, FAQ, Changelog und Paketversion aktualisiert. OpenAPI/Schema unverändert.

## Aktualitätsprüfung vor Umsetzung

- [x] HEAD, Arbeitsbaum, Schema, API-Vertrag und zwischenzeitliche FEAT-023-Implementierung geprüft.
- [x] FEAT-025-Abhängigkeit entfernt, weil der freigegebene FEAT-024-Umfang über die vorhandene Einzelroute erfüllbar ist; die Besitzsemantik bleibt unverändert.
- [x] Maximal 20 Einträge pro Durchgang; Requests seriell, in Auswahlreihenfolge und ohne parallele BGG-Abfragen.
- [x] Webumfang bestätigt. Es gibt keinen neuen API-Vertrag; iOS bleibt separat.

## Betroffene Dateien

- `src/app/(dashboard)/dashboard/series/[id]/add-game-dialog.tsx`: Auswahl über Sammlung/BGG und bestehende Einzelauswahl.
- `src/app/(dashboard)/dashboard/series/[id]/series-bgg-search.tsx`: BGG-Treffer auswählen, Duplikate sperren und Einzelauswahl erhalten.
- `src/app/(dashboard)/dashboard/series/[id]/series-game-selection-summary.tsx`: Auswahlanzahl, Status und Retry-Interaktion.
- `src/app/(dashboard)/dashboard/series/[id]/use-series-game-add.ts`: vorhandene Einzelroute seriell aufrufen, Fortschritt/Resultate melden.
- `src/app/(dashboard)/dashboard/series/[id]/SeriesDetailClient.tsx`, `use-series-handlers.ts`: nach dem Durchgang einmal aktualisieren und alle erfolgreichen Eingaben bestätigen, ohne bei Teilergebnissen den Dialog zu schließen.
- `src/lib/series/bulk-add-entries.ts` (neu): kleine, deterministische Sequenzverarbeitung mit injizierbarem Request.
- `tests/unit/lib/series/bulk-add-entries.test.ts` (neu), `tests/unit/components/series-bulk-add.test.tsx` (neu), `tests/unit/components/series-entry-conflict.test.tsx` erweitern.
- `docs/FEATURE-BACKLOG.md`, `docs/FEATURES.md`, `src/lib/faq.ts`, `src/lib/changelog.ts`; OpenAPI bleibt unverändert, da kein Endpunkt/Schema hinzukommt.

## Aufgabe 1 – Serielle Verarbeitung RED/GREEN/REFACTOR

- [x] **RED:** Verarbeitungstest für drei Positionen geschrieben; fehlender Helper ließ ihn zuerst scheitern.
- [x] **RED prüfen:** `npx vitest run tests/unit/lib/series/bulk-add-entries.test.ts` scheiterte vor der Helper-Implementierung.
- [x] **GREEN:** `addSeriesGamesSequentially(items, request)` gibt `added`, `already_present` (HTTP 409) oder `failed` zurück und fährt nach Einzelfehlern fort.
- [x] **GREEN prüfen:** Helpertests bestanden für Reihenfolge, 201, 409, 5xx und Netzwerkfehler.
- [x] **REFACTOR:** Requestgrenze klein typisiert; kein neuer API- oder DB-Abstraktionslayer.

## Aufgabe 2 – Auswahl und Statusoberfläche RED/GREEN/REFACTOR

- [x] **RED:** Komponententests scheiterten an der fehlenden Mehrfachauswahl und am bestehenden Einzelpfad-Vertrag.
- [x] **GREEN:** Sammlung und BGG teilen Auswahl über stabile gameId-/BGG-ID-Schlüssel; Such- und Quellenwechsel lassen Auswahl bestehen; Batchlimit 20; leere Aktion deaktiviert.
- [x] Einzelergebnisse, 409-Konflikt, getrennte Fehler, Retry nur für fehlgeschlagene Spiele sowie Refresh ohne Dialogschluss bei Batch umgesetzt.
- [x] **GREEN prüfen:** `npx vitest run tests/unit/components/series-bulk-add.test.tsx tests/unit/lib/series/bulk-add-entries.test.ts tests/unit/components/series-entry-conflict.test.tsx` bestanden nach Erhalt des Einzelpfads.
- [x] **REFACTOR:** Ergebnisbereich in eigene Komponente ausgelagert; betroffene Komponenten unter 300 Zeilen.

## Aufgabe 3 – Impeccable, Sicherheit und Abnahme

- [x] Impeccable: lokaler Browserlauf mit synthetischen Antworten auf 390 px, 1280 px und effektiv 195 px (200-%-Viewport); Titelsichtbarkeit, Suche, Sammelaktion und Ergebnisstatus geprüft. Detector: 0 Anti-Patterns.
- [x] Security: bestehende Route bleibt für Auth, Reihen-/Spielbesitz und BGG-ID zuständig; kein neuer API-Zugriff.
- [x] FEATURES, FAQ, Backlog und Changelog aktualisiert.
- [x] Abnahme: 1.098/1.098 Unit-Tests, gezielte 18/18 Tests, TypeScript, ESLint geänderte Dateien, Security-Schnellprüfung, Produktionsbuild und Regressionsevaluator mit gültigen Registry-Auditdaten bestanden.
- [x] Commit erstellt. Pre-Commit: lint-staged (ESLint + zugehörige Tests), OWASP Security-Check und Review-Regressionscheck mit 10/10, 0 Regressionen; alle Hooks bestanden.

**Freigabe:** FEAT-024 Web wurde am 03.11.2026 mit „Räume das Feature Backlog auf und danach fange mit FEAT-024 an“ zur Umsetzung freigegeben. Freigegeben sind Mehrfachauswahl und einzeln nachvollziehbare Ergebnisse auf dem vorhandenen Eigentums-/Importvertrag. FEAT-025, Migration, temporäre Besitzart, neue Endpunkte und iOS bleiben außerhalb dieses Umfangs.
