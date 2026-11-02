# Feature-Backlog

Nummerierte Anforderungen für spätere Implementierungspläne und Umsetzungen.
Ein Eintrag ist keine Umsetzungsfreigabe. IDs werden fortlaufend vergeben und
nicht wiederverwendet. Verbindlicher Ablauf:
[Entwicklungsprozess](DEVELOPMENT-PROCESS.md#verbindlicher-feature-ablauf).

Vor jeder Implementierung ist auch ein bereits erstellter/freigegebener Plan
kurz mit dem aktuellen Stand nach vorherigen Umsetzungen abzugleichen und bei
Bedarf zu aktualisieren. Ergebnis am jeweiligen Plan dokumentieren:
[verbindliche Aktualitätsprüfung](DEVELOPMENT-PROCESS.md#aktualitätsprüfung-vor-jeder-implementierung).

## Übersicht

| ID | Feature | Status | Implementierungsplan | Umsetzungsfreigabe |
|---|---|---|---|---|
| FEAT-001 | Spieldetails aus dem Voting öffnen | Umgesetzt (Web) | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Freigegeben und umgesetzt am 30.10.2026 |
| FEAT-002 | Voting-Vorschläge sortieren | Umgesetzt (Web) | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Freigegeben und umgesetzt am 30.10.2026 |
| FEAT-003 | Kompakte Voting-Liste | Umgesetzt (Web) | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Kompakte Zeilenliste nach sichtbarem Vergleich ausdrücklich gewählt und zur Umsetzung freigegeben am 31.10.2026 |
| FEAT-004 | Voting-Vorschläge löschen | Web umgesetzt; manuelle VoiceOver-Abnahme offen | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Web freigegeben und umgesetzt; iOS separat planen |
| FEAT-005 | ApiLog-Schreiblast für `/api/health` begrenzen | Im FEAT-006-Code für beide Healthpfade umgesetzt; Rollout offen | [Health-Logpolicy](superpowers/plans/2026-10-31-FEAT-005-health-apilog.md) | In FEAT-006 zur Umsetzung freigegeben |
| FEAT-006 | Health-Deep-Checks cachen oder splitten | Web-Code umgesetzt; Readiness-Rollout und isolierte DB-Abnahme offen | [Liveness und Readiness](superpowers/plans/2026-10-31-FEAT-006-health-liveness-readiness.md) | Codeumfang mit „dann weiter mit B“ am 01.11.2026 gestartet; Monitorumstellung separat |
| FEAT-007 | Vercel-Firewall-Regel für `/api/health` | Lesende Vorprüfung abgeschlossen; Konto- und Monitorinventar offen | [Firewall und Monitorbetrieb](superpowers/plans/2026-10-31-FEAT-007-health-firewall.md) | Regeländerung ausstehend; 30/min-Wert noch nicht durch Trafficdaten bestätigt |
| FEAT-008 | Spend-Management-Obergrenze (Billing-Schutz) | Lesende Vorprüfung abgeschlossen; Billingdaten und Betreiberentscheid offen | [Budget und Betriebsreaktion](superpowers/plans/2026-10-31-FEAT-008-spend-management.md) | Betrag, Empfänger und Teamwirkung vor Aktivierung festzulegen |
| FEAT-009 | HTML-Entities in Spieldaten korrekt behandeln | Code umgesetzt; Produktionsdatenbereinigung offen | [Textnormalisierung und Datenbereinigung](superpowers/plans/2026-10-31-FEAT-009-spieldaten-entities.md) | Codeumsetzung am 31.10.2026 freigegeben; Produktionslauf separat freizugeben |
| FEAT-010 | Event-Status und Ergebnis eindeutig darstellen | Umgesetzt und abgenommen (Web/Mobile-API) | [Zustandsregeln und Ergebnisdarstellung](superpowers/plans/2026-10-31-FEAT-010-eventstatus-ergebnis.md) | Am 31.10.2026 freigegeben und mit isolierter PostgreSQL- und Chromium-Abnahme abgeschlossen; native iOS-Oberfläche bleibt separat |
| FEAT-011 | Mobile und assistive Bedienung der Terminabstimmung | Implementiert (Web; automatisierte Abnahme abgeschlossen, manuelle VoiceOver-Abnahme offen) | [Zugängliche Terminabstimmung](superpowers/plans/2026-10-31-FEAT-011-terminabstimmung-barrierefrei.md) | Automatisierte Web-Abnahme am 01.11.2026 abgeschlossen; VoiceOver manuell offen, iOS separat |
| FEAT-012 | Teilnahme vor passive Listen rücken | Web umgesetzt; Browser-E2E/Viewport-Abnahme offen | [Teilnahmeweg und Teilnehmerdaten](superpowers/plans/2026-10-31-FEAT-012-oeffentliche-teilnahme.md) | Umgesetzt am 01.11.2026; Web zuerst, iOS separat |
| FEAT-013 | Aktive Identität verständlich machen | Web umgesetzt; Browser-E2E/Viewport-Abnahme offen | [Eine aktive Identität](superpowers/plans/2026-10-31-FEAT-013-aktive-identitaet.md) | Umgesetzt am 01.11.2026; ohne Gastwechsel |
| FEAT-014 | Suchzustände und Beschriftung der BGG-Suche | Implementiert (Web; Browser-E2E offen) | [Öffentliche BGG-Suche](superpowers/plans/2026-10-31-FEAT-014-bgg-suchzustaende.md) | Am 01.11.2026 freigegeben und umgesetzt; native iOS-Suche nicht Teil dieses öffentlichen Web-Umfangs |
| FEAT-015 | Top-3-Spiele im Event-Kurzüberblick | Umgesetzt (Web; Browser-Viewportabnahme offen) | [Dashboard Top drei](superpowers/plans/2026-11-02-FEAT-015-dashboard-top-three.md) | Web-Umsetzung am 02.11.2026 freigegeben und umgesetzt; iOS separat |
| FEAT-016 | Spielauswahl bei Session-Anlage per Eingabe filtern | Web umgesetzt; manuelle Browser-/VoiceOver-Abnahme offen | [Durchsuchbare Spielauswahl](superpowers/plans/2026-11-02-FEAT-016-session-spielsuche.md) | Web am 02.11.2026 durch „implementiere FEAT-016“ freigegeben und umgesetzt; iOS separat planen |
| FEAT-017 | Spielcover in der Sessions-Übersicht anzeigen | Web umgesetzt; Browser-/Viewportabnahme offen | [Cover in Sessionkarten](superpowers/plans/2026-11-02-FEAT-017-session-cover.md) | Web-Umsetzung am 02.11.2026 freigegeben und umgesetzt; iOS separat |
| FEAT-018 | Testabdeckung schrittweise auf 80 % erhöhen | Plan erstellt; Governance und Skills ergänzt; Testausbau offen | [Coverage-Ziel 80 %](superpowers/plans/2026-11-02-FEAT-018-coverage-80.md) | Keine |
| FEAT-019 | Spracheingabe für Suche und Session-Anlage | Konzept dokumentiert; Plan und Umsetzung offen | [Spracheingabe-Konzept](superpowers/specs/2026-11-02-spracheingabe-design.md) | Keine |
| FEAT-020 | Lesbare Trefferflächen für öffentliche Spielvorschläge | Web umgesetzt; gerenderte Theme-/Viewportabnahme offen | [Kontrast der Spielvorschläge](superpowers/plans/2026-11-02-FEAT-020-public-event-proposal-contrast.md) | Web am 02.11.2026 freigegeben und umgesetzt; iOS nicht betroffen |

Am 30.10.2026 aufgenommen. Bei der Planung sind Web, iOS sowie angemeldete und
öffentliche Voting-Ansichten auf Relevanz und bereits vorhandene Teilfunktionen
zu prüfen. Der konkrete Plattformumfang wird im jeweiligen Plan festgelegt und
zur Umsetzung freigegeben.

## Offene Abarbeitung

Die Abschnitte A bis E spiegeln den Abarbeitungsstand vom 01.11.2026 wider.
Neue offene Feature-Anforderungen werden nachfolgend ergänzt. „Offen“ bedeutet
hier entweder eine ausdrücklich ausstehende Abnahme, eine gesonderte
Produkt-/Betriebsfreigabe oder einen separat zu planenden Sicherheitsumfang.
Diese Übersicht erteilt keine neue Umsetzungsfreigabe.

### A. Öffentliche Eventseite im Web abnehmen

Umgesetzte Features: FEAT-011 bis FEAT-014. Noch ausstehend:

**Prüfstand 01.11.2026:** 48 gezielte UI-Tests bestanden; der Impeccable-Detektor
meldet keine Findings für die Eventseiten-Komponenten. Browser-, Datenbank- und
VoiceOver-Abnahmen wurden nicht ausgeführt. Es ist keine `BGT_TEST_DATABASE_URL`
konfiguriert, PostgreSQL läuft lokal nicht, und die Browser-Session ist derzeit
nicht verfügbar. Auf ausdrücklichen Wunsch wurden ausschließlich nicht
schreibende Prüfungen vorgenommen.

- FEAT-011: manuelle VoiceOver-/Screenreaderprüfung für Identität, Terminantworten,
  gespeicherte Auswahl, Fehler und Fokusverhalten; BUG-038 bis dahin offen.
- FEAT-012/013: Browser-E2E mit isolierten Identitäten und echten Testdaten sowie
  390/1440 px, hell/dunkel und 200-%-Zoom prüfen. BUG-041 erst nach bestätigtem
  Desktopraster schließen. BUG-053 bleibt davon getrennt und offen.
- FEAT-014: öffentlicher Such- und Detailablauf im Browser gegen isolierte
  Testdaten nachprüfen; Suchfehler, Wiederholung, Fokus und Vorschlag abdecken.
- Nach der Browserprüfung Bugs, Pläne und Review-Nachweise anhand tatsächlicher
  Ergebnisse aktualisieren. Die Web-Implementierung ist nicht mit dieser
  Restabnahme gleichzusetzen.

### B. Health-Endpunkt absichern: FEAT-006

Die vorangehende Backlog-Angabe zu FEAT-005 war falsch; der FEAT-006-Code
schließt inzwischen beide exakten Healthpfade an der zentralen Loggergrenze aus.
Die öffentliche Liveness ist DB-, Session- und Redis-frei. Readiness verlangt
ein separates Token, begrenzt den Prozesszugriff und führt eine einzelne
zeitbegrenzte Probe aus. Gezielte Unit-Tests decken Verträge, Middleware,
Logging, Tokenprüfung und Probe-Mocks ab. Nicht ausgeführt wurden echte
DB-Last-/Timeout-/Erholungstests und die Browser-/Produktionsmonitor-Abnahme.
Deployment, Secretbereitstellung und Monitorumstellung bleiben offen; der
geänderte `/api/health`-Vertrag darf erst nach Verbraucherabgleich ausgerollt
werden.

### C. Vercel-Betriebsschutz: FEAT-007 und FEAT-008

- **Vorprüfung 01.11.2026:** FEAT-006-Code ist committed, aber der zuletzt
  gelesene Vercel-Production-Deploy (`READY`, 21:21:57 Europe/Berlin) stammt
  von vor dem Codecommit. Die geänderte Healthsemantik ist daher noch nicht
  als produktiv aktiv belegt. Der sichere Vercel-Pipelinecheck wurde lesend
  erfolgreich ausgeführt; er liefert nur Deploymentstatus, kein Billing oder
  Firewallinventar.
- **FEAT-007:** Projekt-Tarif, bestehende WAF-Regeln und externe
  Uptime-Monitorquellen sind nicht aus dem Vercel-Konto gelesen. Ein
  Runbook mit exakt begrenztem, noch nicht aktivem 30/min-Regelvorschlag ist
  erstellt. Der Wert darf erst nach Monitor-/Trafficmessung bestätigt werden.
- **FEAT-008:** Tarif, aktuelle Nutzung, Budget, Kontakte und Projektumfang
  sind nicht gelesen. Vercel CLI `budgets` ist hier nicht installiert; der
  aktuelle Plan sieht die Lesebefehle und teamweite Wirkung einer optionalen
  Produktionspause vor. Das Entscheidungs- und Monatsprüfungsblatt ist
  angelegt. Betrag, Warnempfänger und Pauseverhalten bleiben Betreiberentscheide.
- Für den aktuellen Kontostand ist Vercel-Accountzugriff erforderlich. Keine
  Firewall- oder Billingeinstellung wurde geändert. Spend Management ist kein
  garantierter harter Rechnungsdeckel.

Beide Features sind Betriebsänderungen und benötigen die im jeweiligen Plan
genannten Freigaben vor Veröffentlichung.

### D. Produktionsdaten für FEAT-009 bereinigen

Der Code ist umgesetzt; offen ist nur der Produktionslauf. Zuerst einen
lesenden Bericht und ein konkretes, idempotentes Manifest erzeugen, Änderungen
prüfen und ein Backup nachweisen. Erst danach den separaten Produktionslauf
freigeben und Ergebnis/Stichproben dokumentieren. Keine Bereinigung aufgrund
alleiniger Codefreigabe starten.

**Vorprüfung 01.11.2026:** Im aktuellen Prozess ist keine
`BGT_MAINTENANCE_DATABASE_URL` konfiguriert; daher wurde weder ein Datenbanklauf
noch ein Manifest erzeugt. `backups/boardgametools_20261101_220819.sql.gz` ist
gzip-konsistent. Das bestätigt nur die Integrität des Archivs, nicht seine
Produktionsherkunft oder Wiederherstellbarkeit. Ein Produktionslauf bleibt
separat freigabepflichtig.

### E. Getrennte Sicherheits- und Plattformpläne

- BUG-053 ist ein offener Sicherheitsbefund hoher Schwere: Besitznachweis und
  sichere Wiederaufnahme bestehender Gastzugänge müssen als eigener Umfang
  geplant und freigegeben werden. FEAT-013 hat absichtlich keinen Gastwechsel,
  Besitznachweis oder Stimmenmigration eingeführt.
- Native iOS-Oberflächen sind laut FEAT-001 bis FEAT-004 sowie FEAT-010 bis
  FEAT-013 separat zu planen und abzunehmen. Die bestehenden Web-Umsetzungen
  und iOS-Vertragstests bedeuten keine iOS-UI-Umsetzung.

**Planstand 01.11.2026:** drei nicht freigegebene Pläne erstellt:
[BUG-053 Besitznachweis](superpowers/plans/2026-11-01-BUG-053-gastzugang-besitznachweis.md),
[iOS FEAT-001–004](superpowers/plans/2026-11-01-ios-FEAT-001-004-voting.md)
und [iOS FEAT-010–013](superpowers/plans/2026-11-01-ios-FEAT-010-013-public-events.md).
Die iOS-Pläne sperren öffentliche Gastmutationen bis zur serverseitigen
BUG-053-Lösung; sie ändern nicht die bestätigte Entscheidung gegen einen
Gastwechsel in FEAT-013.

### F. Session-Spielauswahl beschleunigen: FEAT-016

Die Web-Sessionanlage verwendet einen lokalen Suchpicker für Spiele aus der
eigenen Sammlung. Suche und Trefferliste unterstützen Umlaute, `ß`/`ss` und
HTML-Entities; die Auswahl bindet ausschließlich die Spiel-ID. Ein fehlender
oder veralteter Wert wird vor dem API-Aufruf abgewiesen und fokussiert. Die
vorhandene Session-API und serverseitige Eigentumsprüfung bleiben unverändert.
Gezielte Filter-, Picker-, Formular-, API- und Service-Tests bestanden. Die
native iOS-Auswahl bleibt separat zu planen; manuelle Browser-/VoiceOver- und
Viewportabnahmen sind noch offen.

### G. Spiele in der Session-Übersicht erkennen: FEAT-017

Die Sessions-Liste zeigt pro Session das zugehörige Spielcover, damit
Spielrunden schneller visuell unterscheidbar sind. Die kleine Covervariante,
URL-Prüfung und Fehler-Fallback sind im Web implementiert und gezielt getestet.
Die Impeccable-Kritik ergab
21/40 Punkte; stärkster Bezug ist die derzeitige Wiederholung desselben
Würfelzeichens anstelle eines spielbezogenen Erkennungsmerkmals. Der Detektor
meldet 0 statische Findings. Eine Live-Browserprüfung war nicht möglich, weil
der Browserhost nicht verfügbar war. Der Plan legt eine ruhige Coverdarstellung, fehlende Bilder, lange Titel
und mobile Zeilen-/Kartenbreiten als Prüfgegenstände fest. Der Plan liegt für die Web-Liste vor; iOS wird separat geplant.

### H. Testqualität und 80-%-Coverage: FEAT-018

Ausgangsstand am 02.11.2026: 849 Unit-Tests in 117 Dateien; global 46,84 %
Statements, 44,59 % Branches, 48,65 % Functions und 48,08 % Lines; 91 erfasste
Produktionsdateien liegen bei 0 % Lines. Langfristiges
Ziel sind mindestens 80 % in allen vier Metriken für den nachvollziehbar
festgelegten Anwendungscode. Der stufenweise Plan ist erstellt. Die
Coverage-Schranken (global bereits 22 % je Metrik) bleiben zunächst unverändert; schrittweise Erhöhung und
Tests für bisher unbedeckte Bereiche stehen aus. TDD wurde als verbindliche
Agentenregel ergänzt. Zwei Stack-Skills wurden lokal aufgenommen.

### I. Spracheingabe: FEAT-019

Das Konzept trennt zwei Fähigkeiten, damit einfache Spracheingabe ohne KI
starten kann und strukturierte Session-Befehle eigene Datenschutz- und
Qualitätsprüfungen erhalten:

1. **Diktat für Suche und Notizen:** Nutzer:innen sprechen nach aktivem
   Mikrofonstart in vorhandene Textfelder. Der erkannte Text bleibt editierbar;
   bestehende Such- und Speicheraktionen werden unverändert verwendet. Dafür
   ist keine KI erforderlich.
2. **Gesprochene Session-Befehle:** Eine Aussage wie „Azul mit Anna, 90
   Minuten“ wird zunächst in einen Session-Entwurf übersetzt. Spiele und
   Personen müssen gegen die verfügbare Sammlung und vorhandenen Konten
   aufgelöst werden. Unbekannte oder mehrdeutige Angaben bleiben offen; die
   Anwendung speichert erst nach sichtbarer Prüfung und Bestätigung.

**Empfohlene Reihenfolge:** Zuerst Diktat für Suche und Notizen im Web
implementieren. Danach Session-Befehle separat planen. Eine KI ist dafür
optional und darf höchstens den erkannten Text in ein strikt validiertes
Entwurfsschema überführen; sie erhält keine Audiodateien und darf keine
Aktionen direkt ausführen. Native iOS-Eingabe ist separat zu planen.

**Bestandsbefund:** Die Web-App setzt derzeit global
`microphone=()` in ihrer `Permissions-Policy`; Mikrofonzugriff ist daher vor
einer Implementierung gezielt und eng begrenzt zu erlauben. Browser-
Spracherkennung ist nicht überall verfügbar und kann Audio an einen
Browserdienst übertragen. Deshalb bleiben manuelle Texteingabe, erkennbare
Aufnahme-/Abbruchzustände und eine verständliche Berechtigungsablehnung
Pflicht. Audio wird nicht dauerhaft gespeichert.

**Vorgesehene Prüfkriterien:**

- Mikrofonstart nur nach ausdrücklicher Nutzeraktion; Ablehnung, fehlende
  Unterstützung, Abbruch und Erkennungsfehler erhalten einen bedienbaren
  Textfeld-Fallback.
- Erkannter Text ist vor Suche oder Verwendung editierbar; Diktat führt keine
  Such- oder Speicheraktion ungefragt aus.
- Session-Befehle werden ausschließlich als Entwurf angezeigt. Nur eindeutig
  zugeordnete Sammlungsspiele und Konten werden vorausgefüllt; mehrdeutige
  Felder müssen Nutzer:innen auswählen oder ergänzen.
- Kein automatisches Speichern, keine unbestätigte Mutation und keine
  dauerhafte Audiospeicherung. Ein optionaler KI-Anbieter, die Textübertragung,
  Aufbewahrung und Einwilligung sind vor einem separaten Plan festzulegen.
- Tests decken Erkennungszustände, Berechtigungsablehnung, Fallback,
  Editierbarkeit, Schema-/Zuordnungsfehler, Mehrdeutigkeit, Bestätigung und
  Abbruch ab. Serverberechtigungen und Session-API bleiben maßgeblich.
- Tastatur, Screenreader-Status, Fokus, Mikrofonindikator und responsive
  Darstellung werden abgenommen; Browser-E2E nur mit isolierten Testdaten.

**Umfang:** Zunächst Web-Konzept. Es liegt noch kein Implementierungsplan und
keine Umsetzungsfreigabe vor. Die konkrete Browsererkennung und ein möglicher
KI-Anbieter sind vor der jeweiligen Planung anhand der dann aktuellen
Plattformunterstützung und Datenschutzbedingungen zu entscheiden.

### Vorgeschlagene Reihenfolge

1. Öffentliche Eventseite (A), weil die Implementierung vorhanden ist und die
   offenen Browser-/Assistive-Abnahmen die Restbugs entscheiden.
2. FEAT-006 nach Bestätigung der Liveness-/Readiness-Verträge.
3. FEAT-009 Produktionsbereinigung nach Manifest- und Backupprüfung.
4. FEAT-007 und FEAT-008 nach Klärung von Monitor- und Budgetparametern.
5. BUG-053 als eigener Sicherheitsplan; iOS-Oberflächen nach Plattformpriorität.

FEAT-005 bis FEAT-008 am 30.10.2026 aus einer Betrachtung zur Absicherbarkeit
des Health-Endpoints aufgenommen (Hochlast- und DDoS-Szenario). Die Features
betreffen Betriebs- und Plattformkonfiguration; iOS ist nicht betroffen.

FEAT-009 am 30.10.2026 aus einem Anzeigefehler bei Spielnamen aufgenommen:
HTML-Entities wie `&amp;` sind sichtbar, statt als Zeichen dargestellt zu
werden (Beispiel „Horrified: Dungeons &amp; Dragons").

FEAT-010 bis FEAT-014 am 30.10.2026 aus der Impeccable-Prüfung der
öffentlichen Eventseite aufgenommen (Ergebnis 23/40; Quelle:
`.impeccable/critique/2026-10-30T14-45-15Z__src-app-public-event-token-page-tsx.md`).
Je Feature sind die zugehörigen BUG-IDs und Quellenangaben vermerkt. Die
Prüfung arbeitete mit synthetischen Antworten und ohne Backend-Abnahme;
serverseitige Regeln sind je Feature gesondert zu prüfen. FEAT-001 bis
FEAT-004 decken die darin genannten Spiel-Listenfunktionen bereits ab.

## FEAT-001 – Spieldetails aus dem Voting öffnen

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Umsetzungsfreigabe:** Am 30.10.2026 ausdrücklich für FEAT-001 erteilt; Web umgesetzt. Native iOS-Oberfläche separat zu planen.

**Ziel:** Ein vorgeschlagenes Spiel beurteilen können, ohne es separat suchen zu müssen.

**Umsetzung:** Spielname und Aktion „Spieldetails“ öffnen auf allen drei Web-Votingansichten
denselben zugänglichen Dialog. Native iOS-Oberfläche separat planen.

**Umsetzungsnachweis und offene Abnahme:**

- [x] Spieldetails sind direkt aus öffentlichen und geschützten Voting-Vorschlägen erreichbar.
- [x] Schließen per Aktion oder Escape erhält Liste und gibt den Fokus an den Auslöser zurück.
- [x] Sammlungsspiele und BGG-Vorschläge berücksichtigen; fehlende Details verständlich anzeigen.
- [x] Öffentliche Gäste erhalten keine lokale Sammlungsbeschreibung; Abfrage ist token- und vorschlagsgebunden, nicht cachebar und rate-limitiert.
- [x] Dialogbedienung mit Tastatur und Bildschirmleser über Radix-Dialog, Labels und Fokusführung unterstützt.
- [x] Sichtprüfung bei 390/1440 px sowie Hell-/Dunkelmodus; Impeccable-Renderdetektor ohne Befund. Interner Scroll, Viewportbegrenzung, Escape und Fokus-Rückgabe geprüft.

**Abgeschlossen:** 30.10.2026, Version 0.50.26. Spieldetails werden erst nach Öffnen geladen. Fehler haben eine Wiederholungsaktion; BGG-Ausfall lässt verfügbare Grunddaten bestehen. Private Datenfreigabe setzt Event-Ersteller-/Einladungszugriff voraus.

## FEAT-002 – Voting-Vorschläge sortieren

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Umsetzungsfreigabe:** Ausdrücklich erteilt am 30.10.2026 mit „implement feat-002“.

**Ziel:** Führende Spiele und andere Vorschläge schnell vergleichen können.

**Anforderung:** Die Vorschlagsliste erhält eine wählbare Sortierung.
Standard: **Anzahl der Stimmen, absteigend** – die meisten Votes zuerst.

**Abnahmekriterien:**

- Ohne aktive Auswahl ist die Liste nach Stimmenzahl absteigend sortiert.
- Eine beschriftete Auswahl erlaubt weitere Sortierungen; konkrete Optionen im Plan festlegen.
- Gleichstände, Vorschläge ohne Stimmen und neue Votes haben ein im Plan definiertes,
  nachvollziehbares Verhalten.
- Sortierung verändert weder Stimmen noch Voting-Ergebnisregeln.

**Abgeschlossen:** 30.10.2026, Version 0.50.27. Web-Ansichten sortieren standardmäßig nach kombinierten Nutzer- und Gaststimmen; Name und Erstellungszeitpunkt sind zusätzlich wählbar.

## FEAT-003 – Kompakte Voting-Liste

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Umsetzungsfreigabe:** Kompakte Zeilenliste nach sichtbarem Vergleich ausdrücklich gewählt und am 31.10.2026 zur Umsetzung freigegeben. iOS bleibt separat zu planen.

**Ziel:** Bei vielen Vorschlägen mehr Überblick auf begrenztem Bildschirmraum erhalten.

**Entscheidung:** Die kompakte Zeilenliste wurde nach dem visuellen Vergleich der
bisherigen Kartenansicht vorgezogen. Bei zehn synthetischen Vorschlägen waren auf
390 px fünf statt zwei Einträge vollständig sichtbar. Umsetzung für öffentliche
Events, Eventdetails und die eigene Voting-Seite.

**Abnahmekriterien:**

- [x] Vorschläge mit Cover, umbrechendem Namen, Spielerzahl, Dauer, Einreicher und Gesamtstimmen kompakt darstellen.
- [x] Spieldetails, Stimmenaufschlüsselung und vorhandene Abstimmungsaktionen bleiben erreichbar; Löschaktion bleibt für berechtigte Personen sichtbar.
- [x] Sortierung und Gleichstandsränge bleiben erhalten; Nutzer- und Gaststimmen zählen gemeinsam.
- [x] Aktionsziele mindestens 44 × 44 px, keine Hover-Pflicht und keine horizontal versteckten Aktionen.
- [x] Browservergleich bei 390/1440 px, Hell-/Dunkelmodus, 0/1/10/30 Vorschlägen und 200 % Zoom; bei 200 % kein horizontaler Überlauf.

**Abgeschlossen:** 31.10.2026, Version 0.50.28. Web umgesetzt. Native iOS-Oberflächen separat zu planen.

## FEAT-004 – Voting-Vorschläge löschen

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Status:** Implementiert und geprüft für die Web-App; VoiceOver manuell noch nicht geprüft.
**Umsetzungsfreigabe:** Erteilt durch „implementiere FEAT-011“.

**Ziel:** Nicht mehr gewünschte Einträge aus einer Abstimmung entfernen können.

**Anforderung:** Einträge der Voting-Vorschlagsliste sollen löschbar sein.
Gemeint ist der Vorschlag im Voting, nicht das Spiel in der Sammlung.

**Abnahmekriterien für die spätere Umsetzung:**

- Berechtigte Nutzer können einen Vorschlag über eine erkennbare Aktion entfernen.
- Wer löschen darf und in welchen Voting-Zuständen, vorab im Plan festlegen.
- Folgen für vorhandene Stimmen, Gewinner und ausgewählte Spiele vor Umsetzung klären.
- Versehentliches Löschen durch passende Bestätigung oder Wiederherstellung abfangen;
  konkrete Lösung im Plan festlegen.
- Berechtigungen serverseitig prüfen; unberechtigte Zugriffe und die Behandlung
  vorhandener Stimmen durch Regressionstests absichern.

## FEAT-005 – ApiLog-Schreiblast für `/api/health` begrenzen

**Implementierungsplan:** [FEAT-005](superpowers/plans/2026-10-31-FEAT-005-health-apilog.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Erteilt am 01.11.2026 durch „implementiere FEAT-011“; Web-Implementierung abgeschlossen.
**Planentscheidung:** Vollständiger Ausschluss statt Stichprobe; normale API-Logs und historische Rohlogs erhalten.
**Bugbezug:** Loganteil von BUG-056; spätere DB-Leselastkorrektur in FEAT-006.

**Ziel:** Verhindern, dass Hochlast oder gezielte Anfragen auf den Health-Endpoint
die Datenbank mit Log-Schreibzugriffen fluten. Bislang schreibt jede Anfrage einen
Eintrag in die ApiLog-Tabelle.

**Anforderung:** Anfragen an `/api/health` werden nicht oder nur stichprobenartig
in die ApiLog-Tabelle geschrieben. Ob ein vollständiges Ausschließen oder eine
Stichprobe gewählt wird, legt der Implementierungsplan fest.

**Abnahmekriterien für die spätere Umsetzung:**

- ApiLog-Einträge für `/api/health` sind ausgeschlossen oder deutlich reduziert.
- Die Monitoring-Auswertungen (Qualität, Anomalien, Logs) bleiben funktionsfähig;
  der Verlust der Health-Historie in ApiLog ist bewertet und dokumentiert.
- Antwortzeit und Antwortinhalt des Health-Endpoints ändern sich nicht.
- Verhalten durch Regressionstest abgesichert.

## FEAT-006 – Health-Deep-Checks cachen oder splitten

**Implementierungsplan:** [FEAT-006](superpowers/plans/2026-10-31-FEAT-006-health-liveness-readiness.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Codeumfang am 01.11.2026 mit „dann weiter mit B“ freigegeben; Betrieb/Rollout separat offen.
**Planentscheidung:** Öffentliche DB-freie Liveness und geschützte DB-Readiness, einschließlich Monitorumstellung. FEAT-005 wiederverwenden.
**Bugbezug:** BUG-055 und verbleibende DB-/Auth-Nebenpfade aus BUG-056.

**Ziel:** Wiederholte Anfragen auf den Health-Endpoint dürfen die Datenbank nicht
skalierend belasten; Erschöpfung des Verbindungspools und Beeinträchtigung echter
Nutzeranfragen vermeiden.

**Anforderung:** Die datenbankbasierten Prüfungen des Health-Endpoints werden
entweder für kurze Zeit (beispielsweise 30–60 Sekunden) im vorhandenen
Upstash-Redis zwischengespeichert, oder der Endpoint wird in einen leichten
Liveness-Check ohne Datenbankzugriff und einen geschützten Deep-Readiness-Check
aufgeteilt. Die passende Variante und alle Details legt der Implementierungsplan
fest.

**Abnahmekriterien für die spätere Umsetzung:**

- Unter Last führt eine Anfrageflut zu höchstens einem Datenbank-Prüfsatz pro
  Cache-Fenster beziehungsweise zu keiner Datenbanklast auf dem Liveness-Check.
- Der Prüfstatus bleibt korrekt: echte DB-Ausfälle führen im Readinesscheck zu 503;
  Prozess-Liveness und Datenbankbereitschaft sind getrennt benannt, Erholung wird zeitnah sichtbar.
- Bei Wahl der Cachevariante Cacheausfall, begrenzten Direktprüfungs-Fallback,
  Zeitfenster, Invalidierung und Überwachung festlegen. Die vorgeschlagene
  Splitvariante benötigt keinen Redis-Statuscache.

## FEAT-007 – Vercel-Firewall-Regel für `/api/health`

**Implementierungsplan:** [FEAT-007](superpowers/plans/2026-10-31-FEAT-007-health-firewall.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Ausstehend; tatsächlichen Tarif, Monitorverkehr und bestehenden Regelstand vor Veröffentlichung prüfen.
**Planentscheidung:** Exakte Health-Regel, zunächst Log, dann 429; Attack Mode als gesonderter Incident-Schritt.

**Ziel:** Plattformseitige Drossel unabhängig von den anwendungsseitigen
Rate-Limits; dokumentiertes Vorgehen im Angriffsfall.

**Anforderung:** Im Vercel-Firewall eine Rate-Limit-Regel für `/api/health`
hinterlegen. Für den Angriffsfall ist das Vorgehen zum Aktivieren des Attack
Challenge Mode dokumentiert. Uptime-Monitore dürfen durch die Regel nicht
gedrosselt werden (Grenzwerte entsprechend wählen oder IP-Bereiche der
Monitor-Dienste berücksichtigen).

**Abnahmekriterien für die spätere Umsetzung:**

- Firewall-Regel ist aktiv und greift nur auf `/api/health`.
- Legitime Monitor-Abfragen bleiben ungedrosselt (Nachweis über Testzeitraum).
- Angriffsfall-Vorgehen (Attack Challenge Mode, weitere Notfallmaßnahmen) ist
  Schritt für Schritt dokumentiert.

## FEAT-008 – Spend-Management-Obergrenze

**Implementierungsplan:** [FEAT-008](superpowers/plans/2026-10-31-FEAT-008-spend-management.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Ausstehend; konkreter Betrag, Empfänger und teamweite Betriebswirkung müssen vor Aktivierung bestätigt sein.
**Plattformgrenze:** Vercel-Budget ist kein garantierter harter Rechnungsdeckel; Tarif, zeitversetzte Durchsetzung und weiterlaufende Kosten berücksichtigen.

**Ziel:** Kostenbegrenzung bei Traffic-Spitzen oder Angriffen; Serverless-Funktionsaufrufe
werden abgerechnet, eine Angriffsflut verursacht also Kosten.

**Anforderung:** In Vercel ein Ausgabenlimit (Spend Management) konfigurieren,
inklusive Benachrichtigung vor Erreichen des Limits. Das Verhalten bei erreichtem
Limit (Drosselung beziehungsweise Abschaltung) bewerten und dokumentieren.

**Abnahmekriterien für die spätere Umsetzung:**

- Ausgabenlimit ist aktiv; Warn-Schwellwert und Benachrichtigung sind eingerichtet.
- Verhalten bei erreichtem Limit ist bekannt und für den Betrieb akzeptiert.
- Regelmäßige Prüfung des Limits bei Wachstum ist im Betrieb verankert.

## FEAT-009 – HTML-Entities in Spieldaten korrekt behandeln

**Implementierungsplan:** [FEAT-009](superpowers/plans/2026-10-31-FEAT-009-spieldaten-entities.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Ausstehend; ein Produktions-Bereinigungslauf benötigt zusätzlich ein geprüftes konkretes Manifest und Backup.
**Plattformumfang:** Gemeinsame Backend-/Import-/Mobile-Ausgabe und Webdarstellung; iOS-Sync-Verträge prüfen, keine zusätzliche native Dekodierungslogik.
**Bugbezug:** BUG-049; Datenherkunft einzelner Produktionswerte erst durch einen lesenden Bericht prüfen.

**Ziel:** Spieldaten werden überall so angezeigt, wie sie gemeint sind — `&`,
`<`, `>`, Anführungszeichen und Apostrophe erscheinen als Zeichen, nicht als
Entities. Beispiel aus dem Bestand: „Horrified: Dungeons &amp; Dragons" muss
als „Horrified: Dungeons & Dragons" erscheinen.

**Anforderung:** HTML-Entities in aus BGG importierten und manuell erfassten
Spieldaten (Name, Beschreibung) werden in einem idempotenten Normalisierungsschritt
bis zum stabilen Klartext dekodiert. Import und Ausgabe verwenden denselben
Vertrag; wiederholte Verarbeitung ändert bereits normalisierte Werte nicht. Bereits vorhandene Teilfunktionen sind im Plan
auf Relevanz und Lücken zu prüfen: die Entity-Dekodierung in `bgg-xml.ts` und
das Bereinigungsskript `scripts/fix-html-entities.ts`. Die Ursache für
verbliebene Entities ist im Plan zu klären (Doppel-Escaping, weitere
Importpfade wie BGG-Suche, Sammlungs-Import, EAN-Import). Ein Bereinigungslauf
über den vorhandenen Datenbestand ist im Plan einzupreisen.

**Abnahmekriterien für die spätere Umsetzung:**

- Spielnamen und Beschreibungen mit Sonderzeichen werden korrekt angezeigt
  (`&` statt `&amp;`) — im Web wie in der mobilen API.
- Entities werden genau einmal dekodiert: mehrfach kodierte Werte
  (`&amp;amp;`) werden vollständig aufgelöst, echte Sonderzeichen im Namen
  bleiben erhalten.
- Alle Importpfade (Suche, Sammlungs-Import, Details, EAN) liefern konsistent
  dekodierte Werte; eine erneute BGG-Synchronisation erzeugt keine neuen
  Entities.
- Der vorhandene Datenbestand ist bereinigt; der Bereinigungslauf ist
  idempotent.
- Suche und Filter funktionieren mit Sonderzeichen im Namen.
- Sichere Klartextverarbeitung beim Speichern und Lesen; Ausgabe ausschließlich
  als Text, kein Einfügen von rohem HTML.
- Regressionstests für Import und Anzeige mit Entities im Namen.

## FEAT-010 – Event-Status und Ergebnis eindeutig darstellen

**Implementierungsplan:** [FEAT-010](superpowers/plans/2026-10-31-FEAT-010-eventstatus-ergebnis.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Erteilt und Web-Implementierung am 31.10.2026 abgenommen; native iOS-Oberfläche separat zu planen.
**Plattformumfang:** Web zuerst, iOS-Oberflächen separat; serverseitige Zustandsregeln gelten auch für Mobile-APIs.
**Bugbezug:** BUG-037 sowie neu erfasste eventübergreifende Schreibmöglichkeiten BUG-048.

**Ziel:** Gäste erkennen auf einen Blick den tatsächlichen Planungsstand, ohne
falsche Erwartungen zu übernehmen — etwa eine Stimmabgabe auf ein bereits
abgeschlossenes Event.

**Anforderung:** Der echte Event-Status (offen, geschlossen, abgesagt,
vergangen) wird ausgewertet und im Kopf dargestellt; endgültiger Termin und
endgültiges Spiel stehen oben und stimmen mit dem Kopftermin überein.
Zulässige Aktionen werden je Zustand festgelegt; eine geschlossene Auswahl ist
im Frontend nicht mehr bedienbar. Serverseitige Regeln sind gesondert zu
prüfen, damit kein Backend-Bypass möglich bleibt. Quelle: Impeccable-Prüfung
vom 30.10.2026, Priorität 1 (BUG-037); page.tsx:31,54,68;
public-event-client.tsx:41,293; date-voting-section.tsx:146.

**Abnahmekriterien für die spätere Umsetzung:**

- Geschlossene und vergangene Events zeigen ihren Zustand eindeutig; „Aktiv"
  erscheint nur bei tatsächlich offenen Events.
- Endgültiger Termin und endgültiges Spiel sind am Seitenanfang sichtbar und
  stimmen mit dem Kopftermin überein.
- Nicht zulässige Aktionen (Stimmen, Terminwahl, Gastbeitritt) sind je Zustand
  deaktiviert oder ausgeblendet — auch für Gäste.
- Vergangene Events bieten keinen Gastbeitritt mehr an.
- Serverseitig werden unzulässige Aktionen abgewiesen; Regressionstest sichert
  dies ab (Prüfung mit echten Zuständen, nicht nur synthetischen Antworten).

## FEAT-011 – Mobile und assistive Bedienung der Terminabstimmung

**Implementierungsplan:** [FEAT-011](superpowers/plans/2026-10-31-FEAT-011-terminabstimmung-barrierefrei.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Erteilt am 01.11.2026 durch „implementiere FEAT-011“; Web-Implementierung abgeschlossen.
**Plattformumfang:** Öffentliche und geschützte Web-Terminabstimmung; native iOS-Oberflächen separat.
**Abhängigkeit:** Gemeinsame Zustandsregeln und Serverabsicherung aus FEAT-010.

**Status der Abnahme:** Automatisierte Web-Abnahme abgeschlossen: 10 Termine, 50 Gäste, Tastaturantwort mit persistierter Datenbankänderung, mindestens 44 × 44 px große Antwortziele, kein Seitenüberlauf bei 195/320/390/640/768/1440 px sowie gerenderte Kontrastmessung in beiden Themes (Minimum 5,11:1). Bei 98 px wurde die Terminfläche separat geprüft; andere Seitenbereiche können dort weiterhin überlaufen. Manuelle VoiceOver-Abnahme bleibt offen; BUG-038 bleibt deshalb in Bearbeitung. BUG-039 ist in Version 0.50.37 behoben. iOS ist separat.

**Ergebnis:** Öffentliche und geschützte Terminabstimmungen verwenden gemeinsame, beschriftete Radiogruppen. Antworten bleiben während des Speicherns im DOM; gespeicherte Auswahl, Fehler und gesperrte Zustände werden textlich vermittelt. Teilnehmerdetails sind aufklappbar, die Desktopmatrix ist eine beschriftete Leseansicht. Tastatur- und schmale Viewport-Abläufe sind getestet.

**Anforderung:** Die interne Termintabelle erfordert bei 390 Pixeln 81–88
Pixel Seitenscrollen; „Nein" ist zunächst verborgen. Antwortbuttons messen
32×32 Pixel, weitere Hauptbuttons und Eingaben 36 Pixel Höhe statt der
Projektvorgabe 44 Pixel. Ausgewählte Antworten tragen keine explizite
Auswahlsemantik. Text-/Flächenpaare unterschreiten 4,5:1 (Begrüßung 3,8:1,
Zusagezahlen 2,3:1, gewählter Termin 3,9:1; dunkel: Abgesagt 3,3:1,
Zusagezahlen 3,2:1). Quelle: Impeccable-Prüfung vom 30.10.2026, Priorität 2
(BUG-038, BUG-039); date-voting-section.tsx:143,197,224-246;
guest-registration-panel.tsx:90.

**Abnahmekriterien für die spätere Umsetzung:**

- Mobile Datumseinträge zeigen alle Antwortoptionen vollständig sichtbar,
  ohne horizontales Scrollen.
- Antwort- und Hauptbedienelemente erfüllen die Projektvorgabe von 44 Pixeln;
  WCAG-2.2-Abstände sind geprüft (32-Pixel-Kontrollelemente sind nicht
  automatisch Verstöße gegen das 24-Pixel-Kriterium).
- Das gewählte Votum ist semantisch als ausgewählt ausgezeichnet (Screenreader,
  Fokus, Tastaturbedienung).
- Alle Text-/Flächenpaare erreichen 4,5:1 in hell und dunkel, belegt durch
  gerenderte Farben.
- Prüfung mit Impeccable (`adapt`, `audit`) und Screenreader-Nutzung bestanden.

## FEAT-012 – Teilnahme vor passive Listen rücken

**Implementierungsplan:** [FEAT-012](superpowers/plans/2026-10-31-FEAT-012-oeffentliche-teilnahme.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Erteilt durch „implementiere FEAT-012 und FEAT-013“ am 01.11.2026.
**Plattformumfang:** Öffentliche Web-Eventseite; native iOS-Oberflächen separat.
**Abhängigkeiten:** Status/Termin aus FEAT-010, Terminbedienung aus FEAT-011 und gemeinsame Identitätsregeln aus FEAT-013 bei Integration zusammenführen.

**Ziel:** Der Einstieg — Termin und Ort mit unmittelbarem Gastbeitritt — liegt
unmittelbar sichtbar; lange passive Listenstrecken unterbrechen die persönliche
Einladung nicht mehr.

**Anforderung:** Bei 390×900 liegt der Beitrittsbutton bei y≈1172, die
Spielauswahl bei y≈1463; davor liegen Teilnehmendenliste, Teilnahmeerklärung
und erneut Gästeinformationen. Das beabsichtigte Desktop-Zweispaltenraster ist
unwirksam. Datum und Ort werden mit dem Gastbeitritt verbunden; Gäste werden
nur einmal dargestellt; nach dem Beitritt laufen server- und clientseitige
Gästelisten auseinander (veraltete Duplikate). Quelle: Impeccable-Prüfung vom
30.10.2026, Priorität 3 (BUG-041, BUG-042); page.tsx:75,175;
guest-registration-panel.tsx:123.

**Abnahmekriterien für die spätere Umsetzung:**

- Gastbeitritt und Spielauswahl sind bei 390×900 ohne langes Scrollen
  erreichbar; der Weg zur Teilnahme ist deutlich verkürzt.
- Gäste erscheinen genau einmal; server- und clientseitige Gästelisten bleiben
  konsistent, keine veralteten Duplikate nach dem Beitritt.
- Teilnehmenden- und Einladungslisten folgen nach der Teilnahmeaktion.
- Das Desktop-Zweispaltenraster ist wirksam umgesetzt oder durch eine
  begründete Alternative ersetzt.
- Eine kompakte Übersicht der eigenen Auswahl am Seitenende ist geprüft.

**Umsetzungsstand 01.11.2026:** Weboberfläche, einheitliche Teilnehmerquelle, gezählter Beitritts-DTO, Sprunglinks, persönliche Auswahl und responsives Desktopraster umgesetzt. 390/1440-Pixel-Viewport-, Theme- und Browser-E2E-Abnahme bleibt offen; BUG-041/042 bleiben bis dahin in Bearbeitung.

## FEAT-013 – Aktive Identität verständlich machen

**Implementierungsplan:** [FEAT-013](superpowers/plans/2026-10-31-FEAT-013-aktive-identitaet.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Erteilt durch „implementiere FEAT-012 und FEAT-013“ am 01.11.2026.
**Bestätigte Produktentscheidung:** Am 31.10.2026 „Klare Identität ohne Gastwechsel“ gewählt. Keine Übertragung oder Zusammenführung von Stimmen und keine neue Gastwechsel-/Wiederaufnahmefunktion.
**Plattformumfang:** Web zuerst; bestehende API-Verträge erhalten, native Oberflächen separat.
**Bugbezug:** Doppelte Autorenrelation BUG-054 im Umfang; fehlender Gastbesitznachweis BUG-053 bleibt ein eigenständiger offener Sicherheitsbefund.

**Ziel:** Jede Person erkennt, als wer sie gerade handelt — angemeldet oder
Gast — und welche Aktion welcher Identität zugeordnet ist.

**Anforderung:** Angemeldete Personen sehen derzeit sowohl User-Voting als
auch Gastregistrierung beziehungsweise Gastmodus; wiederkehrende Gäste können
ihre Identität nicht sichtbar wechseln. Die aktive Identität wird eindeutig
angezeigt; Aktionen werden kontextgerecht benannt („Abstimmen" statt „User
voten", „Votes", „Gastmodus" — siehe auch Befund zur Sprache). Der Bedarf für
einen sichtbaren Gastwechsel wurde am 31.10.2026 entschieden: zunächst klare
Identität ohne Gastwechsel. Quelle:
Impeccable-Prüfung vom 30.10.2026, Priorität 4;
public-event-client.tsx:182,269,291; guest-registration-panel.tsx:78,88.

**Abnahmekriterien für die spätere Umsetzung:**

- Die aktive Identität (angemeldet beziehungsweise Gast mit Spitzname) ist
  sichtbar dargestellt.
- Aktionen sind kontextgerecht benannt; technische Begriffe sind im
  Zielpublikum verständlich formuliert.
- Der bestätigte Umfang ohne Gastwechsel wird eingehalten; bestehende Stimmen
  werden beim Anmelden weder übertragen noch gelöscht.
- Angemeldete Personen sehen keinen doppelten Beitragsweg.

**Umsetzungsstand 01.11.2026:** Gemeinsamer Actor für Konto, eventgebundenen Gast, Beobachter und Hydration; Sitzungsname datensparsam serialisiert; konto- und gastgebundene Aktionen zeigen je eine Identität. BGG-Autorenrelation wird serverseitig exklusiv zugeordnet (BUG-054 behoben). Kein Gastwechsel oder Besitznachweis ergänzt; BUG-053 bleibt offen. Browser-/Viewport-Abnahme ausstehend.

## FEAT-014 – Suchzustände und Beschriftung der BGG-Suche

**Implementierungsplan:** [FEAT-014](superpowers/plans/2026-10-31-FEAT-014-bgg-suchzustaende.md), erstellt am 31.10.2026.
**Umsetzungsfreigabe:** Erteilt am 01.11.2026; Web-Implementierung abgeschlossen, ergänzende Browser-E2E-Abnahme offen.
**Plattformumfang:** Öffentliche Websuche mit tokengebundener API; allgemeine BGG-Routen bleiben geschützt.
**Bugbezug:** BUG-040/043 und neu erkannter fehlender Gastzugriff BUG-052.

**Ziel:** Die BGG-Suche kommuniziert jeden Zustand klar — ungesucht, ladend,
Ergebnis, leer, Fehler — und ist dauerhaft beschriftet.

**Anforderung:** Bereits zwei eingegebene Zeichen erzeugen „Keine Ergebnisse
gefunden" vor dem ersten Suchlauf; das Suchfeld hat nur einen Platzhalter ohne
dauerhaft sichtbares Label. Quelle: Impeccable-Prüfung vom 30.10.2026,
Priorität 5 (BUG-040, BUG-043); bgg-game-search.tsx:167,335-337.

**Umsetzung:** Öffentliche tokengebundene GET-Route mit begrenztem BGG-Transport,
strikter XML-Fehlerbehandlung und getrennten Such-/Detailzuständen. Suche ist
ohne Anmeldung möglich; Vorschläge verwenden weiterhin die vorhandene Event-
Capability und erfordern eine aktive Identität. Gezielte API-, Service-, Hook-
und UI-Tests sowie vorhandene BGG-Parser-/Transporttests bestanden. BUG-040/043/052
und die bei der Eingabeprüfung entdeckte BUG-059 sind behoben. Browser-E2E gegen
eine isolierte Datenbank bleibt ergänzende Abnahme; keine produktiven BGG-Anfragen
ausgeführt.

**Abnahmekriterien für die spätere Umsetzung:**

- Vor dem ersten Suchlauf erscheint keine Leere-Meldung; ungesucht, ladend,
  Ergebnis, leer und Fehler sind unterscheidbar.
- Das Suchfeld trägt ein dauerhaft sichtbares Label, nicht nur einen
  Platzhalter.
- Fehlerzustände sind verständlich formuliert und können wiederholt werden.
- Regressionstests sichern die Zustandswechsel ab.

## FEAT-015 – Top-3-Spiele im Event-Kurzüberblick

**Status:** Web-Dashboard umgesetzt; manuelle Browser-Viewportabnahme offen.
**Plattformumfang:** Dashboard der Web-App; native iOS-Oberfläche bleibt
separat zu planen.
**Umsetzungsplan:** [Dashboard Top drei](superpowers/plans/2026-11-02-FEAT-015-dashboard-top-three.md).
**Umsetzungsfreigabe:** Am 02.11.2026 durch „dann implementiere FEAT-015“ erteilt.
**Gestaltungsprüfung:** Impeccable empfiehlt kompakte Ranglistenzeilen mit
kleinem Vorschaubild, Spieltitel und Gesamtstimmenzahl als sichere
Standarddarstellung. Die Umsetzung verwendet diese Zeilen auf allen Breiten;
eine Dreier-Kachelanordnung würde auf schmalen Karten Bild, Titel und Stimmen
zu stark einengen. Der vorherige gerenderte Browservergleich war mangels
verfügbarem Browserhost nicht möglich; eine manuelle Prüfung bei 390 px und
200-%-Zoom bleibt offen.

**Ziel:** Im Bereich „Was kommt auf den Tisch?“ erkennen Teilnehmende auf einen
Blick die drei beliebtesten Spielvorschläge des nächsten Spieleabends.

**Anforderung:** In der Kurzübersicht sollen höchstens die drei Vorschläge mit
den meisten Stimmen stehen und jeweils ein kleines Spielbild erhalten. Die
responsive Zeilenliste ist die Impeccable-Empfehlung und wurde für alle
Kartenbreiten gewählt. Stimmen müssen der bestehenden Voting-Semantik folgen,
einschließlich Konto- und Gaststimmen. Als Bildquelle sind das gespeicherte
Spielbild und bei BGG-Vorschlägen das vorhandene BGG-Bild zu berücksichtigen.

**Umsetzung:** Konto- und Gaststimmen werden summiert. Bei Gleichstand kommt
der ältere Vorschlag zuerst, danach entscheidet die Vorschlags-ID stabil.
Vorschläge aus der Sammlung verwenden das gespeicherte Cover, BGG-Vorschläge
das BGG-Bild. Ohne Bild zeigt die Zeile ein Würfelsymbol. Ein festgelegtes
Spiel blendet den Vorschlagsblock wie bisher aus; geschlossenes Voting ohne
festgelegtes Spiel zeigt weiterhin die Top drei. Für die Rangfolge lädt die
Abfrage Stimmenzahlen aller Vorschläge des hervorgehobenen Events; Namen, Dauer
und Bilder liest sie anschließend nur für die Top drei.

**Abnahmekriterien:**

- Bei offener Spielauswahl erscheinen höchstens die drei Vorschläge mit der
  höchsten Gesamtstimmenzahl, einschließlich Gaststimmen, in stabiler Ordnung.
- Jeder Eintrag zeigt ein kleines Bild oder einen passenden zugänglichen
  Ersatz, Rang, Spielname und Stimmenzahl.
- Die Zeilenliste ist für schmale Ansichten ausgelegt; der manuelle Nachweis bei
  390 px und 200-%-Zoom sowie besonders langen Titeln bleibt offen.
- Null bis zwei Vorschläge, Gleichstände, fehlende Bilder, geschlossene
  Abstimmung und bereits festgelegtes Spiel haben definierte Zustände.
- Für alle Vorschläge werden nur Stimmen-/Rangdaten geladen; Namen, Dauer und
  Bilder werden nur für die angezeigten Top drei abgerufen.
- Gezielte Tests für Stimmenaggregation, stabile Reihenfolge, Stimmenplural,
  Bild-Fallback, lange Titel und bereits festgelegtes Spiel bestanden.

**Prüfstand 02.11.2026:** Gezielte Unit-Tests bestanden (7/7), der
Impeccable-Detektor meldet keine statischen Findings, TypeScript- und
Lintprüfung bestanden. Browser-Viewportabnahme wurde nicht ausgeführt, da der
Browserhost nicht verfügbar war.

## FEAT-016 – Spielauswahl bei Session-Anlage per Eingabe filtern

**Status:** Web umgesetzt; manuelle Browser-/VoiceOver-Abnahme offen.
**Umsetzungsplan:** [Durchsuchbare Spielauswahl](superpowers/plans/2026-11-02-FEAT-016-session-spielsuche.md).
**Plattformumfang:** Webformular `/dashboard/sessions/new`; native iOS-Sessionanlage ist geprüft und bleibt separat zu planen.
**Umsetzungsfreigabe:** Web am 02.11.2026 durch „implementiere FEAT-016“ erteilt.
**Bestand vor Umsetzung:** Pflichtfeld „Spiel“ war ein Dropdown mit allen
Spielen aus der eigenen Sammlung, sortiert nach Namen. Das Mitspielerfeld
bleibt außerhalb dieses Features.

**Ziel:** Bei großen Sammlungen das gespielte Brettspiel schneller finden und
auswählen, ohne sich durch eine lange Optionsliste bewegen zu müssen.

**Umsetzung:** Ein Radix-Popover mit lokaler Suche und Listbox filtert Namen
der eigenen Sammlung. Groß-/Kleinschreibung, Umlaute, `ß`/`ss` und
HTML-Entities werden normalisiert; Ergebnisreihenfolge und gleichnamige Spiele
bleiben erhalten. Maus, Pfeiltasten, Enter, Escape und Tab sind unterstützt;
Trefferstatus, leere Sammlung, kein Treffer und Suchleeren sind beschriftet.
Das Formular sendet nur die gewählte ID und weist fehlende oder nicht mehr
verfügbare IDs vor dem Request ab. Serverabfrage, API, Mitspielerfeld und
serverseitige Besitz-/Soft-Deleteprüfung bleiben unverändert.

**Abnahmekriterien:**

- [x] Lokale Teilnamensuche filtert die eigenen Spiele sofort, ohne Trefferlimit.
- [x] Auswahl bleibt ID-gebunden; Freitext kann keine Session erstellen.
- [x] Keyboard- und Screenreaderbeziehungen, aktive Option, Status, Fehler und
  leere Zustände sind im Picker implementiert und automatisiert geprüft.
- [x] Suche leeren, Auswahlbeibehaltung, Escape und Tab-Fokusverhalten geprüft.
- [x] Leere Liste, 1.000 Optionen, Umlaute, Teilsuche, `ß`/`ss`, Entities und
  doppelte Namen mit Tests abgedeckt.
- [x] Bestehende Session-API-, Service- und Berechtigungsprüfung unverändert;
  gezielte API-/Service-Tests bestanden.
- [x] Impeccable-Detektor ohne Regex-Findings; Security-Check ohne Fehler.
- [ ] Gerenderte Abnahme für 390/1440 px, Hell/Dunkel, 200-%-Zoom und VoiceOver.

**Testergebnis:** 4 Filter-, 12 Picker-, 3 Formular- sowie bestehende
Session-CRUD-/Service-Tests bestanden (37 gesamt). TypeScript und gezieltes
ESLint bestanden. Der Browserhost war nicht erreichbar; die statische
Detektorprüfung lief nur mit Regexregeln. Die manuelle Browser-/VoiceOver-
Abnahme bleibt offen.

## FEAT-017 – Spielcover in der Sessions-Übersicht anzeigen

**Status:** Web umgesetzt; responsive Browser-/Viewportabnahme offen. Kleine Cover neben Titel und Datum umgesetzt; nicht unterstützte Bildquellen zeigen den dokumentierten Fallback.
**Umsetzungsplan:** [Cover in Sessionkarten](superpowers/plans/2026-11-02-FEAT-017-session-cover.md).
**Plattformumfang:** Web-Sessions-Liste `/dashboard/sessions`; iOS bei der
Planung separat auf bereits vorhandene Bilddarstellung prüfen.
**Umsetzungsfreigabe:** Web-Umsetzung am 02.11.2026 durch „starte implementierung für FEAT-017“ erteilt; iOS separat.
**Gestaltungsprüfung:** Impeccable-Kritik mit 21/40 Punkten. Der Detektor fand
0 statische Probleme. Live-Browserprüfung war
wegen des nicht verfügbaren Browserhosts nicht möglich.
**Bestand:** Die Sessions-Liste zeigte pro Eintrag ein identisches Würfelzeichen
statt eines Spielbilds. Die Detailansicht zeigt bereits ein Cover, wenn für das
Spiel ein `imageUrl` vorhanden ist.

**Umsetzung 02.11.2026:** Kleine, dekorative Cover neben Spielname und Datum;
defekte oder nicht unterstützte Bildquellen zeigen ein Würfelsymbol. Die Liste
prüft den Login vor dem Datenzugriff und lädt nur die benötigten Spielfelder.
Die responsive Browserabnahme bleibt offen.

**Ziel:** Spiele in der Historie anhand ihres Covers schneller wiedererkennen,
ohne Datum, Titel, Ergebnisse und Aktionen aus dem Blick zu verlieren.

**Abnahmekriterien für die spätere Umsetzung:**

- Jeder Sessions-Listeneintrag zeigt ein kleines Bild des zugehörigen Spiels,
  sofern ein Cover vorhanden ist.
- Fehlende oder ungültige Bild-URLs erzeugen einen ruhigen, verständlichen
  Fallback, keinen leeren Bildrahmen oder defekte Bildanzeige.
- Das Cover ergänzt den Spielnamen; der alternative Text vermeidet doppelte
  Ansagen, wenn derselbe Name direkt daneben steht.
- Unit-Tests prüfen Coverquellen, Fallback bei fehlendem/defektem Bild,
  wiederholte Sessions, Login-Guard, Links und leere Liste; `jest-axe` ist grün.
- Responsive Breiten, lange Spielnamen, 200-%-Zoom und Dark Mode sind wegen des
  nicht verfügbaren Browserhosts noch nicht gerendert abgenommen.
- Bilddimensionen und Ladeverhalten vermeiden unnötige Layoutverschiebung und
  übermäßigen Bilddownload in der Liste.
- Datenabfrage lädt nur die für Listenkarte und aktuelles Verhalten benötigten
  Spieldaten; API, Datenmodell und Berechtigungen ändern sich nur bei separat
  begründeter Notwendigkeit.
- Statische Impeccable-Prüfung meldet 0 Regex-Findings; Security-Check und
  Produktionsaudit (0 Vulnerabilities) sind ausgeführt. Die Browserprüfung von
  Bildressourcen, `srcset`, Ladeverhalten und VoiceOver bleibt offen.

## FEAT-018 – Testabdeckung schrittweise auf 80 % erhöhen

**Status:** Plan überarbeitet; Umsetzung offen.
**Umsetzungsplan:** [Coverage-Ziel 80 %](superpowers/plans/2026-11-02-FEAT-018-coverage-80.md).
**Plattformumfang:** Vitest-erfasster Web-/Backend-Runtimecode; Browser-E2E und iOS-Verträge als separate Nachweise.
**Umsetzungsfreigabe:** Keine erteilt.

**Aktualitätsprüfung 02.11.2026:** Global sind bereits 22 % je Metrik
konfiguriert; `src/lib` verlangt 50 % Statements/Functions/Lines und 45 %
Branches. Die frühere Aussage über ein fehlendes globales Gate wurde korrigiert.
Die historischen Messwerte sind vor Umsetzung, insbesondere nach FEAT-016/017,
zu erneuern.

**Plan:** Vorhandene Gates zunächst auf 46/44/48/48 % global erhöhen, sofern der
frische Bericht dies trägt. Danach Testpakete nach Risiko bearbeiten und alle
vier Metriken stufenweise auf 55, 65, 72 und 80 % anheben. Quelleninventar,
Messlücken, Charakterisierungstests und TDD für Fehlerkorrekturen sind im Plan
festgelegt. Neue eigene Session-Komponenten werden automatisch mitgemessen.
Kein Entfernen schlecht getesteter Runtime-Dateien aus dem Nenner.

**Abnahme:** 80 % aller vier globalen und Bibliotheksmetriken auf demselben
Commit, grüne Tests und CI-Gates, nachvollziehbarer Messumfang und aktuelle
Review-Dokumentation. Die Planung ändert keine Schwelle.

## Nachverfolgung

Je Feature werden Planpfad, offene Entscheidungen, Datum und Umfang der expliziten
Umsetzungsfreigabe, Prüfergebnisse und später die Release-Version ergänzt.
Zusammengehörige Features dürfen einen gemeinsamen Plan haben, behalten aber
ihre IDs und Abnahmekriterien.

## FEAT-020 – Kontrast öffentlicher Spielvorschläge

**Status:** Web umgesetzt; gerenderte Theme-/Viewportabnahme offen.
**Design-Spec:** [Lesbare Spielvorschläge auf der öffentlichen Eventseite](superpowers/specs/2026-11-02-public-event-proposal-contrast-design.md).
**Implementierungsplan:** [Kontrast der Spielvorschläge](superpowers/plans/2026-11-02-FEAT-020-public-event-proposal-contrast.md).
**Plattformumfang:** Öffentliche Web-Eventseite; iOS ist nicht betroffen.
**Umsetzungsfreigabe:** Web am 02.11.2026 durch „implementiere FEAT-020“ erteilt.

**Ziel:** BGG- und Sammlungstreffer sollen sich klar vom umgebenden
Suchbereich abheben und in Light/Dark Theme gut lesbar bleiben.

**Umsetzung 02.11.2026:** BGG- und Sammlungstreffer verwenden deckende
semantische Kartenfarben und eine sichtbare Border. Suche, Inhalt, Bilder und
Aktionen bleiben unverändert. Zwei Regressionstests und vier angrenzende
Public-Event-Tests bestehen. TypeScript, ESLint und Build bestanden. Die
statische Impeccable-Prüfung meldet 0 Regex-Findings; vollständige gerenderte
Theme-/Viewportprüfung blieb mangels Browserhost offen.
