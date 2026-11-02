# FEAT-022 – BGG-Quellenkennzeichnung auf Loginseite und Website-Footer

> **Für ausführende Agenten:** Umsetzung am 02.11.2026 durch „implemtiere feat-021 und danach 22“ freigegeben. Vor Implementierung die aktuelle BGG-API-Vereinbarung und Vorgaben zur offiziellen Kennzeichnung erneut prüfen; nur das offiziell freigegebene BGG-Logo und den vorgeschriebenen Link einsetzen.

**Ziel:** Nutzer sehen auf der Loginseite und konsistent im allgemeinen Website-Footer eine gut erkennbare BGG-Quellenkennzeichnung, wenn die App die BGG-API verwendet.

**Architektur:** Eine kleine gemeinsame Footer-Komponente wird vom App-Layout verwendet, damit die Kennzeichnung für öffentliche, Login- und angemeldete Seiten konsistent ist. Die vorhandene Landingpage-Fußzeile wird geprüft, damit keine doppelte Kennzeichnung oder doppelte Footerstruktur entsteht. Ein offizielles BGG-Logo führt direkt zu BoardGameGeek. Die Kennzeichnung bleibt auch bei Tastaturbedienung, kleinen Viewports und Zoom gut erkennbar.

**Stack:** Next.js App Router, React, vorhandenes Layout-/Styling-System, Testing Library und Vitest.

## Aufgabe 1: Einbaupunkte und API-Vorgaben prüfen

