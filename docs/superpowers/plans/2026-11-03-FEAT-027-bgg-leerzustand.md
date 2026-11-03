# FEAT-027 – Keine Treffer in der BGG-Suche eindeutig melden – Implementierungsplan

> **Für ausführende Agenten:** REQUIRED SUB-SKILLS: `test-driven-development` und `skills/testing/SKILL.md`; für Next.js/React `.agents/skills/next-best-practices/SKILL.md` sowie `.agents/skills/vercel-react-best-practices/SKILL.md` lesen. Erst alle BGG-Suchflächen und Providerantworten inventarisieren. Vorhandene FEAT-014-Zustände der öffentlichen Eventseite beibehalten; nur echte Lücken schließen.

**Ziel:** Eine leere BGG-Treffermenge klar und auf Deutsch anzeigen, ohne Providerfehler oder noch nicht abgeschlossene Suche als „keine Treffer“ auszugeben.

**Architektur:** Suchergebnis `[]` bedeutet ausschließlich erfolgreiche Suche ohne Treffer. Providerfehler, Rate-Limit und Zeitüberschreitung werden als unterscheidbare Fehlerantworten transportiert. Die bestehenden Suchflächen erhalten einen gemeinsamen fachlichen Zustandsvertrag `idle | loading | results | empty | error`; veraltete Antworten werden ignoriert/abgebrochen. Die öffentliche Eventseite mit FEAT-014-Vertrag wird geprüft und nur bei nachweisbarer Abweichung angepasst.

**Technik:** Next.js Route Handler, vorhandenes `searchBGGGames`, typed BGG-Fehler, React-Hooks/Komponenten, Vitest/Testing Library.

**Aktualitätsprüfung und Freigabe:** 03.11.2026, HEAD `37faabf`, Version `0.50.69`, Arbeitsbaum sauber. FEAT-024 ist umgesetzt; der Series-Dialog hat weiterhin keine Fehlermeldung bei fehlgeschlagener Suche. Aktuelle Inventur: `searchBGGGames` liefert nach erschöpften 202-/429-Retries `[]`, liefert bei HTTP 401/5xx synthetische Catan-Treffer und verschluckt Transportfehler ebenfalls als `[]`. Die öffentliche FEAT-014-Suche über `searchBggCatalog` unterscheidet bereits `idle/loading/results/empty/error` samt veralteten Requests und bleibt unverändert. Die ältere Dashboard-Route `/api/bgg?query=` verwendet einen separaten Transport/Parser; ihr Fehlerzustand ist bereits HTTP-Fehler, soll aber in den Oberflächen geprüft werden. FEAT-024 hat den Reihen-Suchdialog seit dem Planungsstand verändert.

Der Nutzer hat am 03.11.2026 mit „implementiere FEAT-027“ die Umsetzung freigegeben. Freigegebener Umfang: erfolgreiche Nulltreffer und Providerfehler auf den authentifizierten BGG-Suchflächen auseinanderhalten, verlässliche Providerfehler vom Backend transportieren und verständliche Leer-/Fehler-/Ladezustände mit erneuter Suche dort ergänzen, wo sie fehlen. Öffentliche FEAT-014-Zustände, Berechtigungen, Suchantwort-Formate und Scan/OCR-Erkennung bleiben erhalten. Web; iOS ist nicht betroffen.

---

## Aktualitätsprüfung vor Umsetzung

- [x] HEAD, FEAT-014-Vertrag und Arbeitsbaum geprüft.
- [x] Suchflächen und Verbraucher inventarisiert: Dashboard BGG, Einzelimport, Reihen-Dialog, Gruppen-Poll-Picker, Cover-/Barcode-Fallback sowie öffentliche Eventseite. Event-Voting nutzt die katalogbasierte Suche und bleibt unverändert.
- [x] Providerfehler/-fallback in `searchBGGGames` bestätigt. Erfolgreiches Arrayformat bleibt erhalten; Fehler werden per existierendem `{ error }`-Vertrag und HTTP-Status transportiert.
- [x] Planumfang nach FEAT-024 aktualisiert; mobile API-Verbraucher werden beim Fehlervertrag berücksichtigt. Kein neuer Endpunkt und kein Response-Envelope.

## Betroffene Dateien

- `src/lib/bgg.ts`: Suchfehler getrennt von erfolgreichem Leerresultat modellieren; keine synthetischen Catan-Treffer bei Providerfehler.
- `src/app/api/bgg/search/route.ts`, `src/app/api/mobile/v1/bgg/search/route.ts`: Fehlerstatus/Retry-After und deutsches Fehlerobjekt. Die ältere `/api/bgg?query=`-Route behält ihren vorhandenen Fehlervertrag.
- `src/app/(dashboard)/dashboard/bgg/page.tsx`, `src/app/(dashboard)/dashboard/games/import/page.tsx`, Reihen-Dialog/-Suche und Gruppen-Poll-Picker: sichtbare Zustände je Suchoberfläche.
- `src/components/cover-scan-tab.tsx`, `src/components/barcode-results-panel.tsx`: bestehende Suche nicht mit Scan-/OCR-Leerzustand verwechseln; gezielt nur BGG-Suchergebniszustände vereinheitlichen.
- `src/components/public-event/use-bgg-search.ts`, `src/components/public-event/bgg-game-search.tsx`: geprüft, FEAT-014-Vertrag bleibt unverändert.
- Tests: `tests/unit/lib/bgg.test.ts`, `tests/unit/api/bgg-search-route.test.ts` (neu), `tests/unit/components/series-bulk-add.test.tsx`, `tests/unit/components/cover-scan-tab.test.tsx`, `tests/unit/components/barcode-results-panel.test.tsx`.
- `docs/openapi.yaml`, `docs/FEATURES.md`, `src/lib/faq.ts`, Backlog und Changelog.

