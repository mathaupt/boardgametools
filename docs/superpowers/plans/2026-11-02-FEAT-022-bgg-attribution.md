# FEAT-022 – BGG-Quellenkennzeichnung auf Loginseite und Website-Footer

> **Für ausführende Agenten:** Umsetzung ist nicht freigegeben. Vor Implementierung die aktuelle BGG-API-Vereinbarung und Vorgaben zur offiziellen Kennzeichnung erneut prüfen; nur das offiziell freigegebene BGG-Logo und den vorgeschriebenen Link einsetzen.

**Ziel:** Nutzer sehen auf der Loginseite und konsistent im allgemeinen Website-Footer eine gut erkennbare BGG-Quellenkennzeichnung, wenn die App die BGG-API verwendet.

**Architektur:** Eine kleine gemeinsame Footer-Komponente wird vom App-Layout verwendet, damit die Kennzeichnung für öffentliche, Login- und angemeldete Seiten konsistent ist. Die vorhandene Landingpage-Fußzeile wird geprüft, damit keine doppelte Kennzeichnung oder doppelte Footerstruktur entsteht. Ein offizielles BGG-Logo führt direkt zu BoardGameGeek. Die Kennzeichnung bleibt auch bei Tastaturbedienung, kleinen Viewports und Zoom gut erkennbar.

**Stack:** Next.js App Router, React, vorhandenes Layout-/Styling-System, Testing Library und Vitest.

## Aufgabe 1: Einbaupunkte und API-Vorgaben prüfen

**Dateien prüfen:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(auth)/login/page.tsx`, bestehende Layout-/Footerkomponenten und `docs/DEPLOYMENT.md`.

- [ ] Offizielle BGG-API-Nutzungsbedingungen und Logo-Richtlinien erneut lesen; notwendige Formulierung, Logo-Datei, Mindestgröße und Ziel-URL notieren.
- [ ] Login-, öffentliche Landingpage- und Dashboardstruktur im Browser-/Quellcode prüfen, um doppeltes oder überlappendes Footerlayout zu verhindern.
- [ ] Entscheidung über globale Platzierung im Plan festhalten: BGG-Attribution auf Login und Footer; allgemeiner Footer nur einmal je Dokument.

## Aufgabe 2: Footer-Verhalten testgetrieben definieren

**Dateien:** neue `src/components/layout/site-footer.tsx`, Tests `tests/unit/components/site-footer.test.tsx` und passende Login-/Layouttests.

- [ ] Tests für sichtbaren BGG-Text/Logo, zugänglichen Alternativtext, direkten BGG-Link und sichere Linkattribute schreiben.
- [ ] Tests für genau einmal gerenderte Attribution auf Login und Landingpage anlegen.
- [ ] Footer mit semantischem `<footer>` und responsivem Layout erstellen; offizielle Kennzeichnung nicht als schwer lesbaren Kleindruck verstecken.
- [ ] Bestehenden Landingpage-Footer integrieren oder vereinheitlichen, sodass Copyright- und BGG-Hinweise nicht doppelt erscheinen.
- [ ] Sicherstellen, dass der Loginbereich bei kurzen Viewports scrollbar bleibt und das Formular nicht durch einen globalen Mindesthöhen-Footer verdeckt wird.

```sh
npx vitest run tests/unit/components/site-footer.test.tsx
npm run typecheck
```

## Aufgabe 3: BGG-Attribution in Login und globaler Navigation einsetzen

**Dateien:** `src/app/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/page.tsx` und Footer-Komponente.

- [ ] Den gemeinsamen Footer an der geprüften Layoutgrenze ergänzen.
- [ ] Loginseite mit dem Footer integrieren, ohne Auth-Callback, Formularsemantik oder Redirects zu verändern.
- [ ] Landingpage-Footer mit globaler Variante abstimmen; angemeldete Seiten erhalten die Attribution ebenfalls, sofern sie BGG-Daten enthalten.
- [ ] Offizielles Logo lokal als versioniertes Asset oder gemäß offizieller Einbettung referenzieren; keine fremden, nicht freigegebenen Logo-Kopien einführen.
- [ ] Tastaturfokus, Kontrast, Dark Mode, 200-%-Zoom, mobile Breiten und lange Seiten im Browser prüfen; für UI-Änderungen Impeccable ausführen.

## Aufgabe 4: Abnahme, Policy und Projektdokumente

- [ ] Prüfen, dass Linkziel direkt auf BoardGameGeek zeigt und Logo/Text den aktuellen BGG-Vorgaben entsprechen.
- [ ] Security-Check für externe Ressource, Linkattribute, CSP und Datenschutz durchführen; keine zusätzlichen Tracker einführen.
- [ ] `docs/FEATURES.md`, FAQ, Changelog und gegebenenfalls `docs/DEPLOYMENT.md` aktualisieren; OpenAPI nur falls API-Vertrag betroffen ist.
- [ ] Unit-/Browserprüfungen, `npm run typecheck`, `npm run lint`, `npm run security-check` sowie Impeccable-Prüfung dokumentieren.

**Abnahmekriterium:** BGG-Attribution erscheint auf Login und Website-Footer gut lesbar, korrekt verlinkt und ohne Duplikate; responsive und barrierearme Darstellung ist geprüft. Umsetzung erst nach separater Freigabe.
