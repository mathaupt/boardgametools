# FEAT-021 – Deutsche BGG-Ausgabe beim Import auswählen

> **Für ausführende Agenten:** Arbeitspakete einzeln nach TDD abarbeiten. Vor Runtimeänderungen BGG-API-Zugang, Nutzungsbedingungen, aktuelle Importpfade und diesen Plan erneut prüfen. Umsetzung am 02.11.2026 durch „implemtiere feat-021 und danach 22“ freigegeben.

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

- [x] XML-Fixture mit deutscher, nichtdeutscher und unvollständiger Version anlegen.
- [x] Tests für Versions-ID, Name, Sprache, Jahr, Verlag, Bild/Thumbnail, leere Versionen und ungültiges XML schreiben.
- [x] Parser um eng typisierte Versionsdaten erweitern; nur Felder aus der BGG-Antwort übernehmen.
- [x] `thing`-Abfrage mit dem BGG-Parameter `versions=1` ergänzen und HTTP 202/Retry-Verhalten des bestehenden Clients beachten.
- [x] Deutsche Sprache anhand des gelieferten BGG-Sprachwerts erkennen; keine heuristische Ableitung aus Titel oder Verlag.

```sh
npx vitest run tests/unit/lib/bgg-xml.test.ts tests/unit/lib/bgg.test.ts
```

## Aufgabe 2: Sichere Versionsabfrage bereitstellen

**Dateien:** `src/app/api/bgg/[id]/route.ts` oder eine getrennte Versionsroute, `src/lib/bgg.ts`, API-Tests unter `tests/unit/api/`.

- [x] Bestehende Authentifizierung, numerische ID-Validierung, Rate-Limits und Fehlerantworten des BGG-Endpunkts erfassen.
- [x] Vertragstest für fehlende Anmeldung, ungültige BGG-ID, BGG-Fehler, keine deutsche Version und mehrere deutsche Versionen schreiben.
- [x] Minimalen Antwortvertrag für Ausgaben festlegen; keine Tokens, Roh-XML oder unnötigen BGG-Felder ausgeben.
- [x] BGG-Warte-/Queue-Antworten, Timeouts und Rate-Limit-Fehler kontrolliert an die UI abbilden.
- [x] Server-Cache nur entsprechend aktueller BGG-Nutzungsbedingungen und bestehender Cachepolicy einsetzen; keine unbefristete Spiegelung von BGG-Inhalten.

```sh
npx vitest run 'tests/unit/api/bgg-versions.test.ts'
```

## Aufgabe 3: Ausgabe in den Importoberflächen zugänglich machen

**Dateien:** `/dashboard/bgg` und `/dashboard/games/import` betreffende Seiten/Komponenten; neue fokussierte Tests unter `tests/unit/components/`.

- [x] Vorhandene Importoberflächen und Barcode-/Sammlungsimport auf gemeinsame Spiel-Detailauswahl prüfen; im Plan vor Beginn genau die tatsächlich genutzten Einstiegspunkte festhalten.
- [x] Tests für Ladezustand, deutsche Treffer, keine deutsche Ausgabe, BGG-Fehler, Tastaturauswahl und Auswahlwechsel schreiben.
- [x] Barrierearme Auswahlliste oder Karten mit sichtbarer Sprache/Jahr-Angabe, verständlichem Fokus und aussagekräftigen Bildalternativen umsetzen.
- [x] Auswahl bei vorhandenen Treffern nicht stillschweigend als einzige gültige Ausgabe erzwingen; bisherige Importfunktion bleibt mit klarer Standardausgabe nutzbar.
- [x] Layout bei schmalen Viewports, langen Verlags-/Ausgabennamen und fehlenden Bildern prüfen.

```sh
npx vitest run tests/unit/components/bgg*
npm run typecheck
```

## Aufgabe 4: Importserver als Vertrauensgrenze nutzen

**Dateien:** `src/app/api/games/import-bgg/route.ts`, zugehörige API-Tests, nur bei begründetem Bedarf `prisma/schema.prisma`.

