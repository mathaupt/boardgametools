# Native iOS-Implementierungsplan FEAT-010 bis FEAT-013 – Öffentliche Spieleabende

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der native iOS-Client zeigt Eventstatus und Ergebnis korrekt, bietet zugängliche Terminantworten und macht öffentliche Teilnahme sowie aktive Identität verständlich.

**Architecture:** `PublicEventView` verwendet dedizierte kleine SwiftUI-Komponenten und typisierte RemoteDataSource-Aufrufe. Der Server bleibt Quelle für Lifecycle, gespeicherte Antworten und aktive Kontoidentität. FEAT-013 bedeutet ausdrücklich klare Identitätsanzeige ohne Gastwechsel. Nicht abgesicherte Gastmutationen werden nicht erweitert; FEAT-012-Aktionen für Gäste bleiben bis BUG-053-Servernachweis gesichert ist deaktiviert.

**Tech Stack:** Swift 6, SwiftUI, URLSession/APIClient, Swift Testing, VoiceOver, Dynamic Type, Xcode Simulator.

---

## Aktualitätsprüfung vor Umsetzung

Vor Umsetzung Webpläne FEAT-010 bis FEAT-013, OpenAPI, öffentliche Mobile-Re-Exports, DTOs und `PublicEventView` erneut lesen. Insbesondere BUG-053, Eventstatus-/Objektbindung und FEAT-014-BGG-Suchzustände dürfen nicht durch ältere iOS-DTOs oder lokale Datumslogik umgangen werden.

## Betroffene Dateien

| Datei | Verantwortung |
|---|---|
| `BoardGameTools/BoardGameTools/Networking/DTOs.swift` | Eventresultat, Terminoptionen, gespeicherte Auswahl und Identität abbilden |
| `BoardGameTools/BoardGameTools/Networking/Endpoint.swift` | vorhandene öffentliche Status-, Termin- und Identitätsrouten verwenden |
| `BoardGameTools/BoardGameTools/Data/RemoteDataSource.swift` | GET und erlaubte Auth-Mutationen zentral kapseln |
| `BoardGameTools/BoardGameTools/Views/PublicEventView.swift` | öffentlichen Eventablauf mit Status, Ergebnis und Teilnahme integrieren |
| `BoardGameTools/BoardGameTools/Views/PublicEventStatusHeader.swift` | neuer Status-/Ergebnisblock mit klarer Trennung von geplant, offen, geschlossen und ausgewählt |
| `BoardGameTools/BoardGameTools/Views/PublicDateVotingView.swift` | neue native Terminoptionen mit Gruppierung und gespeicherter Antwort |
| `BoardGameTools/BoardGameTools/Views/PublicIdentitySummary.swift` | neue Anzeige „Du nimmst teil als …“ für Konto/Gast/Beobachter ohne Wechselaktion |
| `BoardGameTools/BoardGameToolsTests/BoardGameToolsTests.swift` | Lifecycle-, Termin-, Identitäts- und DTO-Vertragstests |
| `docs/FEATURES.md`, `docs/FEATURE-BACKLOG.md`, `src/lib/changelog.ts` | native Umsetzung und ausstehende Sicherheitsausschlüsse dokumentieren |

## Umsetzungsschritte

### Task 1: Vertrags- und Zustandsmodelle

- [ ] Reale Web- und OpenAPI-Responses als minimale Fixtures für geplant/offen/geschlossen, Gewinner, ausgewähltes Spiel, Terminoptionen, vorhandene Antwort und currentUserId sichern.
- [ ] Swift-Vertragstests schreiben, die unbekannte Statuswerte, fehlende optionale Felder, leere Auswahl und Datum-only-Zeitzonen robust behandeln.
- [ ] Viewmodel-/Helper-Regeln testgetrieben ergänzen: Serverstatus ist maßgeblich; lokales Datum darf ein geschlossenes Event nicht wieder öffnen; Ergebnis und Gewinner werden nicht aus Rangfolge erraten.
- [ ] RemoteDataSource ausschließlich an bereits dokumentierte Web-/Mobile-Endpunkte binden; keine geheimen Tokens in DTO-Logging oder persistente SwiftData-Modelle übernehmen.