**Dateien prüfen:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(auth)/login/page.tsx`, bestehende Layout-/Footerkomponenten und `docs/DEPLOYMENT.md`.

- [x] Offizielle BGG-API-Nutzungsbedingungen und Logo-Richtlinien erneut lesen; notwendige Formulierung, Logo-Datei, Mindestgröße und Ziel-URL notieren.
- [x] Login-, öffentliche Landingpage- und Dashboardstruktur im Browser-/Quellcode prüfen, um doppeltes oder überlappendes Footerlayout zu verhindern.
- [x] Entscheidung über globale Platzierung im Plan festhalten: BGG-Attribution auf Login und Footer; allgemeiner Footer nur einmal je Dokument.

## Aufgabe 2: Footer-Verhalten testgetrieben definieren

**Dateien:** neue `src/components/layout/site-footer.tsx`, Tests `tests/unit/components/site-footer.test.tsx` und passende Login-/Layouttests.

- [x] Tests für sichtbaren BGG-Text/Logo, zugänglichen Alternativtext, direkten BGG-Link und sichere Linkattribute schreiben.
- [x] Tests für genau einmal gerenderte Attribution auf Login und Landingpage anlegen.
- [x] Footer mit semantischem `<footer>` und responsivem Layout erstellen; offizielle Kennzeichnung nicht als schwer lesbaren Kleindruck verstecken.
- [x] Bestehenden Landingpage-Footer integrieren oder vereinheitlichen, sodass Copyright- und BGG-Hinweise nicht doppelt erscheinen.
- [x] Sicherstellen, dass der Loginbereich bei kurzen Viewports scrollbar bleibt und das Formular nicht durch einen globalen Mindesthöhen-Footer verdeckt wird.

```sh
npx vitest run tests/unit/components/site-footer.test.tsx
npm run typecheck
```

## Aufgabe 3: BGG-Attribution in Login und globaler Navigation einsetzen

**Dateien:** `src/app/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/page.tsx` und Footer-Komponente.

- [x] Den gemeinsamen Footer an der geprüften Layoutgrenze ergänzen.
- [x] Loginseite mit dem Footer integrieren, ohne Auth-Callback, Formularsemantik oder Redirects zu verändern.
- [x] Landingpage-Footer mit globaler Variante abstimmen; angemeldete Seiten erhalten die Attribution ebenfalls, sofern sie BGG-Daten enthalten.
- [x] Offizielles Logo lokal als versioniertes Asset oder gemäß offizieller Einbettung referenzieren; keine fremden, nicht freigegebenen Logo-Kopien einführen.
- [x] Tastaturfokus, Kontrast, Dark Mode, 200-%-Zoom, mobile Breiten und lange Seiten im Browser prüfen; für UI-Änderungen Impeccable ausführen.

## Aufgabe 4: Abnahme, Policy und Projektdokumente

- [x] Prüfen, dass Linkziel direkt auf BoardGameGeek zeigt und Logo/Text den aktuellen BGG-Vorgaben entsprechen.
- [x] Security-Check für externe Ressource, Linkattribute, CSP und Datenschutz durchführen; keine zusätzlichen Tracker einführen.
- [x] `docs/FEATURES.md`, FAQ, Changelog und gegebenenfalls `docs/DEPLOYMENT.md` aktualisieren; OpenAPI nur falls API-Vertrag betroffen ist.
- [x] Unit-/Browserprüfungen, `npm run typecheck`, `npm run lint`, `npm run security-check` sowie Impeccable-Prüfung dokumentieren.

**Abnahmekriterium:** BGG-Attribution erscheint auf Login und Website-Footer gut lesbar, korrekt verlinkt und ohne Duplikate; responsive und barrierearme Darstellung ist geprüft. Freigegebener Umfang: Web-Footer einschließlich Login.

## Aktualitätsprüfung vor Implementierung – 02.11.2026

Geprüfter Stand: sauberer Commit `cb21991`, FEAT-021 abgeschlossen. Root-Layout bisher ohne Footer, Landingpage mit eigener Copyright-Fußzeile (2024), Login mit eigenem `min-h-screen`. Ein gemeinsamer Server-Footer im Root-Layout ersetzt die Landingpage-Fußzeile. Body und Inhaltswrapper verwenden flexibles Spaltenlayout, Login und Landingpage füllen den verbleibenden Platz ohne zusätzlichen Mindestbildschirm. Der Footer bleibt im Dokumentfluss, überlagert keine Inhalte und enthält lokal gespeichertes offizielles Logo, direkten BGG-Link und Quellenbezeichnung. Auth-Verhalten, Provider-Transport und Schema bleiben unverändert. Keine wesentliche Abweichung vom freigegebenen Plan.

RED: `npx vitest run tests/unit/components/site-footer.test.tsx` muss für fehlende Quellenkennzeichnung und falsche Footeranzahl auf Login/Landingpage fehlschlagen (zuerst vorhandene Root-Struktur testen). GREEN: gemeinsamen Footer ergänzen, Seitenlayout integrieren. REFACTOR: gleiche Tests, `npm run typecheck`, `npm run lint`, `npm run build` und Security-/Regressionschecks müssen bestehen; lokale gerenderte Prüfung bei 390/1024 px, Hell/Dunkel, 200 % Schrift und kurzem Viewport.

Offizielle Quelle am Umsetzungstag geprüft: [BGG-Nutzungsbedingungen](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use). Sie verlangen das originale, direkt mit BGG verlinkte „Powered by BGG“-Logo in lesbarer Größe; kein fester Pixelwert angegeben. Der dort direkt verlinkte [Logoordner](https://drive.google.com/drive/folders/1k3VgEIpNEY59iTVnpTibt31JcO0rEaSw) ist die Assetquelle. Lokales Asset verhindert zusätzliche Drittanbieteranfragen beim Rendern.

## Umsetzungsnachweis – 0.50.64

- Root-Layout rendert `SiteFooter` genau einmal; Landingpage-Footer entfernt, Login/Landingpage in flexiblen Inhaltsbereich integriert. Keine Änderung an Anmeldung oder API-Verträgen.
- Originalasset: Color/PNG `powered_by_BGG_02_MED.png` aus dem offiziell verlinkten Ordner, lokal unter `public/images/bgg/powered-by-bgg.png`. Original 736 × 216 px; Ausgabe proportional 200 px breit, weißer Untergrund schützt Originalfarben im Dark Mode. Herkunft und SHA-256: `public/images/bgg/README.md`.
- RED: vier Tests für fehlende Quellenkennzeichnung/Footerplatzierung schlugen erwartungsgemäß fehl. Bei der Browserprüfung folgten zwei erwartungsgemäß rote Regressionstests für BUG-066. GREEN/REFACTOR: `npx vitest run tests/unit/components/site-footer.test.tsx` – 7/7 grün, einschließlich Tastaturzugang und Axe.
- Gerenderte lokale Prüfung: reale Login-/Landing-Komponenten und Footer, Anwendungs-CSS, native Safari-Steuerung. Desktop hell (1024-px-Rahmen), mobile Breite (390-px-Rahmen), dunkel, 200 % Schrift und 500 px hoher Viewport. Footer sichtbar/erreichbar ohne Überlagerung, Original-Logo lesbar, genau eine Instanz. BUG-066 dabei erkannt und behoben; danach keine überlaufenden Seiteninhalte oder Footerflächen. Lange Landingpage bis zum Footer gescrollt.
- Security: unveränderte lokale Rasterdatei, keine neuen externen Ressourcen, Tracker, CSP-Freigaben oder Secrets. Direkter HTTPS-Link zu BGG im selben Tab; kein `window.opener`. Keine Datenbank-/Auth-/Berechtigungsänderung, OpenAPI unverändert. Keine Produktionsdaten geschrieben.

- Abschließende Checks: `npm run test:coverage` – 147 Dateien, 1.036 Tests grün, bestehende Coverage-Gates bestanden (Statements 60,27 %, Branches 56,83 %, Functions 64,92 %, Lines 61,75 % insgesamt). `npm run build`, anschließend `npm run typecheck` erfolgreich. `npm run lint`: 0 Fehler, 651 bestehende Werkzeug-/Testwarnungen. Security-Check: 0 Fehler, zwei bekannte Hinweise zu Raw SQL/Debugrouten. Regressionsevaluator: 10/10 gesamt, Sicherheit 9,9/10, keine Regressionen; `history/2026-11-02_1455.json`.
- Impeccable-Quelldetektor: keine Regexbefunde; tatsächliche Darstellung zusätzlich über lokalen Server im nativen Browser geprüft. Dashboardplatzierung durch Root-Layout-Vertrag abgedeckt; im Browser keine Anmeldung/Produktionsdatenbank und kein vollständiger Dashboard-Backend-E2E behauptet.
- Kein Deployment angefordert. Eine optionale Produktionsabnahme nach Deployment bleibt vom lokalen Implementierungsabschluss getrennt.
