# Feature-Backlog

Nummerierte Anforderungen für spätere Implementierungspläne und Umsetzungen.
Ein Eintrag ist keine Umsetzungsfreigabe. IDs werden fortlaufend vergeben und
nicht wiederverwendet. Verbindlicher Ablauf:
[Entwicklungsprozess](DEVELOPMENT-PROCESS.md#verbindlicher-feature-ablauf).

## Übersicht

| ID | Feature | Status | Implementierungsplan | Umsetzungsfreigabe |
|---|---|---|---|---|
| FEAT-001 | Spieldetails aus dem Voting öffnen | Umgesetzt (Web) | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Freigegeben und umgesetzt am 30.10.2026 |
| FEAT-002 | Voting-Vorschläge sortieren | Umgesetzt (Web) | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Freigegeben und umgesetzt am 30.10.2026 |
| FEAT-003 | Kompakte Voting-Liste | Umgesetzt (Web) | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Kompakte Zeilenliste nach sichtbarem Vergleich ausdrücklich gewählt und zur Umsetzung freigegeben am 31.10.2026 |
| FEAT-004 | Voting-Vorschläge löschen | Plan erstellt | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Ausstehend |
| FEAT-005 | ApiLog-Schreiblast für `/api/health` begrenzen | Erfasst | Ausstehend | Ausstehend |
| FEAT-006 | Health-Deep-Checks cachen oder splitten | Erfasst | Ausstehend | Ausstehend |
| FEAT-007 | Vercel-Firewall-Regel für `/api/health` | Erfasst | Ausstehend | Ausstehend |
| FEAT-008 | Spend-Management-Obergrenze (Billing-Schutz) | Erfasst | Ausstehend | Ausstehend |
| FEAT-009 | HTML-Entities in Spieldaten korrekt behandeln | Erfasst | Ausstehend | Ausstehend |
| FEAT-010 | Event-Status und Ergebnis eindeutig darstellen | Erfasst | Ausstehend | Ausstehend |
| FEAT-011 | Mobile und assistive Bedienung der Terminabstimmung | Erfasst | Ausstehend | Ausstehend |
| FEAT-012 | Teilnahme vor passive Listen rücken | Erfasst | Ausstehend | Ausstehend |
| FEAT-013 | Aktive Identität verständlich machen | Erfasst | Ausstehend | Ausstehend |
| FEAT-014 | Suchzustände und Beschriftung der BGG-Suche | Erfasst | Ausstehend | Ausstehend |

Am 30.10.2026 aufgenommen. Bei der Planung sind Web, iOS sowie angemeldete und
öffentliche Voting-Ansichten auf Relevanz und bereits vorhandene Teilfunktionen
zu prüfen. Der konkrete Plattformumfang wird im jeweiligen Plan festgelegt und
zur Umsetzung freigegeben.

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

**Abnahmekriterien für die spätere Umsetzung:**

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
**Umsetzungsfreigabe:** Ausstehend.

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
- Der Health-Status bleibt korrekt: echte Ausfälle führen weiterhin zu 503,
  Erholung wird zeitnah sichtbar.
- Ein Ausfall des Caches wird abgefangen (Fallback auf direkte Prüfung), ohne den
  Endpoint dauerhaft zu beeinträchtigen.
- Cache-Fenster, Invalidierung und Überwachung des Caches im Plan festlegen.

## FEAT-007 – Vercel-Firewall-Regel für `/api/health`

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

**Ziel:** Spieldaten werden überall so angezeigt, wie sie gemeint sind — `&`,
`<`, `>`, Anführungszeichen und Apostrophe erscheinen als Zeichen, nicht als
Entities. Beispiel aus dem Bestand: „Horrified: Dungeons &amp; Dragons" muss
als „Horrified: Dungeons & Dragons" erscheinen.

**Anforderung:** HTML-Entities in aus BGG importierten und manuell erfassten
Spieldaten (Name, Beschreibung) werden verlässlich genau einmal dekodiert —
beim Import und in der Anzeige. Bereits vorhandene Teilfunktionen sind im Plan
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
- Kein XSS-Risiko durch die Dekodierung: Dekodierung ausschließlich für die
  Anzeige, kein Einfügen von rohem HTML.
- Regressionstests für Import und Anzeige mit Entities im Namen.

## FEAT-010 – Event-Status und Ergebnis eindeutig darstellen

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

**Ziel:** Die Terminabstimmung ist auf kleinen Bildschirmen vollständig
sichtbar, mit ausreichend großen Bedienzielen, klarer Auswahlsemantik und
geprüften Kontrasten — hell wie dunkel.

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

## FEAT-013 – Aktive Identität verständlich machen

**Ziel:** Jede Person erkennt, als wer sie gerade handelt — angemeldet oder
Gast — und welche Aktion welcher Identität zugeordnet ist.

**Anforderung:** Angemeldete Personen sehen derzeit sowohl User-Voting als
auch Gastregistrierung beziehungsweise Gastmodus; wiederkehrende Gäste können
ihre Identität nicht sichtbar wechseln. Die aktive Identität wird eindeutig
angezeigt; Aktionen werden kontextgerecht benannt („Abstimmen" statt „User
voten", „Votes", „Gastmodus" — siehe auch Befund zur Sprache). Der tatsächliche
Bedarf für einen sichtbaren Gastwechsel ist zu klären. Quelle:
Impeccable-Prüfung vom 30.10.2026, Priorität 4;
public-event-client.tsx:182,269,291; guest-registration-panel.tsx:78,88.

**Abnahmekriterien für die spätere Umsetzung:**

- Die aktive Identität (angemeldet beziehungsweise Gast mit Spitzname) ist
  sichtbar dargestellt.
- Aktionen sind kontextgerecht benannt; technische Begriffe sind im
  Zielpublikum verständlich formuliert.
- Der Bedarf für einen Gastwechsel ist geklärt; falls ja, ist der Wechsel
  bedienbar und die Rückwirkung auf bestehende Stimmen ist im Plan geklärt.
- Angemeldete Personen sehen keinen doppelten Beitragsweg.

## FEAT-014 – Suchzustände und Beschriftung der BGG-Suche

**Ziel:** Die BGG-Suche kommuniziert jeden Zustand klar — ungesucht, ladend,
Ergebnis, leer, Fehler — und ist dauerhaft beschriftet.

**Anforderung:** Bereits zwei eingegebene Zeichen erzeugen „Keine Ergebnisse
gefunden" vor dem ersten Suchlauf; das Suchfeld hat nur einen Platzhalter ohne
dauerhaft sichtbares Label. Quelle: Impeccable-Prüfung vom 30.10.2026,
Priorität 5 (BUG-040, BUG-043); bgg-game-search.tsx:167,335-337.

**Abnahmekriterien für die spätere Umsetzung:**

- Vor dem ersten Suchlauf erscheint keine Leere-Meldung; ungesucht, ladend,
  Ergebnis, leer und Fehler sind unterscheidbar.
- Das Suchfeld trägt ein dauerhaft sichtbares Label, nicht nur einen
  Platzhalter.
- Fehlerzustände sind verständlich formuliert und können wiederholt werden.
- Regressionstests sichern die Zustandswechsel ab.

## Nachverfolgung

Je Feature werden Planpfad, offene Entscheidungen, Datum und Umfang der expliziten
Umsetzungsfreigabe, Prüfergebnisse und später die Release-Version ergänzt.
Zusammengehörige Features dürfen einen gemeinsamen Plan haben, behalten aber
ihre IDs und Abnahmekriterien.
