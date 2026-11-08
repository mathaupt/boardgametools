# FEAT-019 – Konzept für Spracheingabe

**Status:** Konzept freigegeben am 02.11.2026; schriftliche Spezifikation zur Prüfung.  
**Plattform:** Web zuerst. Native iOS-Oberflächen separat planen.  
**Umsetzungsplan:** [Web-Spracheingabe und Betriebsabschluss](../plans/2026-11-08-FEAT-019-029-030-bugabschluss.md).
**Umsetzungsfreigabe:** Konkreter Webplan am 08.11.2026 durch „bitte umsetzen“ freigegeben.

## Ziel

Spracheingabe soll wiederkehrende Texteingaben in BoardGameTools beschleunigen,
ohne Nutzer:innen die Kontrolle über Suche, Session-Daten oder Speichervorgänge
zu nehmen. Diktat und gesprochene Befehle sind ausdrücklich getrennte
Funktionen mit unterschiedlichen Fähigkeiten und Datenschutzanforderungen.

## Ausgangskontext vom 02.11.2026

- Die Web-App verwendet Next.js App Router, React und TypeScript. Die
  Session-Anlage ist ein clientseitiges Formular mit vorhandenen Feldern und
  bestehendem API-Speicherweg.
- Die Spielsuche und Notizfelder benötigen normale Textwerte; für diese
  Aufgaben ist keine semantische KI-Verarbeitung erforderlich.
- Die globale Header-Konfiguration setzt derzeit
  `Permissions-Policy: camera=(self), microphone=(), geolocation=()`.
  Eine Web-Implementierung benötigt daher eine gezielte Änderung der
  Mikrofonrichtlinie, die sich auf die tatsächlich betroffenen Seiten
  beschränkt.
- Im Web- und iOS-Codebestand wurde keine vorhandene Spracheingabe gefunden.
  Für iOS ist native Speech-Erkennung gesondert zu planen.

## Betrachtete Ansätze

1. **Betriebssystem-Diktat:** Geringster App-Aufwand; Verfügbarkeit und
   Bedienung unterscheiden sich nach Plattform und Eingabemethode.
2. **In-App-Diktat:** Die App ergänzt vorhandene Textfelder um einen
   nutzergesteuerten Aufnahme- und Erkennungsablauf. Erkennungsunterstützung
   und Verarbeitung hängen vom Browser ab. Dieser Ansatz braucht keine KI für
   Suche oder Notizen.
3. **Sprachbefehl mit strukturierter Extraktion:** Eine natürliche Aussage
   wird zuerst in einen überprüfbaren Session-Entwurf übersetzt. Ein
   deterministischer Parser oder optional eine KI kann hierfür eingesetzt
   werden. Die KI darf keine Session direkt speichern.

**Empfehlung:** Diktat (Ansatz 2) und Session-Befehle (Ansatz 3) bilden zwei
getrennte Backlog-Teile. Das Web-Diktat hat Vorrang. Session-Befehle werden
später mit eigenem Plan und eigener Freigabe bewertet. Betriebssystem-Diktat
bleibt eine mögliche manuelle Fallback-Eingabe.

## Teil A: Diktat in Suche und Notizen

- Nutzer:innen starten die Erkennung aktiv über eine klar beschriftete
  Mikrofonaktion.
- Der erkannte Text wird in das jeweilige bestehende Textfeld übernommen und
  kann vor der Verwendung korrigiert werden.
- Spracheingabe löst weder eine Suche noch einen Speichervorgang ohne die
  übliche explizite Aktion aus.
- Bei fehlender Unterstützung, abgelehnter Berechtigung, Stille, Fehler oder
  Abbruch bleibt die manuelle Eingabe nutzbar und der Zustand wird verständlich
  angezeigt.
- Die Erkennung ist auf den passenden deutschen Sprachraum konfiguriert,
  soweit die gewählte Plattform dies unterstützt. Spieltitel bleiben normaler
  Text; besondere Wörterbuch- oder Biasing-Funktionen sind optional und erst
  nach einem nachgewiesenen Qualitätsproblem zu planen.

## Teil B: Gesprochene Befehle für Session-Entwürfe

- Eine Aussage wie „Azul mit Anna, 90 Minuten“ erzeugt einen Entwurf mit
  erkannten Feldern. Geplante Felder sind Spiel, Mitspielende, Dauer und – nur
  wenn ausdrücklich genannt – weitere bereits unterstützte Session-Felder.
- Identifikatoren dürfen nur über vorhandene, für die aktive Nutzeridentität
  verfügbare Sammlungs- und Kontodaten aufgelöst werden. Freie KI-Ausgabe darf
  keine IDs oder Berechtigungen festlegen.
- Nicht eindeutige Spiele oder Personen werden als ungeklärt markiert und
  müssen manuell ausgewählt werden. Fehlende Felder bleiben leer.
- Nutzer:innen prüfen und bestätigen den Entwurf. Erst danach wird der
  bestehende Session-Speicherweg verwendet.
