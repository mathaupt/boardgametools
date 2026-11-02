# FEAT-021 – Deutsche BGG-Ausgabe beim Import auswählen

> **Für ausführende Agenten:** Arbeitspakete einzeln nach TDD abarbeiten. Vor Runtimeänderungen BGG-API-Zugang, Nutzungsbedingungen, aktuelle Importpfade und diesen Plan erneut prüfen. Dieser Plan ist erstellt, aber nicht zur Umsetzung freigegeben.

**Ziel:** Beim Import eines Spiels können Nutzer eine deutsche Ausgabe aus den von BGG gelieferten Versionen auswählen. Deren Ausgabe-Cover wird für den Sammlungseintrag verwendet, sofern BGG eine passende Ausgabe liefert.

**Architektur:** BGG bleibt die einzige Quelle. Die serverseitige Integration fragt Versionen über den bestehenden BGG-Client ab, filtert nach BGG-Sprachmetadaten und gibt auswählbare Ausgaben an die Importoberfläche zurück. Die bestehende Spielbezeichnung und Beschreibung bleiben unveränderte BGG-Daten. Es gibt weder automatische Übersetzung noch einen zweiten Metadatenanbieter. Der Importserver löst die gewählte BGG-Versions-ID erneut auf und übernimmt nur BGG-gelieferte Bilddaten; beliebige vom Browser übergebene Bild-URLs werden nicht vertraut.

**Stack:** Next.js App Router, TypeScript, bestehender BGG-XML-Client, Vitest, Testing Library und bestehender Spielimport.

## Umfang und Produktregeln

- Nur eine ausdrücklich als Deutsch markierte BGG-Ausgabe kann als deutsche Ausgabe angeboten werden.
- Nutzer sehen mindestens Ausgabenname, Sprache, Jahr, Verlag und vorhandenes Ausgabenbild; fehlende Metadaten werden ausgelassen.
- Bei mehreren deutschen Ausgaben wählt der Nutzer. Bei keiner deutschen Ausgabe bleibt der bisherige Importweg verfügbar und erklärt den Grund.
- Die Spiele-Hauptbezeichnung und Beschreibung stammen weiterhin aus dem vorhandenen BGG-Spielobjekt. Der Plan verspricht keine deutsche Beschreibung oder Übersetzung, weil das Versionsobjekt solche Inhalte nicht verlässlich bereitstellt und BGGs Bedingungen die Veränderung seiner API-Daten untersagen.
- Der Ausgabenbezug wird nur dann dauerhaft gespeichert, wenn die Datenbank-/Produktprüfung belegt, dass er für spätere BGG-Aktualisierungen nötig ist. Vorzugsweise genügen die bestehende BGG-ID und das vorhandene `imageUrl`; keine Migration ohne konkreten Bedarf.
- Keine Übersetzungs-API, KI-Übersetzung, Wikidata-Abfrage oder manuell gepflegte Titel-/Bilddatenbank.

## Aufgabe 1: BGG-Versionenvertrag und Parser testgetrieben ergänzen

**Dateien:** `src/lib/bgg-xml.ts`, `src/lib/bgg-types.ts`, `src/lib/bgg.ts`, passende `tests/unit/lib/bgg-*.test.ts`.

- [ ] XML-Fixture mit deutscher, nichtdeutscher und unvollständiger Version anlegen.
- [ ] Tests für Versions-ID, Name, Sprache, Jahr, Verlag, Bild/Thumbnail, leere Versionen und ungültiges XML schreiben.
- [ ] Parser um eng typisierte Versionsdaten erweitern; nur Felder aus der BGG-Antwort übernehmen.
- [ ] `thing`-Abfrage mit dem BGG-Parameter `versions=1` ergänzen und HTTP 202/Retry-Verhalten des bestehenden Clients beachten.
- [ ] Deutsche Sprache anhand des gelieferten BGG-Sprachwerts erkennen; keine heuristische Ableitung aus Titel oder Verlag.

```sh
npx vitest run tests/unit/lib/bgg-xml.test.ts tests/unit/lib/bgg.test.ts
```

## Aufgabe 2: Sichere Versionsabfrage bereitstellen

**Dateien:** `src/app/api/bgg/[id]/route.ts` oder eine getrennte Versionsroute, `src/lib/bgg.ts`, API-Tests unter `tests/unit/api/`.

