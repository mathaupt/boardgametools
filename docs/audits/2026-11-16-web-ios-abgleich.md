# Webprüfung und iOS-Abgleich vom 16.11.2026

## Ergebnis und Prüfgrenze

Geprüfter Stand: `92b9949`, zu Beginn sauberer Arbeitsbaum. Die Webgestaltung
Club Programme bleibt maßgeblich. Der native Client besitzt dieselbe Grundlage,
bildet die jüngeren Webfunktionen aber nur teilweise ab. Es wurde kein
Laufzeitcode geändert und keine Produktionsmutation ausgeführt.

Impeccable: kohärente vorhandene Gestaltung; der statische Scan findet 65
Hinweise, davon 64 Empfehlungen und einen primären Hinweis auf einen farbigen
Rand in einer Mailvorlage (`src/lib/mailer.ts:276`). Dieser Mailhinweis belegt
keinen Fehler der Weboberfläche und rechtfertigt keinen pauschalen Umbau.

Die lokale Loginseite wurde im nativen Safari tatsächlich gerendert und über
Screenshot und Accessibility-Baum geprüft: klare Hierarchie, beschriftete
Eingaben, Anmeldung, Registrierung, Passwortwiederherstellung und BGG-Herkunft
sind vorhanden. Kein angemeldeter Prüfaccount wurde verwendet. Dashboard,
öffentliche Events, schmale Viewports, Dark Mode, Touchgesten und VoiceOver sind
in diesem Lauf nicht gerendert abgenommen. Deshalb wird kein umfassender
WCAG-, Responsive- oder Performance-Score behauptet.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm run typecheck` | Bestanden |
| `npm run lint` | Exit 0, aber 652 Warnungen; Werkzeugdateien unter `.agents/` werden mitgeprüft |
| `npm run test -- --reporter=dot` | 1.417 bestanden, 19 fehlgeschlagen; 226 Dateien bestanden, 3 fehlgeschlagen |
| `npm run test:ios:contracts` | Alle fünf ausgegebenen Vertragsgruppen bestanden; Xcode-Makroprozesse benötigen Ausführung außerhalb der Sandbox |
| Gezielter Swift-Dekodierungsnachweis | Aktuelles `SessionDTO` scheitert bei `gameId: null` mit `valueNotFound(Swift.String)` |
| `npm audit --omit=dev --json` | 0 Befunde |
| `npm audit --json` | 2 moderate, 3 niedrige Befunde; keine hohen/kritischen |
| `npm run review-evaluate:report` | 9,9/10; SEC-45 wegen zunächst fehlender gültiger Registrydaten als Regression gemeldet |

Nachlauf `npm run review-evaluate` mit Registryzugriff: 9,9/10, Sicherheit
10/10, keine Regression; Snapshot `history/2026-11-16_1802.json`.
Die sieben Changelogtests bestehen.

Der Evaluatorscore ist eine Musterprüfung und kein Ersatz für den vollständigen
Testlauf: Er meldet auch bei den 19 fehlschlagenden Tests eine hohe Bewertung.
Der nachfolgende echte Registryabgleich bestätigt einen sauberen Produktionsaudit,
aber neue moderate Entwicklungsbefunde über CodeceptJS → MCP SDK → Hono und
`@hono/node-server`. Die drei niedrigen Befunde betreffen den shadcn/deepmerge-Pfad.
Kein automatisches `npm audit fix --force`: npm schlägt für diesen Pfad einen
Major-Wechsel zu einer alten shadcn-Version vor.

## Priorisierte Befunde

### P1: iOS kann gültige Eventpartien nicht synchronisieren (BUG-079)

`Networking/DTOs.swift:62` verlangt eine nicht optionale `SessionDTO.gameId`.
`src/lib/dto-mappers/session.ts` liefert vertragsgemäß `null` für Partien mit
Spiel-Snapshot. Bereits eine solche Partie lässt die Array-Dekodierung scheitern.
`LocalSession` bildet zusätzlich weder Snapshot noch Gastmitspieler ab.
Empfehlung: optionaler Bezug, verlustfreier lokaler Roundtrip und Darstellung aus
Sammlungsrelation beziehungsweise Snapshot. Erst diesen Vertrag korrigieren,
dann neue Eventpartien-Oberflächen ergänzen. Prüfung: echte Swift-DTO mit
synthetischer API-Antwort; keine Produktionsdaten verwendet.

### P1: Eventtests sind vom Tagesdatum abhängig (BUG-082)

Die drei Dateien `tests/unit/api/event-state-guards.test.ts`,
`tests/unit/lib/services/event.test.ts` und
`tests/unit/app/api/mobile/v1/events.test.ts` verwenden Termine am 10./15.11.2026
ohne festgelegte Uhr. Am 16.11.2026 lehnt die korrekte Lifecycle-Prüfung Aktionen
mit 409 ab. Das erklärt die 19 Testfehler. Empfehlung: Systemzeit pro Suite
kontrollieren und wiederherstellen; Vergangenheit/Gegenwart/Zukunft ausdrücklich
prüfen, statt Fixturetermine regelmäßig weiterzuschieben.

### P2: Ältere Sessions sind nicht erreichbar (BUG-080)

`src/app/(dashboard)/dashboard/sessions/page.tsx:41` begrenzt auf 20 Sessions,
bietet aber keine Seitennavigation. Empfehlung: kontogebundene Pagination mit
stabiler Reihenfolge aus Datum und ID, Anzahl und URL-Zustand. Eine Sammlung mit
mindestens 21 Sessions muss vollständig erreichbar sein.

### P2: Eventübersicht unterschlägt Gaststimmen (BUG-081)

`src/app/(dashboard)/dashboard/events/page.tsx` fragt nur `_count.votes` ab;
`src/components/dashboard/events-overview.tsx` zeigt diesen Wert als „Stimmen“.
Die Hauptübersicht und das Voting zählen dagegen Konto- und Gaststimmen.
Empfehlung: denselben Gesamtstimmenvertrag nutzen und mit einer Konto- plus zwei
Gaststimmen die Anzeige „3 Stimmen“ sichern.

### P2: Mobile BGG-Importe verwenden nicht den geschützten Wiederverwendungsweg (BUG-083)

`src/app/api/mobile/v1/bgg/import/route.ts` ruft direkt `GameService.create` auf.
Der Webimport verwendet `createOrReuseBggGame` mit erneuter Prüfung innerhalb
einer serialisierbaren Transaktion. Ein wiederholter Mobile-Import kann deshalb
einen weiteren aktiven Datensatz erzeugen. Empfehlung: denselben privaten,
kontogebundenen Importvertrag verwenden; vorhandene Nutzerdaten bewahren und
Parallelimporte testen. BGG-Ausgabenwahl separat ergänzen.

## Weitere Optimierungen

- **Performance:** Die Eventliste lädt komplette Spiele, Einladungen und einzelne
  Kontostimmen, obwohl die Präsentationskomponente größtenteils Zusammenfassungen
  verwendet. Explizite `select`-Abfragen, begrenzte Vorschau und echte Zählwerte
  reduzieren Datenmenge. Keine gemessene Latenzverbesserung behauptet.
- **Dashboard:** Zähler, letzte Partien, kommende Events und Einladungen werden
  teilweise nacheinander geladen. Unabhängige Abfragen parallel starten; die
  Abhängigkeit der Top-3-Abfrage vom nächsten Event beibehalten.
- **Prüfbarkeit:** ESLint soll eigenen Quellcode statt versionierter fremder
  Skill-/Werkzeugbundles prüfen. Warnungsfreie Quelle gezielt nachweisen; echte
  Anwendungswarnungen nicht pauschal ausblenden.
- **Typografie/Theming:** Die statischen Hinweise zeigen unter anderem kleine
  9–11-px-Beschriftungen und Abweichungen von dokumentierten Schriftstufen.
  Konkrete Oberflächen gerendert mit großer Schrift und beiden Themes prüfen,
  bevor daraus Fehler oder Designänderungen abgeleitet werden.
- **BGG-Suchzustände:** Der Webhook hat Abbruch-/Stale-Response-Schutz und klare
  Leerzustände. Diese Muster im nativen Client nachziehen. Die iOS-Suche zeigt
  bei null Treffern noch denselben Einstiegstext wie vor einer Suche.

## Plattformabgleich

| Bereich | Native Lücke | Weiteres Vorgehen |
|---|---|---|
| Voting FEAT-001–004 | Eventdetail ohne Vorschlags-/Votingoberfläche | Bestehenden iOS-Plan aktualisieren und umsetzen |
| Öffentliche Events FEAT-010–013 | Termine und aktive Identität nicht vollständig abgebildet | Alten BUG-053-Blocker durch Prüfung des inzwischen implementierten Cookievertrags ersetzen |
| BGG FEAT-014/021/023/027 | Suchzustände, Ausgabenwahl, Bestandsprüfung | Zuerst sicheren Mobile-Import herstellen |
| Dashboard FEAT-015 | Top-3-Vorschläge fehlen | Typisierte Übersicht, ohne Gewinner aus Ranking abzuleiten |
| Sessions FEAT-016/017/029/031 | Ungefilterter Picker, fehlende Spielcover, keine Eventpartien-Anlage | Zuerst BUG-079, danach native Suche und Eventablauf |
| Reihen FEAT-024/025 | Einzelanlage nur aus Sammlung | Mehrfachauswahl und temporäre Nutzung getrennt anbieten |
| Erfolge FEAT-028/032 | Endpunkte und Oberflächen für Mobile fehlen | Eigenes authentifiziertes API-/UI-Paket mit Opt-in-Verträgen |
| Sprache FEAT-019 | Keine native Umsetzung | Eigenes Plattformpaket; native Diktierfunktion und explizite Übernahme vor eigener Audioverarbeitung bewerten |

## Empfohlene Reihenfolge

1. BUG-079 und BUG-082 als Grundlage des iOS-Nachzugs beheben.
2. Native Sessions und authentifiziertes Voting nachziehen.
3. BGG/Import und Reihen ergänzen.
4. Eventpartien, öffentliche Teilnahme und Erfolge als getrennte Pakete abnehmen.
5. Web: BUG-080/081, schlankere Abfragen, danach Werkzeug-/Dependency-Pflege.
6. `$impeccable harden` für Zustände, `$impeccable optimize` für die belegten
   Datenabfragen und abschließend `$impeccable polish` mit gerenderten Belegen.

Die Pakete können einzeln oder gemeinsam freigegeben werden. Nach Korrekturen
Audit erneut ausführen; dieser Bericht ist die Ausgangsbasis, keine Abnahme der
noch fehlenden Funktionen.
