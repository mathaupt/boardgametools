export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: FaqItem[];
}

export const faqSections: FaqSection[] = [
  {
    id: "getting-started",
    title: "Erste Schritte",
    icon: "rocket",
    description: "So startest du mit BoardGameTools.",
    items: [
      {
        question: "Wie erstelle ich ein Konto?",
        answer:
          'Klicke auf der Startseite auf "Registrieren". Gib deinen Namen, eine E-Mail-Adresse und ein Passwort ein (mindestens 8 Zeichen, maximal 128). Nach der Registrierung kannst du dich sofort anmelden und loslegen.',
      },
      {
        question: "Was kann ich mit BoardGameTools machen?",
        answer:
          "BoardGameTools hilft dir, deine Brettspielsammlung zu verwalten, Spieleabende zu organisieren, Abstimmungen durchzufuehren und Statistiken zu deinen Spielsessions zu fuehren. Du kannst Spiele aus BoardGameGeek importieren, Events mit Freunden planen, Gruppen fuer regelmaessige Spieleabende erstellen und Spielereihen (z.B. EXIT-Spiele) tracken.",
      },
      {
        question: "Ist BoardGameTools kostenlos?",
        answer:
          "Ja, BoardGameTools ist komplett kostenlos nutzbar. Alle Features stehen dir ohne Einschraenkungen zur Verfuegung.",
      },
      {
        question: "Was sehe ich auf dem Dashboard?",
        answer:
          "Das Dashboard zeigt dir eine Uebersicht deiner Aktivitaeten: Schnellzugriffe (Spiel hinzufuegen, BGG-Import, Session erstellen, Gruppe erstellen, Event planen), offene Einladungen, Statistik-Kacheln (Anzahl Spiele, Sessions, Gruppen, Events), deine naechsten Events und die letzten gespielten Sessions.",
      },
      {
        question: "In welcher Sprache ist die App?",
        answer:
          "Die gesamte Oberflaeche und alle Fehlermeldungen sind auf Deutsch. Die Spieldaten aus BoardGameGeek werden in der Originalsprache (meist Englisch) uebernommen.",
      },
    ],
  },
  {
    id: "games",
    title: "Spielesammlung",
    icon: "gamepad",
    description: "Spiele verwalten, importieren und organisieren.",
    items: [
      {
        question: "Wie fuege ich ein Spiel manuell hinzu?",
        answer:
          'Gehe zu "Spiele" und klicke auf "Neues Spiel". Du kannst den Namen, die Spieleranzahl (Min/Max), die Spieldauer, die Komplexitaet (1-5), ein Bild und optional eine BGG-ID angeben. Am schnellsten geht es ueber die BGG-Suche: Tippe den Namen ein und waehle das Spiel aus \u2013 alle Daten werden automatisch uebernommen.',
      },
      {
        question: "Wie importiere ich Spiele aus BoardGameGeek?",
        answer:
          'Unter "Spiele" \u2192 "Import" kannst du auf drei Arten importieren: (1) Nach Spielnamen suchen und einzeln importieren, (2) eine direkte BGG-ID eingeben, oder (3) deinen BGG-Benutzernamen eingeben um deine komplette Sammlung auf einmal zu importieren. Spieldaten wie Spieleranzahl, Dauer, Bilder, Kategorien und Mechaniken werden automatisch von BGG uebernommen.',
      },
      {
        question: "Kann ich Spiele per Barcode scannen?",
        answer:
          'Ja! Auf der Spiele-Uebersicht und beim Anlegen neuer Spiele findest du den Barcode-Scanner. Halte den Barcode (EAN/UPC) eines Spiels vor die Kamera \u2013 das Spiel wird automatisch erkannt und die Daten von BGG geladen. Alternativ kannst du auch ein Foto des Spielecovers machen \u2013 der Name wird per OCR (Texterkennung) erkannt und in BGG gesucht.',
      },
      {
        question: "Wie funktionieren Tags und Kategorien?",
        answer:
          'Jedes Spiel kann mit Tags versehen werden, z.B. "Familienspiel", "Strategiespiel" oder eigene Tags. Auf der Spiele-Uebersicht kannst du per Klick auf Tag-Chips filtern und so schnell bestimmte Spiele finden. Tags werden beim BGG-Import automatisch uebernommen.',
      },
      {
        question: "Kann ich mehrere Spiele gleichzeitig loeschen?",
        answer:
          'Ja, auf der Spiele-Uebersicht gibt es eine Mehrfachauswahl. Waehle die gewuenschten Spiele aus und klicke auf "Ausgewaehlte loeschen". Geloeschte Spiele werden per Soft-Delete markiert und koennen bei Bedarf wiederhergestellt werden.',
      },
      {
        question: "Was sind Spielereihen?",
        answer:
          'Unter "Reihen" kannst du zusammengehoerige Spiele gruppieren, z.B. alle EXIT-Spiele, Adventure Games oder Legacy-Kampagnen. Du kannst den Fortschritt tracken (X von Y gespielt), Bewertungen (1-5 Sterne) und Schwierigkeitsgrade vergeben, Spielzeit und Punkte erfassen und die Reihenfolge per Drag & Drop festlegen.',
      },
      {
        question: "Wie bewerte ich ein Spiel in einer Reihe?",
        answer:
          "Oeffne eine Spielereihe und klicke auf einen Eintrag. Du kannst eine Sternebewertung (1-5) vergeben, die Schwierigkeit einstufen (Einsteiger/Fortgeschritten/Profi), die Spieldauer, die Spieleranzahl, einen Score und ob das Spiel erfolgreich abgeschlossen wurde eintragen.",
      },
    ],
  },
  {
    id: "events",
    title: "Events & Spieleabende",
    icon: "calendar",
    description: "Spieleabende planen, abstimmen und organisieren.",
    items: [
      {
        question: "Wie erstelle ich einen Spieleabend?",
        answer:
          'Gehe zu "Events" und klicke auf "Neues Event". Gib einen Titel, Datum/Uhrzeit, Ort und optional eine Beschreibung ein. Du kannst direkt beim Erstellen E-Mail-Adressen eingeben, um Teilnehmer einzuladen.',
      },
      {
        question: "Wie funktioniert die Spieleabstimmung?",
        answer:
          "Jeder eingeladene Teilnehmer kann Spiele aus seiner eigenen Sammlung oder per BGG-Suche vorschlagen. Alle Teilnehmer stimmen dann ueber die vorgeschlagenen Spiele ab. Das Spiel mit den meisten Stimmen gewinnt. Du siehst in Echtzeit, wer fuer welches Spiel gestimmt hat. Als Organisator kannst du die Abstimmung schliessen und das Gewinnerspiel festlegen.",
      },
      {
        question: "Wie funktioniert die Terminabstimmung?",
        answer:
          'In der Event-Detailseite kannst du mehrere Terminvorschlaege hinzufuegen. Teilnehmer (und Gaeste) stimmen mit "Ja", "Vielleicht" oder "Nein" fuer jeden Termin ab \u2013 aehnlich wie bei Doodle. Du siehst eine Uebersichtsmatrix aller Antworten und kannst am Ende den besten Termin festlegen. Die Terminabstimmung kann bei Bedarf zurueckgesetzt werden.',
      },
      {
        question: "Kann ich Leute ohne Account einladen?",
        answer:
          'Ja, auf zwei Wegen: (1) Du kannst das Event per oeffentlichem Link teilen \u2013 ueber "Teilen" generierst du einen Link, den du per WhatsApp, E-Mail oder Messenger verschicken kannst. Gaeste koennen ohne Login mit einem Nickname teilnehmen, abstimmen und Spiele vorschlagen. (2) Du kannst externe Gaeste per E-Mail einladen \u2013 sie bekommen einen persoenlichen Einladungslink, ueber den sie zusagen oder ablehnen koennen.',
      },
      {
        question: "Wie verschicke ich Erinnerungen oder Nachrichten?",
        answer:
          'In der Event-Detailseite findest du die E-Mail-Funktion. Du kannst Erinnerungs-Mails an alle zugesagten Teilnehmer senden oder individuelle Nachrichten mit eigenem Betreff und Text an alle Teilnehmer verschicken. Die E-Mails werden im einheitlichen BoardGameTools-Design versendet.',
      },
      {
        question: "Kann ich ein Event in meinen Kalender exportieren?",
        answer:
          "Ja! Auf der Event-Detailseite findest du den Kalender-Export-Button. Er erstellt eine .ics-Datei mit allen Event-Details (Datum, Ort, vorgeschlagene Spiele, Teilnehmerliste), die du in Google Calendar, Apple Kalender, Outlook oder jeden anderen Kalender importieren kannst.",
      },
      {
        question: "Koennen Gaeste auch Spiele aus BGG vorschlagen?",
        answer:
          "Ja! Gaeste, die ueber den oeffentlichen Link teilnehmen, koennen nicht nur Spiele aus einer vorgegebenen Liste vorschlagen, sondern auch direkt in BoardGameGeek suchen und von dort Spiele vorschlagen \u2013 inklusive Bild, Spieleranzahl und Spieldauer.",
      },
      {
        question: "Was passiert wenn ich die Abstimmung schliesse?",
        answer:
          'Wenn du als Organisator "Abstimmung schliessen" klickst, wird das Spiel mit den meisten Stimmen als Gewinner festgelegt. Das Event wechselt vom Status "Abstimmung" zu "Abgeschlossen" und der Gewinner wird prominent angezeigt. Danach koennen keine weiteren Stimmen abgegeben werden.',
      },
    ],
  },
  {
    id: "groups",
    title: "Spielergruppen",
    icon: "users",
    description: "Gruppen fuer regelmaessige Spielrunden.",
    items: [
      {
        question: "Was sind Spielergruppen?",
        answer:
          "Gruppen sind fuer regelmaessige Spielrunden gedacht. Du kannst eine Gruppe erstellen, Mitglieder per E-Mail hinzufuegen und gemeinsam Umfragen, Abstimmungen und Diskussionen fuehren \u2013 z.B. welches Spiel als Naechstes gespielt werden soll.",
      },
      {
        question: "Wie erstelle ich eine Umfrage in einer Gruppe?",
        answer:
          'In der Gruppendetailseite findest du den Bereich "Umfragen". Klicke auf "Neue Umfrage" und gib eine Frage ein. Du kannst zwischen Einzel- und Mehrfachwahl waehlen. Optionen koennen frei eingegeben werden, oder du aktivierst "Optionen sind Spiele" um Spiele aus deiner Sammlung oder per BGG-Suche als Optionen hinzuzufuegen.',
      },
      {
        question: "Wie teile ich eine Gruppe oeffentlich?",
        answer:
          'Im Bereich "Einstellungen" der Gruppe kannst du einen oeffentlichen Link generieren. Ueber diesen Link koennen auch Personen ohne Account abstimmen und kommentieren \u2013 sie geben einfach einen Anzeigenamen ein. Optional kannst du den Link mit einem Passwort schuetzen.',
      },
      {
        question: "Wie funktionieren Kommentare?",
        answer:
          "In jeder Gruppe gibt es einen Kommentarbereich, in dem Mitglieder Nachrichten hinterlassen koennen. Auch ueber den oeffentlichen Link koennen Kommentare geschrieben werden \u2013 mit frei waehlbarem Anzeigenamen. So koennt ihr Spieleabende besprechen, Erfahrungen teilen oder Regelfragen klaeren.",
      },
      {
        question: "Gibt es Gruppenstatistiken?",
        answer:
          'Ja! In der Gruppendetailseite findest du den Link zu "Statistiken". Dort siehst du Auswertungen speziell fuer diese Gruppe: welche Spiele am haeufigsten gespielt wurden, Gewinnquoten der Mitglieder und mehr \u2013 basierend auf den erfassten Sessions der Gruppenmitglieder.',
      },
    ],
  },
  {
    id: "sessions",
    title: "Spielsessions",
    icon: "clock",
    description: "Partien erfassen, bewerten und auswerten.",
    items: [
      {
        question: "Was sind Spielsessions?",
        answer:
          "Eine Spielsession ist eine einzelne Partie eines Spiels. Du erfasst, wann gespielt wurde, welches Spiel es war, wer mitgespielt hat, wie lange gespielt wurde und optional wer gewonnen hat und welche Punkte erreicht wurden.",
      },
      {
        question: "Wie erstelle ich eine Session?",
        answer:
          'Gehe zu "Sessions" \u2192 "Neue Session". Waehle ein Spiel aus deiner Sammlung, fuege die Mitspieler hinzu (aus allen registrierten Nutzern), trage optional Punkte, Platzierungen und den Gewinner ein. Das Datum wird automatisch auf heute gesetzt, kann aber geaendert werden.',
      },
      {
        question: "Kann ich Sessions nachtraeglich bearbeiten?",
        answer:
          "Ja, oeffne die Session-Detailseite und klicke auf \"Bearbeiten\". Du kannst alle Felder aendern: Spiel, Datum, Dauer, Mitspieler, Punkte und Gewinner. So kannst du auch vergessene Sessions nachtraeglich korrekt erfassen.",
      },
      {
        question: "Was zeigen die Platzierungen an?",
        answer:
          "Jeder Mitspieler kann eine Platzierung (#1, #2, #3...) und einen Punktestand erhalten. Der Gewinner wird mit einem Pokal-Icon hervorgehoben. Diese Daten fliessen in die Statistiken ein, z.B. Gewinnquoten und Spieler-Ranglisten.",
      },
    ],
  },
  {
    id: "statistics",
    title: "Statistiken",
    icon: "bar-chart",
    description: "Auswertungen und Ranglisten.",
    items: [
      {
        question: "Welche Statistiken gibt es?",
        answer:
          'Unter "Statistiken" findest du: Gesamtuebersicht (Anzahl Spiele, Sessions, Gesamtspielzeit, Durchschnitt pro Session, Anzahl Mitspieler), meistgespielte Spiele (Top 10), Spieler-Rangliste nach Gewinnquote, monatliche Aktivitaet (Balkendiagramm), Verteilung nach Wochentagen, und Komplexitaets-Verteilung deiner Sammlung.',
      },
      {
        question: "Woher kommen die Daten fuer die Statistiken?",
        answer:
          "Alle Statistiken werden automatisch aus deinen erfassten Spielsessions berechnet. Je mehr Sessions du erfasst, desto aussagekraeftiger werden die Auswertungen. Die Berechnung erfolgt direkt in der Datenbank fuer maximale Performance.",
      },
      {
        question: "Gibt es Diagramme?",
        answer:
          "Ja, die Statistikseite zeigt vier interaktive Diagramme: Monatliche Aktivitaet (Balkendiagramm), Gewinnquoten der Spieler (horizontales Balkendiagramm), Verteilung nach Wochentagen (Balkendiagramm) und Komplexitaets-Verteilung (Tortendiagramm). Die Diagramme werden dynamisch geladen fuer schnelle Seitenaufbauzeiten.",
      },
    ],
  },
  {
    id: "profile",
    title: "Profil & Konto",
    icon: "user",
    description: "Konto verwalten und Passwort aendern.",
    items: [
      {
        question: "Wie aendere ich meinen Namen oder meine E-Mail?",
        answer:
          'Gehe zu "Profil" (ueber das Nutzer-Icon in der Navigation). Dort findest du ein Formular zum Aendern deines Namens und deiner E-Mail-Adresse. Die Aenderung wird sofort wirksam.',
      },
      {
        question: "Wie aendere ich mein Passwort?",
        answer:
          'Auf der Profilseite findest du den Bereich "Passwort aendern". Gib dein aktuelles Passwort und zweimal das neue Passwort ein. Das neue Passwort muss zwischen 8 und 128 Zeichen lang sein.',
      },
      {
        question: "Ich habe mein Passwort vergessen.",
        answer:
          'Klicke auf der Login-Seite auf "Passwort vergessen". Gib deine E-Mail-Adresse ein und du erhaeltst einen Link zum Zuruecksetzen deines Passworts. Der Link ist zeitlich begrenzt gueltig.',
      },
      {
        question: "Was sehe ich auf der Profilseite?",
        answer:
          "Neben den Bearbeitungsformularen zeigt die Profilseite deine Aktivitaeten: erhaltene Event-Einladungen, Events an denen du teilnimmst, Gruppen-Mitgliedschaften sowie Kommentare und Nachrichten aus Gruppen und Umfragen.",
      },
    ],
  },
  {
    id: "sharing",
    title: "Teilen & Datenschutz",
    icon: "share",
    description: "Oeffentliche Links, Gastzugang und Datenschutz.",
    items: [
      {
        question: "Wie funktionieren oeffentliche Links?",
        answer:
          "Fuer Events und Gruppen kannst du oeffentliche Links generieren. Diese Links enthalten einen verschluesselten Token \u2013 niemand kann die URL erraten. Ueber den Link koennen Personen ohne Account auf die geteilten Inhalte zugreifen und je nach Einstellung abstimmen, Spiele vorschlagen oder kommentieren.",
      },
      {
        question: "Kann ich einen oeffentlichen Link mit Passwort schuetzen?",
        answer:
          "Ja, bei Gruppen kannst du optional ein Passwort festlegen. Besucher muessen dann zuerst das Passwort eingeben, bevor sie den Inhalt sehen koennen. So kannst du den Zugriff einschraenken, auch wenn der Link versehentlich geteilt wird.",
      },
      {
        question: "Wie nehmen Gaeste an Events teil?",
        answer:
          'Gaeste oeffnen den oeffentlichen Event-Link und geben einen Nickname ein. Danach koennen sie: Spiele aus einer Liste oder per BGG-Suche vorschlagen, ueber Spielvorschlaege abstimmen, an der Terminabstimmung teilnehmen (Ja/Vielleicht/Nein) \u2013 alles ohne Login oder Registrierung.',
      },
      {
        question: "Wie funktionieren Einladungslinks per E-Mail?",
        answer:
          "Wenn du beim Erstellen eines Events E-Mail-Adressen angibst, erhaelt jede Person eine E-Mail mit einem persoenlichen Einladungslink. Ueber diesen Link kann die Person die Event-Details sehen und die Einladung annehmen oder ablehnen \u2013 auch ohne BoardGameTools-Account. Du wirst per E-Mail benachrichtigt wenn jemand antwortet.",
      },
      {
        question: "Wer kann meine Daten sehen?",
        answer:
          "Deine Spielesammlung, Sessions und Statistiken sind nur fuer dich sichtbar. Andere Nutzer sehen nur die Inhalte von Gruppen und Events, in denen sie Mitglied sind. Oeffentliche Links zeigen nur die jeweils freigegebenen Inhalte (Event-Details, Abstimmungen, Gruppenumfragen). Passwoerter werden verschluesselt gespeichert und sind niemals einsehbar.",
      },
    ],
  },
  {
    id: "admin",
    title: "Administration",
    icon: "shield",
    description: "Funktionen fuer Administratoren.",
    items: [
      {
        question: "Wer hat Zugriff auf den Admin-Bereich?",
        answer:
          'Nur Nutzer mit der Rolle "ADMIN" sehen den Admin-Bereich in der Navigation. Der erste Admin wird bei der Einrichtung erstellt. Admins koennen weitere Nutzer als Admins ernennen.',
      },
      {
        question: "Was kann ich in der Benutzerverwaltung?",
        answer:
          "Du siehst alle registrierten Nutzer mit Rolle, Status (aktiv/inaktiv), Anzahl der Spiele, Events und Abstimmungen. Du kannst: neue Nutzer anlegen, Passwoerter zuruecksetzen und Accounts deaktivieren. Aus Sicherheitsgruenden kann ein Admin sein eigenes Konto nicht deaktivieren.",
      },
      {
        question: "Was zeigt das Monitoring-Dashboard?",
        answer:
          'Das Monitoring hat vier Tabs: (1) Uebersicht \u2013 API-Statistiken mit Anfragen/Min, Fehlerrate, Antwortzeiten. (2) Logs \u2013 alle API-Requests mit Methode, Pfad, Status, Dauer. (3) Anomalien \u2013 automatische Erkennung von langsamen Endpoints, Fehlerhaeufungen und ungewoehnlicher Aktivitaet. (4) Qualitaet \u2013 Code-Review-Scores, Findings, Test-Coverage, Architektur-Diagramm und Tech-Stack.',
      },
      {
        question: "Wie funktioniert die Anomalie-Erkennung?",
        answer:
          "Das System analysiert automatisch die API-Logs und erkennt: langsame Endpoints (P95 Antwortzeit > 1s), gehaeuftes Auftreten von Fehlern (4xx/5xx) und ungewoehnlich hohe Aktivitaet einzelner Nutzer. Die Anomalien werden mit Zeitstempel und Details angezeigt.",
      },
    ],
  },
  {
    id: "changelog",
    title: "Updates & Versionen",
    icon: "history",
    description: "Neue Features und Verbesserungen.",
    items: [
      {
        question: "Wo sehe ich was sich geaendert hat?",
        answer:
          'Unter "Changelog" in der Navigation findest du eine vollstaendige Versions-Historie. Jede Version zeigt: Titel, Datum, Beschreibung und eine Liste aller Aenderungen, kategorisiert als "Neu" (neue Features), "Fix" (Fehlerbehebungen), "Verbessert" (Verbesserungen) und "Intern" (technische Aenderungen).',
      },
      {
        question: "Wie oft wird BoardGameTools aktualisiert?",
        answer:
          "Updates werden regelmaessig veroeffentlicht. Jede Aenderung \u2013 ob neues Feature, Fehlerbehebung oder Verbesserung \u2013 wird im Changelog dokumentiert und mit einer Versionsnummer versehen.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Probleme & Tipps",
    icon: "wrench",
    description: "Haeufige Probleme und Loesungen.",
    items: [
      {
        question: "Der BGG-Import findet meine Sammlung nicht.",
        answer:
          "Stelle sicher, dass dein BGG-Benutzername korrekt geschrieben ist und deine Sammlung auf BoardGameGeek oeffentlich sichtbar ist. Wenn BGG gerade ueberlastet ist (HTTP 202), wird der Import automatisch nach einigen Sekunden erneut versucht.",
      },
      {
        question: "Der Barcode-Scanner erkennt mein Spiel nicht.",
        answer:
          "Nicht alle Spiele haben eine EAN/UPC in der BGG-Datenbank. Versuche alternativ den Cover-Foto-Tab: Mache ein Foto des Spielecovers und der Name wird per OCR erkannt. Falls beides nicht funktioniert, suche das Spiel manuell ueber die BGG-Suche.",
      },
      {
        question: "Mein Spiel wurde doppelt importiert.",
        answer:
          "Beim BGG-Import wird automatisch geprueft, ob ein Spiel mit derselben BGG-ID bereits in deiner Sammlung existiert. Falls du ein Spiel manuell und per Import hinzugefuegt hast, kannst du das Duplikat einfach loeschen. Nutze die Mehrfachauswahl fuer schnelles Aufraeumen.",
      },
      {
        question: "E-Mails kommen nicht an.",
        answer:
          "Pruefe deinen Spam-Ordner. Die E-Mails kommen von der konfigurierten Absenderadresse (standardmaessig no-reply@boardgametools.local). Falls du der Administrator bist, stelle sicher dass die SMTP-Einstellungen in den Umgebungsvariablen korrekt sind (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).",
      },
      {
        question: "Die Seite laedt sehr langsam.",
        answer:
          "BoardGameTools nutzt Server-seitiges Rendering fuer schnelle Ladezeiten. Falls Seiten trotzdem langsam laden, kann es an einer langsamen Internetverbindung oder hoher Serverlast liegen. Admins koennen im Monitoring-Dashboard die API-Antwortzeiten pruefen.",
      },
      {
        question: "Wie kann ich mein Konto loeschen?",
        answer:
          "Wende dich an den Administrator deiner Instanz. Admins koennen Nutzerkonten ueber die Benutzerverwaltung deaktivieren. Deine Daten (Spiele, Sessions, Gruppen) bleiben per Soft-Delete erhalten und koennen bei Bedarf wiederhergestellt werden.",
      },
    ],
  },
];