- [ ] Bestehende Authentifizierung, numerische ID-Validierung, Rate-Limits und Fehlerantworten des BGG-Endpunkts erfassen.
- [ ] Vertragstest für fehlende Anmeldung, ungültige BGG-ID, BGG-Fehler, keine deutsche Version und mehrere deutsche Versionen schreiben.
- [ ] Minimalen Antwortvertrag für Ausgaben festlegen; keine Tokens, Roh-XML oder unnötigen BGG-Felder ausgeben.
- [ ] BGG-Warte-/Queue-Antworten, Timeouts und Rate-Limit-Fehler kontrolliert an die UI abbilden.
- [ ] Server-Cache nur entsprechend aktueller BGG-Nutzungsbedingungen und bestehender Cachepolicy einsetzen; keine unbefristete Spiegelung von BGG-Inhalten.

```sh
npx vitest run 'tests/unit/api/bgg-versions.test.ts'
```

## Aufgabe 3: Ausgabe in den Importoberflächen zugänglich machen

**Dateien:** `/dashboard/bgg` und `/dashboard/games/import` betreffende Seiten/Komponenten; neue fokussierte Tests unter `tests/unit/components/`.

- [ ] Vorhandene Importoberflächen und Barcode-/Sammlungsimport auf gemeinsame Spiel-Detailauswahl prüfen; im Plan vor Beginn genau die tatsächlich genutzten Einstiegspunkte festhalten.
- [ ] Tests für Ladezustand, deutsche Treffer, keine deutsche Ausgabe, BGG-Fehler, Tastaturauswahl und Auswahlwechsel schreiben.
- [ ] Barrierearme Auswahlliste oder Karten mit sichtbarer Sprache/Jahr-Angabe, verständlichem Fokus und aussagekräftigen Bildalternativen umsetzen.
- [ ] Auswahl bei vorhandenen Treffern nicht stillschweigend als einzige gültige Ausgabe erzwingen; bisherige Importfunktion bleibt mit klarer Standardausgabe nutzbar.
- [ ] Layout bei schmalen Viewports, langen Verlags-/Ausgabennamen und fehlenden Bildern prüfen.

```sh
npx vitest run tests/unit/components/bgg*
npm run typecheck
```

## Aufgabe 4: Importserver als Vertrauensgrenze nutzen

**Dateien:** `src/app/api/games/import-bgg/route.ts`, zugehörige API-Tests, nur bei begründetem Bedarf `prisma/schema.prisma`.

- [ ] Tests prüfen, dass der Server die Ausgabe anhand einer validierten BGG-ID auflöst und keine vom Client gesetzte externe Bild-URL speichert.
- [ ] `versionId` optional und streng validiert annehmen; sicherstellen, dass die Ausgabe tatsächlich zum angefragten BGG-Spiel gehört und Sprache Deutsch ist.
- [ ] Ausgabe-Cover in das bestehende `imageUrl` übernehmen; Haupttitel, Beschreibung, BGG-ID und übrige Importdaten unverändert aus dem bestehenden Spielobjekt beziehen.
- [ ] Erst wenn spätere Aktualisierung/Anzeige einen Versionsbezug nachweislich benötigt: Schemaauswirkung, Migration, API-Vertrag und Rückwärtskompatibilität gesondert planen.

```sh
npx vitest run tests/unit/api/import-bgg.test.ts
```

## Aufgabe 5: Sicherheit, BGG-Vorgaben und Dokumentation abnehmen

- [ ] Vor Freigabe App-Registrierung/Tokenanforderungen und Nichtkommerzialitäts-/Attributionsregeln anhand der dann aktuellen offiziellen BGG-Bedingungen verifizieren. Externe BGG-Aufrufe bleiben serverseitig; Secrets erscheinen weder in Antworten noch Logs.
- [ ] Eingabegrenzen, Auth, Rate-Limit, SSRF-Schutz und URL-/Hostvalidierung der übernommenen BGG-Bildfelder prüfen.
- [ ] `docs/FEATURES.md`, `docs/openapi.yaml` (falls API-Vertrag geändert), FAQ und Changelog aktualisieren.
- [ ] `npm run test:coverage`, `npm run typecheck`, `npm run lint`, `npm run security-check` und nötige Impeccable-/Browserprüfung ausführen.
- [ ] Produktionsabnahme bestätigt, dass Titel/Beschreibung nicht übersetzt oder BGG-Daten verfälscht werden und der Nutzer eine deutsche Ausgabe nachvollziehbar ausgewählt hat.

**Abnahmekriterium:** Deutsche BGG-Versionen werden korrekt angeboten und geprüft; die gewählte Version bestimmt das importierte Cover; vorhandener Import funktioniert ohne deutsche Ausgabe weiter; Tests decken Auth, Fehler, Datenvalidierung und Auswahl ab. Implementierung erst nach separater Freigabe.