- [x] Tests prüfen, dass der Server die Ausgabe anhand einer validierten BGG-ID auflöst und keine vom Client gesetzte externe Bild-URL speichert.
- [x] `versionId` optional und streng validiert annehmen; sicherstellen, dass die Ausgabe tatsächlich zum angefragten BGG-Spiel gehört und Sprache Deutsch ist.
- [x] Ausgabe-Cover in das bestehende `imageUrl` übernehmen; Haupttitel, Beschreibung, BGG-ID und übrige Importdaten unverändert aus dem bestehenden Spielobjekt beziehen.
- [x] Erst wenn spätere Aktualisierung/Anzeige einen Versionsbezug nachweislich benötigt: Schemaauswirkung, Migration, API-Vertrag und Rückwärtskompatibilität gesondert planen.

```sh
npx vitest run tests/unit/api/import-bgg.test.ts
```

## Aufgabe 5: Sicherheit, BGG-Vorgaben und Dokumentation abnehmen

- [x] Vor Freigabe App-Registrierung/Tokenanforderungen und Nichtkommerzialitäts-/Attributionsregeln anhand der dann aktuellen offiziellen BGG-Bedingungen verifizieren. Externe BGG-Aufrufe bleiben serverseitig; Secrets erscheinen weder in Antworten noch Logs.
- [x] Eingabegrenzen, Auth, Rate-Limit, SSRF-Schutz und URL-/Hostvalidierung der übernommenen BGG-Bildfelder prüfen.
- [x] `docs/FEATURES.md`, `docs/openapi.yaml` (falls API-Vertrag geändert), FAQ und Changelog aktualisieren.
- [x] `npm run test:coverage`, `npm run typecheck`, `npm run lint`, `npm run security-check` und nötige Impeccable-/Browserprüfung ausführen.
- [ ] Optionale Produktionsabnahme nach Deployment bestätigt, dass Titel/Beschreibung nicht übersetzt oder BGG-Daten verfälscht werden und der Nutzer eine deutsche Ausgabe nachvollziehbar ausgewählt hat.

**Abnahmekriterium:** Deutsche BGG-Versionen werden korrekt angeboten und geprüft; die gewählte Version bestimmt das importierte Cover; vorhandener Import funktioniert ohne deutsche Ausgabe weiter; Tests decken Auth, Fehler, Datenvalidierung und Auswahl ab. Die Umsetzung ist für den beschriebenen Web-Umfang freigegeben.

## Aktualitätsprüfung und konkrete Umsetzungspfade – 02.11.2026

Geprüft gegen `e483e1e` und einen zunächst sauberen Arbeitsbaum. FEAT-021 wird vor FEAT-022 umgesetzt. Der vorhandene BGG-Transport `fetchBggXml` bietet Timeout, Größenlimit, serverseitigen Token und 202-Retry; diese Mechanik wird für Ausgaben wiederverwendet. Die bisherige XML-Strukturprüfung aus `bgg-catalog.ts` wird geteilt. Der isolierte Parser-/Servicevertrag liegt in `src/lib/bgg-versions.ts`; gemeinsame Datenstruktur in `bgg-types.ts`.

Konkrete Route: `GET /api/bgg/[id]/versions` mit Auth, kontobezogenem Rate-Limit, bounded numerischer ID und privater No-Store-Antwort. Import bleibt `POST /api/games/import-bgg`, ergänzt um die optionale `versionId`. Dort wird die Zugehörigkeit durch erneute serverseitige Auflösung der deutschen Ausgaben geprüft. Nur HTTPS-Bilder von `cf.geekdo-images.com` sind für Ausgaben zulässig.

Einzelauswahl: `dashboard/bgg/page.tsx` und `dashboard/games/import/page.tsx` verwenden `BggVersionPicker`. Die erste Seite schrieb bisher direkt nach `/api/games`; für diese BGG-Importauswahl wird sie auf den geprüften Importserver umgestellt. Der Barcode-Einstieg auf der Importseite führt ebenfalls durch deren Detailauswahl. Stapel-/Sammlungsimport und direkte Schnellimporte behalten die Standardausgabe; sie bieten keine Einzelausgabenauswahl. Beide bisher über 300 Zeilen langen Seiten werden durch fokussierte Suchergebnis-/Detailkomponenten verkleinert. Keine neue Datenbankspalte: Es gibt derzeit keine automatische BGG-Aktualisierung, die das gespeicherte Cover überschreiben würde.