## Aufgabe 1 – Providervertrag RED/GREEN/REFACTOR

- [x] **RED:** Tests für erfolgreiche leere XML-Antwort, HTTP-503, Transportfehler, ausgeschöpfte 202-Wiederholungen und 429-Retry geschrieben.
- [x] **RED prüfen:** Vor dem Fix reproduzierten 503 den synthetischen Catan-Fallback und Transportfehler `[]`.
- [x] **GREEN:** Erfolgreiches XML mit null Items ergibt `[]`; Provider-/Transportfehler werfen `BggSearchError` mit sicherem Status und optionalem RetryAfter. Keine synthetischen Ergebnisse.
- [x] **GREEN prüfen:** Provider-Tests bestehen; Logs enthalten keine BGG-Credentials.
- [x] **REFACTOR:** Parser und Transportfehler bleiben getrennt; vorhandene Verzögerungen/Warteschleifen und Lastschutz bleiben erhalten.

## Aufgabe 2 – Routeverträge RED/GREEN/REFACTOR

- [x] **RED/GREEN:** `tests/unit/api/bgg-search-route.test.ts` prüft erfolgreiche leere Arrays, Providerfehler und `Retry-After`. Authentifizierung und bestehende öffentliche/geschützte Routentests laufen weiter.
- [x] Erfolgsformat bleibt ein Array; Fehler antworten mit `{ error }` und passendem HTTP-Status. Öffentliche Event-Route, Token-Grenze und Rate-Limit bleiben unverändert.
- [x] OpenAPI-Sucheintrag um Nulltreffer- und Fehlerantworten ergänzt.

## Aufgabe 3 – Oberflächenzustände RED/GREEN/REFACTOR

- [x] **RED/GREEN:** Reihen-Dialog-, Cover-OCR- und Barcode-Regressionstests prüfen echten Leerzustand, Providerfehler, Retry und das Ignorieren veralteter Reihenantworten.
- [x] Dashboard-BGG, Import, Reihe, Gruppe, Cover und Barcode unterscheiden „noch nicht gesucht“, Laden, erfolgreiche Nulltreffer und Providerfehler. Wiederholen bleibt möglich; Status/Fehler sind assistiv angekündigt.
- [x] Ergebnisse veralteter Requests werden in Dashboard-/Import-/Reihen-/Gruppen-/Cover-/Barcode-Suche ignoriert. Öffentliche FEAT-014-Requests hatten bereits Abort-/Request-ID-Schutz.
- [x] Gezielte Suite und bestehende öffentliche Suchtests bestehen; FEAT-014-Oberfläche und API-Vertrag unverändert.
- [x] Keine gemeinsame Zustandskomponente eingeführt: die Oberflächen haben unterschiedliche Formular- und Auswahlaktionen.

## Aufgabe 4 – Impeccable, Sicherheit und Abschluss

- [x] Impeccable: reale Reihenkomponente lokal mit synthetischen Daten bei 390 px und 1440 px gerendert. Leer-/Fehlerzustände, Browserkonsole und Detector geprüft; 0 Findings. Screenshots liegen lokal unter `.impeccable/critique/feat027-*`.
- [x] Security: geschützte Endpunkte/Auth, öffentliche Share-Token-Grenze und Rate-Limit unverändert; Fehlermeldungen geben keine Credentials aus; `npm audit --omit=dev` meldet 0 Befunde.
- [x] Doku: OpenAPI, FAQ, FEATURES, Backlog, Plan und Changelog aktualisiert.
- [x] Abnahme: 1.110 Unit-Tests, TypeScript, ESLint (0 Fehler), Security-Schnellprüfung, Produktionsbuild und Review-Regressionscheck bestanden; Impeccable gerendert geprüft.
- [x] Commit `84a3ba1` mit regulären Hooks; lint-staged/ESLint, verwandte Tests, OWASP Security, Produktions-Audit (0 Befunde) und Review-Regression (10/10, 0 Regressionen) bestanden.

**Aktualitätsprüfung vor Umsetzung:** 03.11.2026, HEAD `37faabf`, Version `0.50.69`; Ergebnis: Plan angepasst wie oben, keine wesentliche Umfangsänderung.
**Freigabe:** 03.11.2026 durch Nutzeranweisung „implementiere FEAT-027“.
**Abschluss:** 03.11.2026, Version `0.50.70`, Commit `84a3ba1`; 1.110 Tests bestanden, Arbeitsbaum nach Commit sauber.
