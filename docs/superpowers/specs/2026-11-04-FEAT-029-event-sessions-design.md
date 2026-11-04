# FEAT-029 – Gespielte Eventspiele direkt als Sessions erfassen

**Status:** Produktumfang am 04.11.2026 bestätigt. Keine Umsetzungsfreigabe.
**Stand:** 04.11.2026
**Produktgrundlage:** `PRODUCT.md`; Spieleabende verbinden Eventplanung und Spielhistorie.

## Ziel

Der Event-Ersteller kann im Event dokumentieren, welche vorgeschlagenen Spiele
tatsächlich gespielt wurden. Für jede gespielte Partie entsteht eine normale,
mit dem Event verknüpfte Session. Registrierte Mitspieler und namentliche Gäste,
Ergebnisdaten, Dauer und Notizen gehören zur Session und können über das Event
eingesehen werden.

## Bestätigte Produktentscheidungen

- Pro tatsächlich gespielter Partie wird eine eigene Session erfasst.
- Eventteilnehmer werden zur Erfassung vorausgewählt und können angepasst werden.
- Mitspieler, Dauer, Gewinner, Platzierungen, Punkte und Notizen können in der
  Session festgehalten werden.
- Eingeladene Personen ohne Konto können namentlich als Session-Gäste erfasst
  werden.
- BGG-Vorschläge ohne Sammlungsspiel können als Session erfasst werden, ohne
  dauerhaft in eine Sammlung importiert zu werden.
- Nur der Ersteller des Events darf die Session aus dem Event anlegen und
  nachträglich ändern.
- Angemeldete Personen, die nach den bestehenden Webregeln auf das interne
  Event zugreifen dürfen (Ersteller und eingeladene Nutzer), sehen gespielte
  Partien und vollständige Sessiondetails. Gruppenmitgliedschaft allein weitet
  die Webberechtigung dieses Features nicht aus.
- Personen mit öffentlichem Event-Link sehen nur, welche Spiele gespielt
  wurden. Mitspielernamen, Gastnamen, Ergebnisse, Punkte, Dauer und Notizen
  werden über den öffentlichen Link nicht ausgegeben.
- Ein Abstimmungssieger oder ausgewählter Vorschlag wird nicht automatisch als
  gespielt erfasst. Der Event-Ersteller markiert tatsächliche Partien bewusst.
- Web ist der erste Umsetzungsumfang. Native iOS-Oberflächen erhalten einen
  separaten Plan; mobile API-Verträge werden auf Kompatibilität geprüft.

## Empfohlener Ablauf im Event

1. Im Eventdetail öffnet der Event-Ersteller den Bereich zur Dokumentation der
   gespielten Partien.
2. Er wählt ein Spiel aus den Eventvorschlägen und legt eine Partie an. Datum
   und Teilnehmer werden aus dem Event vorausgefüllt; er kann sie anpassen.
3. Er ergänzt optional Dauer, Notizen, Punkte, Gewinner und Platzierungen.
4. Das Spiel erscheint im Event als gespielt und die Session wird mit dem
   Event verbunden. Eine weitere Partie desselben Spiels kann ausdrücklich
   separat erfasst werden.
5. Bei einer Wiederholung derselben Anfrage darf keine unbeabsichtigte
   doppelte Session entstehen.

## Datenmodell und Zuständigkeiten

- `GameSession` bleibt die kanonische Quelle für die Partie, Ergebnisse und
  Sessionstatistik. Der Sammlungsspielbezug wird für Snapshot-Spiele optional.
- Ein Event-Partie-Link ist die eindeutige Verknüpfung zwischen Event,
  Event-Spielvorschlag und Session; an `GameSession` wird keine zweite direkte
  Event-ID gepflegt.
- Sammlungsspiele behalten ihren `gameId`-Bezug. Für BGG-only-Spiele speichert
  die Session einen eigenen Spiel-Snapshot (mindestens Name und BGG-ID,
  vorhandenes Bild und verfügbare Spielmetadaten). Ein Snapshot erzeugt keinen
  Sammlungseintrag.
- Der Event-Partie-Link verbindet die Session mit dem Event und dem
  zugehörigen Vorschlag. Er ermöglicht mehrere Partien desselben Spiels
  und schützt vor doppelten Schreibwiederholungen.
- Registrierte Mitspieler bleiben reguläre `SessionPlayer`-Einträge. Gäste
  werden als Session-Gastmitspieler mit Namens-Snapshot und optionalen
  Ergebniswerten gespeichert. Sie erhalten keine Nutzer-ID, kein Profil und
  keine Push-Benachrichtigung. Gastnamen werden nicht über mehrere Events
  hinweg automatisch zusammengeführt.