RED: Parser-Metadaten, German-Filter, ungültige XML-/ID-Verträge; API-Auth/Limit, gewählte vs. fremde Ausgabe, gefälschte Clientcover; UI-Auswahl, Standardfallback, Fehler/Retry und Request-Abbruch; beide tatsächlichen Importseiten mit servergeprüftem Request-Payload. GREEN: minimale Parser-/API-/UI-Implementierung. REFACTOR: gemeinsamer Picker und fokussierte Seitenkomponenten. Befehle: `npx vitest run tests/unit/lib/bgg-versions.test.ts tests/unit/api/bgg-versions.test.ts tests/unit/api/import-bgg.test.ts tests/unit/components/bgg-version-picker.test.tsx tests/unit/components/bgg-import-editions.test.tsx`.

Offizielle Grundlagen am 02.11.2026 geprüft: [BGG XML API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2) (`versions=1`), [Using the XML API](https://boardgamegeek.com/using_the_xml_api) (serverseitige registrierte Anwendung/Token, lesbares verlinktes Logo) und [XML API Terms of Use](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use). Web-Direktabruf lieferte teilweise 403; der offizielle indexierte Seitentext war lesbar. Keine Registrierung oder Lizenzannahme im Namen des Nutzers vorgenommen. BGG-Daten werden nicht übersetzt; Attribution folgt mit FEAT-022.

## Abschluss am 02.11.2026 – Version 0.50.63

- RED: Parser-/API-Tests mit Platzhaltern sowie beide Importintegrationstests schlugen für die fehlenden Verträge erwartungsgemäß fehl. Der spätere Umbruchvertrag reproduzierte BUG-065 vor dem Fix.
- GREEN: `npx vitest run tests/unit/lib/bgg-versions.test.ts tests/unit/api/bgg-versions.test.ts tests/unit/api/import-bgg.test.ts tests/unit/components/bgg-version-picker.test.tsx tests/unit/components/bgg-import-editions.test.tsx` (35 Tests). `npm run test:coverage`: 146 Dateien, 1.029 Tests bestanden; Gesamtabdeckung 60,27 % Statements, 56,83 % Branches, 64,89 % Functions, 61,75 % Lines; vorhandene Coverage-Gates bestanden.
- REFACTOR: Ergebnisliste und BGG-Detailkarte ausgelagert, gemeinsame Ausgabenwahl; geänderte Komponenten unter 300 Zeilen. `npm run typecheck`, gezieltes ESLint und `npm run build` erfolgreich.
- Impeccable: Quellcodedetektor ohne Befunde (nur Regexregeln); ergänzende gerenderte Prüfung realer Komponenten über lokalen Vite-Server und native Safari-Steuerung. 390/1024 px, Hell/Dunkel, lange Metadaten, Radioauswahl und 200 % Schrift geprüft. BUG-065 gefunden und behoben; kein horizontaler Überlauf der Auswahlflächen.
- Sicherheit: Anmeldung, begrenzte IDs, kontobezogene Ratenlimits, erneute BGG-Zuordnung, ausschließlich HTTPS-Cover von cf.geekdo-images.com, keine übernommenen Client-Metadaten; gezielte Auth-/Fremdausgaben-/Manipulationstests grün. Kein Schemawechsel, keine Produktionsdaten geschrieben, kein neuer Provider.
- `npm run review-evaluate:regression` erfolgreich; Snapshot `docs/code-reviews/history/2026-11-02_1426.json`.
- BGG-Vertrag am Umsetzungstag anhand offizieller Quellen geprüft: [API-Leitfaden](https://boardgamegeek.com/using_the_xml_api), [API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2), [Nutzungsbedingungen](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use). Der bestehende serverseitige Bearer-Token-Transport wird wiederverwendet. Keine Registrierung oder Vertragsannahme durch den Agenten.
- Schreibende Browser-E2E bleiben ohne isolierte Testdatenbank ausgenommen. API-/UI-Integration mit Fixtures prüft Auswahl und Importpayload, keine Behauptung eines echten Provider-/Datenbankimports.