- Abbruch verwirft den Entwurf. Wiederholungen oder Fehler erzeugen keine
  doppelten Sessions.

## Optionale KI und Datenschutz

KI ist für einfache Sprache-zu-Text-Eingabe nicht erforderlich. Bei der
späteren Bewertung von Session-Befehlen kann ein KI-Dienst optional den bereits
erkannten Text in ein strikt validiertes, begrenztes Entwurfsschema überführen.

- Kein Audio an einen LLM-Dienst senden; nur den Text übertragen, wenn dies
  nach Anbieterprüfung und transparenter Einwilligung freigegeben wird.
- Anbieter, Datenregion, Protokollierung und Aufbewahrungsfristen sind vor
  einem Implementierungsplan festzulegen. Keine Secrets im Client.
- Ausgabe gegen ein geschlossenes Schema prüfen; ungültige oder unbekannte
  Werte nicht stillschweigend übernehmen.
- Der KI-Dienst erhält keine Befugnis zum Speichern, Löschen, Abstimmen oder
  sonstigen direkten Ausführen von Aktionen.
- Rohes Audio wird weder in der App-Datenbank noch in Anwendungslogs dauerhaft
  gespeichert.

## Fehlerfälle und Berechtigungen

- Der Browser fordert Mikrofonzugriff erst nach einer Nutzeraktion an.
- Aufnahmebeginn, aktive Erkennung, Abschluss und Abbruch müssen sichtbar und
  assistiv erkennbar sein.
- Berechtigungsverweigerung und Browser ohne passende API führen ohne
  Blockierung zur Texteingabe zurück.
- Sicherheitsrichtlinien werden nur für erforderliche Routen gelockert;
  HTTPS, Authentifizierung und bestehende Session-Berechtigungen bleiben
  maßgeblich.
- Keine Audioaufnahme im Hintergrund und kein Beginn beim Laden der Seite.

## Abnahmekriterien und Testidee

1. **Erkennung und Rückfall:** Unterstützter, nicht unterstützter,
   verweigerter, abgebrochener und fehlerhafter Erkennungsablauf; Textfeld
   bleibt in allen Fällen bedienbar.
2. **Kontrolle:** Erkannter Text ist editierbar. Suche und Speichern benötigen
   weiterhin ihre bisherige explizite Aktion.
3. **Session-Zuordnung:** Eindeutige Spiele/Konten werden gegen verfügbare
   Daten aufgelöst; Mehrdeutigkeit, unbekannte Namen und ungültige KI-Ausgabe
   erzeugen keine falsche Zuordnung.
4. **Sicheres Speichern:** Vor Bestätigung kein API-Schreibzugriff; nach
   Bestätigung gelten unverändert Authentifizierung, Besitzprüfung,
   Validierung und vorhandene Duplikat-/Fehlerbehandlung.
5. **Datenschutz:** Keine dauerhafte Audiodatei, keine unbeabsichtigte
   Übertragung, klarer Hinweis falls ein externer Erkennungs- oder KI-Dienst
   Text verarbeitet.
6. **Bedienbarkeit:** Tastatur, Screenreader-Status, Fokusführung, Kontrast,
   Touch-Zielgröße, 200-%-Zoom und relevante mobile Breiten prüfen.
7. **Automatisierung:** Parser- und Zustandslogik mit Unit-Tests abdecken;
   UI-Zustände mit Komponenten-Tests; bestätigte Session-Erstellung nur mit
   isolierter Testdatenbank in einem schreibenden E2E-Test prüfen.

Tests gegen konkrete Browser-Spracherkennung sind zusätzlich als manuelle
Plattformabnahme zu führen, da API-Verfügbarkeit und tatsächliche Erkennung
vom Browser, Betriebssystem, Gerät und Netzwerk abhängen.

## Ausdrücklich außerhalb dieses Konzepts

- Native iOS-Mikrofonoberflächen und App-Store-Berechtigungstexte.
- Dauerhafte Audioaufzeichnung, Transkriptverlauf oder Audio-Upload.
- Sprachsteuerung für Löschen, Voting, Einladungen oder andere mutierende
  Aktionen außerhalb der bestätigten Session-Anlage.
- Festlegung eines konkreten KI-Anbieters oder einer konkreten
  Spracherkennungsbibliothek.
- Umsetzung oder Umsetzungsfreigabe.


## Umsetzungsstand 08.11.2026

Webcode für Diktat, explizite Textübernahme und lokale überprüfbare Session-Entwürfe in Version 0.50.95 umgesetzt. Die vorstehend beschriebene optionale KI wird nicht verwendet. Das unterstützte Sessionmuster ist bewusst auf Titel, vorhandene Kontonamen und ganzzahlige Minuten begrenzt. Einträge entstehen weiterhin erst über das bestehende Formular. Automatische Verträge und lokale Safari-Ansichten geprüft; reale Mikrofon-/Audioabnahme und VoiceOver-Ausgabe noch nicht bestätigt. Native iOS-Eingabe bleibt separat.