### Task 2: Eventstatus und Ergebnis (FEAT-010)

- [ ] `PublicEventStatusHeader` mit textlichem Status und getrenntem Ergebnisblock ergänzen.
- [ ] Gewinner-Vorschlag und bestätigtes Spiel nur anzeigen, wenn der API-Vertrag sie liefert; unbekannter/noch nicht gewählter Zustand bleibt ausdrücklich erkennbar.
- [ ] Geschlossenes Voting zeigt weiterhin lesbare Inhalte; alle Mutationselemente folgen Serverstatus und Berechtigung.
- [ ] Tests für unbekannten Status, bereits vergangenes aber offen gemeldetes Event und geschlossenes Event ergänzen.

### Task 3: Zugängliche Terminabstimmung (FEAT-011)

- [ ] Terminoptionen als native beschriftete Auswahl mit VoiceOver-Label, gewähltem Zustand, Teilnehmerzahl und Mindestziel 44 × 44 pt darstellen.
- [ ] Gespeicherte Wahl nach erneutem Laden sichtbar machen; Lade-/Fehler-/Erfolgszustand und Retry getrennt ausdrücken.
- [ ] `Date` aus date-only-Werten ohne falsche Zeitzonenverschiebung darstellen; Regeln in reinem Helper testen.
- [ ] Tastatur/Switch Control, VoiceOver-Reihenfolge, Dynamic Type und Reduce Motion im Simulator prüfen.

### Task 4: Teilnahme und Identität (FEAT-012/013)

- [ ] Teilnahmeweg vor passiven Teilnehmerdaten platzieren; Einladungen und öffentliche Teilnehmer in klar beschriftete, VoiceOver-gerechte Gruppen gliedern.
- [ ] Kontoidentität eindeutig darstellen und bei aktiver Session keine gespeicherte Gast-ID zusätzlich senden; ohne Konto bleibt Beobachterstatus klar.
- [ ] FEAT-013 enthält keinen Gastwechsel, keine Wiederaufnahme nach Nickname und keinen lokalen Besitznachweis.
- [ ] Bis BUG-053 abgeschlossen ist, Gastbeitritt/Wiederaufnahme und Gastmutationen nicht auf Basis nackter Gast-ID aktivieren. Vorhandene GET-Ansicht bleibt lesbar; gesperrte Aktionen erklären den Zustand ohne Sicherheitsdetails offenzulegen.
- [ ] Fehler bei fehlendem Netzwerk, abgelaufenem Share-Link und geschlossenem Event als getrennte Zustände prüfen.

### Task 5: Plattformabnahme und Dokumentation

- [ ] `npm run test:ios:contracts` ausführen; anschließend Simulator-Build für iOS 18.5, Screenshots in Hell/Dunkel und mit größter Dynamic-Type-Stufe erstellen.
- [ ] Manuelle VoiceOver-Abnahme für Status, Ergebnis, Terminwahl, Identitätszusammenfassung, Fehler und Fokusfolge dokumentieren.
- [ ] Impeccable-Abschlussprüfung auf tatsächlichen Screenshots durchführen; Findings beheben und Screenshots erneut prüfen.
- [ ] Features/Backlog, FAQ/Concept bei Nutzerverhalten, Changelog und Reviewdokumentation aktualisieren.
- [ ] Umsetzungsfreigabe und öffentliche Gastmutationen separat behandeln; dieses Dokument ist ein Plan, keine Freigabe.

## Abnahmekriterien

- Eventstatus und bestätigtes Ergebnis stammen aus dem Serververtrag und bleiben bei Datumsgrenzen konsistent.
- Terminantworten sind nativ, verständlich, erneut ladbar, VoiceOver-bedienbar und bei großer Schrift nutzbar.
- Teilnahme ist vor passiven Listen erreichbar; aktive Identität ist eindeutig und sendet keine zweite Identität.
- Keine Gastwechsel- oder Gastübernahmefunktion wird eingeführt; BUG-053 bleibt eine klare Aktivierungsvoraussetzung für öffentliche Gastmutationen.
- Native Screenshots belegen Hell/Dunkel, VoiceOver-relevante Beschriftung und Dynamic Type.