- Serverseitige Eventberechtigung ist für jedes Lesen und Schreiben erneut zu
  prüfen. Schreibvorgänge aus dem Event sind auf den Event-Ersteller begrenzt.
  Die Eventansicht für angemeldete Berechtigte darf Sessiondetails explizit
  laden; öffentliche Antworten verwenden eine getrennte Projektion nur der
  gespielten Spielnamen und des Spielstatus.
- Das Löschen oder Ändern einer Session muss ihren Spielstatus im Event
  konsistent aktualisieren. Das Löschen eines Events darf die gespeicherte
  Sessionhistorie nicht kaskadierend entfernen; höchstens der Event-Partie-Link
  wird gelöst.

## Sichtbarkeit und Datenschutz

- Sessiondetails über das interne Event folgen dem bestehenden Webzugriffsmodell
  aus Event-Ersteller und eingeladenen Nutzern. Nur angemeldete Personen mit diesem Zugriff
  erhalten Namen, Ergebnisse und Notizen.
- Der öffentliche Event-Link enthält ausschließlich die Kennzeichnung und den
  Namen der gespielten Spiele. Session- und Gastmitspielernamen, Punkte,
  Gewinner, Platzierungen, Dauer und Notizen bleiben dort verborgen.
- Das Erfassen eines Gastes speichert dessen Event-Nickname als
  Session-Snapshot für die Eventhistorie. Die Verarbeitung muss auf den
  Event-Ersteller und angemeldete Eventberechtigte begrenzt und bei Löschungen
  konsistent sein.
- Ein Session-Snapshot darf weder als Sammlungsspiel noch als BGG-Import in
  einer Nutzersammlung erscheinen.

## Fehler- und Korrekturverhalten

- Session und Event-Partie-Link werden atomar erstellt. Ein Fehler darf keinen
  Zustand hinterlassen, in dem das Event eine Partie als gespielt ausweist,
  obwohl keine Session existiert.
- Wiederholte Übermittlung derselben Erfassungsoperation erzeugt höchstens eine
  Session; eine bewusst neue Partie erhält eine neue Operation und bleibt
  zulässig.
- Der Event-Ersteller kann Sessionfelder korrigieren und die Verknüpfung im
  Event nachvollziehen. Verhalten beim Löschen oder Soft-Delete einer Session
  wird im Implementierungsplan mit den vorhandenen Sessionregeln abgestimmt.
- Eine ungültige, gelöschte oder nicht zum Event gehörende Spielvorschlags-ID
  wird serverseitig abgewiesen. Der öffentliche Link kann keine Sessions
  anlegen oder ändern.

## Abgrenzung

- Kein automatisches Erfassen aufgrund von Stimmen, Voting-Siegern oder
  Terminstatus.
- Kein dauerhafter BGG-Import oder automatischer Sammlungseintrag für ein
  Event-Snapshot-Spiel.
- Keine Erstellung oder Wiederverwendung von Nutzerkonten für Eventgäste.
- Keine native iOS-Oberfläche in dieser Spezifikation.

## Abnahmekriterien für den späteren Implementierungsplan

- Eine gespielte Partie erscheint genau einmal als Session und ist im Event
  wiederauffindbar; Wiederholungen desselben Spiels lassen sich bewusst
  erfassen.
- Teilnehmer aus dem Event sind vorausgewählt, können angepasst und mit
  sessionbezogenen Ergebnissen gespeichert werden.
- Registrierte und namentliche Gast-Mitspieler sind unterscheidbar; Gäste
  erhalten keine Nutzeridentität.
- Sammlungsspiele und BGG-only-Spiele erscheinen mit stabilen Sessiondetails in
  Sessionhistorie und Statistiken, ohne BGG-only-Spiele in Sammlungen
  einzutragen.
- Event-Ersteller ist die einzige Rolle, die Sessions aus dem Event anlegt,
  bearbeitet oder deren Verbindung verwaltet.
- Angemeldete Eventberechtigte sehen Sessiondetails im Event; öffentliche
  Eventlinks erhalten nur den gespielten Spielstatus und -namen.
- Korrektur und Löschung synchronisieren den Status im Event, ohne andere
  Sessions oder abgeschlossene Spielhistorie unbeabsichtigt zu löschen.
- API-Tests decken IDOR, fremde Vorschläge, Event- und Sessionsichtbarkeit,
  idempotente Wiederholung, Eventgäste, Soft-Delete und Snapshot-BGG-Spiele ab.
- Eine gerenderte Prüfung deckt Eventdetail und öffentliche Eventseite auf Desktop,
  Mobilansicht, Tastaturbedienung und Screenreader-Beschriftungen ab.

## Nächste Schritte

Der Implementierungsplan mit TDD-RED/GREEN/REFACTOR, Security- und
Impeccable-Prüfung liegt unter
`docs/superpowers/plans/2026-11-04-FEAT-029-event-sessions.md`. Die Umsetzung
beginnt erst nach ausdrücklicher Freigabe dieses konkreten Plans.
