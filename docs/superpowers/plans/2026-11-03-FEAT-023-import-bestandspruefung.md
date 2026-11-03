# FEAT-023 – Bestandsprüfung vor BGG-Importen

**Freigabe:** Nutzerauftrag „implementiere FEAT-023“, 03.11.2026.
**Aktualitätsprüfung:** 03.11.2026, HEAD `32eea14`, sauberer Arbeitsbaum,
Version 0.50.66. BUG-068/069 und FEAT-021 bleiben erhalten. Der bestehende
Sammlungsabruf ist für eine zuverlässige, aktuelle Einzelprüfung ungeeignet;
die bisherigen serverseitigen Abfragen schützen nicht gegen parallele Anlage.

## Vertrag und Grenzen

Web zuerst: beide BGG-Einzelimporte, BGG-Auswahl in Reihen einschließlich
Barcode-Pfad und vorhandener Sammlungsimport. Exakte BGG-ID, aktiver Besitz des
angemeldeten Kontos. Fehlende/unvollständige Antworten gelten als unbekannt,
nicht als Abwesenheit. Vorhandene Spiele öffnen bzw. unverändert wiederverwenden.
Keine neuen Besitzarten, Migration, Mehrfachauswahl oder iOS-Oberflächen:
FEAT-025 muss die spätere Trennung temporärer Reihenspiele separat entscheiden.
Bis dahin legt ein Reihenimport weiterhin ein dauerhaftes Sammlungsspiel an.

## Umsetzung (RED → GREEN → REFACTOR)

- [x] Privater `POST /api/games/bgg-presence`: maximal 50 validierte BGG-IDs,
  explizite Treffer oder null für jede ID, Eigentümerfilter, Minimalprojektion,
  `private, no-store`, Ratenlimit. RED: `npx vitest run tests/unit/api/bgg-presence.test.ts`
  scheitert wegen fehlender Route. GREEN: Route implementieren; Auth-, Fremdbesitz-,
  Eingabe-, Fehler- und Cache-Verträge bestehen. REFACTOR: Duplikat-IDs normalisieren.
- [x] Gemeinsamer Client für begrenzte Prüfbatches, vollständige Antwortvalidierung
  und abbruchfähiger Hook. RED: `npx vitest run tests/unit/components/bgg-collection-presence.test.tsx`
  scheitert wegen fehlendem Modul. GREEN: Laden, bekannt, unbekannt, Fehler,
  Wiederholung und verspätete Antworten prüfen. REFACTOR: gemeinsame Statusfläche.
- [x] Transaktionale Wiederverwendung nach dem BGG-Abruf, Serialisierbarkeit und
  begrenzte P2034-Wiederholungen in beiden Web-Importpfaden. RED:
  `npx vitest run tests/unit/lib/bgg-import-game.test.ts` scheitert wegen fehlendem
  Helper. GREEN: konkurrierenden Treffer wiederverwenden, nach ausgeschöpften
  Versuchen kontrolliert abbrechen; Reihen-Unique-Konflikt als 409 behandeln.
  REFACTOR: gemeinsame Anlage ohne Datenüberschreibung. Kein BGG-Netzwerk im
  Transaktionsfenster. Schutz gilt für diese kooperierenden Importpfade, keine
  globale neue Unique-Garantie für manuelle/mobile Anlagewege.
- [x] Beide Einzelimporte und Reihen mit Status/Link, blockierter unbekannter
  Prüfung, Wiederholen und Wiederverwendung verbinden. RED: vorhandene
  Komponenten-Regressionsfälle um neue Bestandsverträge erweitern und gezielt
  fehlschlagen lassen. GREEN: `npx vitest run tests/unit/components/bgg-import-editions.test.tsx tests/unit/components/series-entry-conflict.test.tsx`.
  REFACTOR: Komponenten unter ungefähr 300 Zeilen halten, Erfolgsanzeige BUG-069
  und Nachladeprüfung BUG-068 erhalten. Die bestehende Bulk-Import-Behandlung
  überspringt lokal bekannte IDs und behandelt 409 weiterhin als übersprungen;
  die Serverprüfung bleibt für jede tatsächliche Anlage maßgeblich.
- [x] Impeccable: bestehende Club-Gestaltung erhalten, semantische Statusflächen,
  sichtbare Texte, Fokus, umbrechende Aktionen mindestens 44 px. Echte Komponenten
  auf lokalem Server mit synthetischen Antworten rendern, Hell/Dunkel sowie
  schmale Breite und große Schrift prüfen. Lokaler Safari-Nachweis mit synthetischen
  Antworten: 390 px/200 % Schrift, Bestandslink sichtbar, Import deaktiviert;
  Dokumentbreite 384 px, keine überlaufenden Eingaben/Schaltflächen. Kein Schreiben
  in Produktionsdaten.
- [x] Security: Auth vor DB, ausschließlich eigene aktive Spiele, exakte IDs,
  begrenzte Eingaben, keine geheimen/fremden Daten, keine Cache-Lecks. Gezielte
  API-Tests, `npm run security-check:fast` (bestanden; zwei bereits bekannte
  Hinweise) und Review-Regressionscheck (bestanden, keine Regression).
- [x] Dokumentation: Backlog, FEATURES, OpenAPI, FAQ, CONCEPT, AGENTS, Changelog,
  Review-Nachweise und Messartefakt aktualisieren. `npm run test:coverage`,
  `npm run typecheck`, `npm run lint`, `npm run build`; Coverage-Gates müssen
  bestehen. Erledigt: 1.089 Tests bestanden, TypeScript und Build erfolgreich,
  Lint 0 Fehler/651 Warnungen, Review-Regressionscheck 10/10 ohne neue Findings.
  Commit mit regulären Hooks und dessen Ergebnis noch ausstehend.

## Abnahme und Nachweise

Abnahme durchgeführt am 03.11.2026: gezielte API-/Hook-/Komponententests,
TypeScript und lokale gerenderte Browserprüfung sind erfolgt: 52 gezielte API-/Hook-/Komponententests bestanden; vollständiger Coverage-Lauf bestanden: 1.089 Tests in 157 Dateien; Statements 62,56 %, Branches 58,75 %, Functions 67,78 %, Lines 63,98 %. `src/lib`: 89,10/80,56/90,98/91,59 %.
TypeScript, Security-Schnellprüfung und gerenderte Browserprüfung bestanden.
`npm run security-check:fast` meldet zwei bestehende Hinweise (Raw SQL und
Debug-Routen); der vollständige Review-Regressionslauf meldet keine offenen,
neuen oder regressiven Findings. Ohne isolierte Testdatenbank erfolgt kein
schreibender DB-/Browser-Paralleltest; Konflikt- und Wiederholungsverträge werden
mit kontrollierten Transaktionsmocks geprüft. Diese Grenze transparent nennen.
