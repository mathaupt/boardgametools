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
          'Klicke auf der Startseite auf "Registrieren". Gib deinen Namen, eine E-Mail-Adresse und ein Passwort ein. Nach der Registrierung kannst du dich sofort anmelden und loslegen.',
      },
      {
        question: "Was kann ich mit BoardGameTools machen?",
        answer:
          "BoardGameTools hilft dir, deine Brettspielsammlung zu verwalten, Spieleabende zu organisieren, Abstimmungen durchzuführen und Statistiken zu deinen Spielsessions zu führen. Du kannst Spiele aus BoardGameGeek importieren, Events mit Freunden planen und Gruppen für regelmässige Spieleabende erstellen.",
      },
      {
        question: "Ist BoardGameTools kostenlos?",
        answer:
          "Ja, BoardGameTools ist komplett kostenlos nutzbar. Alle Features stehen dir ohne Einschränkungen zur Verfügung.",
      },
    ],
  },
  {
    id: "games",
    title: "Spielesammlung",
    icon: "gamepad",
    description: "Spiele verwalten und importieren.",
    items: [
      {
        question: "Wie füge ich ein Spiel hinzu?",
        answer:
          'Gehe zu "Spiele" und klicke auf "Neues Spiel". Du kannst den Namen, die Spieleranzahl, die Spieldauer und ein Bild angeben. Am schnellsten geht es über die BGG-Suche: Tippe den Namen ein und wähle das Spiel aus – alle Daten werden automatisch übernommen.',
      },
      {
        question: "Wie importiere ich Spiele aus BoardGameGeek?",
        answer:
          'Unter "Spiele" → "Import" kannst du deinen BGG-Benutzernamen eingeben. Deine gesamte Sammlung wird geladen und du kannst einzelne oder alle Spiele auf einmal importieren. Die Spieldaten wie Spieleranzahl, Dauer und Bilder werden automatisch von BGG übernommen.',
      },
      {
        question: "Kann ich Spiele per Barcode scannen?",
        answer:
          'Ja! Auf der Spiele-Übersicht und beim Anlegen neuer Spiele findest du den Barcode-Scanner. Halte den Barcode (EAN/UPC) eines Spiels vor die Kamera – das Spiel wird automatisch erkannt und die Daten von BGG geladen. Alternativ kannst du auch ein Foto des Spielecovers machen, das per OCR erkannt wird.',
      },
      {
        question: "Was sind Spielereihen?",
        answer:
          'Unter "Reihen" kannst du zusammengehörige Spiele gruppieren, z.B. alle EXIT-Spiele, Adventure Games oder Legacy-Kampagnen. Du kannst den Fortschritt tracken, Bewertungen vergeben und die Reihenfolge festlegen.',
      },
    ],
  },
  {
    id: "events",
    title: "Events & Spieleabende",
    icon: "calendar",
    description: "Spieleabende planen und organisieren.",
    items: [
      {
        question: "Wie erstelle ich einen Spieleabend?",
        answer:
          'Gehe zu "Events" und klicke auf "Neues Event". Gib einen Namen, Datum, Ort und optional eine Beschreibung ein. Danach kannst du Spiele vorschlagen und Teilnehmer einladen.',
      },
      {
        question: "Wie funktioniert die Spieleabstimmung?",
        answer:
          "Jeder Teilnehmer kann Spiele vorschlagen und über vorgeschlagene Spiele abstimmen. Das Spiel mit den meisten Stimmen gewinnt. Du siehst in Echtzeit, wer für welches Spiel gestimmt hat.",
      },
      {
        question: "Wie funktioniert die Terminabstimmung?",
        answer:
          'Beim Erstellen eines Events kannst du mehrere Terminvorschläge hinzufügen. Teilnehmer stimmen mit "Ja", "Vielleicht" oder "Nein" für jeden Termin ab – ähnlich wie bei Doodle. Am Ende wählst du den besten Termin aus.',
      },
      {
        question: "Kann ich Leute ohne Account einladen?",
        answer:
          'Ja! Du kannst Events per öffentlichem Link teilen. Über "Teilen" generierst du einen Link, den du per WhatsApp, E-Mail oder andere Messenger verschicken kannst. Gäste können ohne Login abstimmen und zusagen. Zusätzlich kannst du externe Gäste per E-Mail einladen – sie bekommen einen persönlichen Einladungslink.',
      },
      {
        question: "Wie verschicke ich Erinnerungen?",
        answer:
          'In der Event-Detailseite findest du die Möglichkeit, E-Mail-Nachrichten an alle Teilnehmer zu senden. Du kannst einen eigenen Betreff und Text eingeben, oder Erinnerungs-Mails an alle zugesagten Teilnehmer verschicken.',
      },
    ],
  },
  {
    id: "groups",
    title: "Spielergruppen",
    icon: "users",
    description: "Gruppen für regelmässige Spielrunden.",
    items: [
      {
        question: "Was sind Spielergruppen?",
        answer:
          "Gruppen sind für regelmässige Spielrunden gedacht. Du kannst eine Gruppe erstellen, Mitglieder hinzufügen und gemeinsam Umfragen und Abstimmungen durchführen – z.B. welches Spiel als Nächstes gespielt werden soll.",
      },
      {
        question: "Wie erstelle ich eine Umfrage in einer Gruppe?",
        answer:
          'In der Gruppendetailseite findest du den Bereich "Umfragen". Klicke auf "Neue Umfrage" und gib eine Frage ein. Du kannst zwischen Einzel- und Mehrfachwahl wählen. Optionen können frei eingegeben werden, oder du aktivierst "Optionen sind Spiele" um Spiele aus deiner Sammlung oder per BGG-Suche als Optionen hinzuzufügen.',
      },
      {
        question: "Wie teile ich eine Gruppe öffentlich?",
        answer:
          'Im Bereich "Einstellungen" der Gruppe kannst du einen öffentlichen Link generieren. Über diesen Link können auch Personen ohne Account abstimmen und kommentieren. Optional kannst du den Link mit einem Passwort schützen.',
      },
      {
        question: "Wie funktionieren Kommentare?",
        answer:
          "In jeder Gruppe gibt es einen Kommentarbereich, in dem Mitglieder Nachrichten hinterlassen können. Auch über den öffentlichen Link können Kommentare geschrieben werden – mit frei wählbarem Anzeigenamen.",
      },
    ],
  },
  {
    id: "sessions",
    title: "Spielsessions",
    icon: "clock",
    description: "Partien erfassen und auswerten.",
    items: [
      {
        question: "Was sind Spielsessions?",
        answer:
          "Eine Spielsession ist eine einzelne Partie eines Spiels. Du erfasst, wann gespielt wurde, welches Spiel es war, wer mitgespielt hat und optional wer gewonnen hat und welche Punkte erreicht wurden.",
      },
      {
        question: "Wie erstelle ich eine Session?",
        answer:
          'Gehe zu "Sessions" → "Neue Session". Wähle ein Spiel aus deiner Sammlung, füge die Mitspieler hinzu und trage optional Punkte und den Gewinner ein. Das Datum wird automatisch auf heute gesetzt.',
      },
      {
        question: "Wo sehe ich meine Statistiken?",
        answer:
          'Unter "Statistiken" findest du eine Übersicht über alle deine Sessions: meistgespielte Spiele, Gewinnquoten, Spielhäufigkeit und mehr. Die Statistiken werden automatisch aus deinen erfassten Sessions berechnet.',
      },
    ],
  },
  {
    id: "sharing",
    title: "Teilen & Datenschutz",
    icon: "share",
    description: "Öffentliche Links und Passwortschutz.",
    items: [
      {
        question: "Wie funktionieren öffentliche Links?",
        answer:
          "Für Events und Gruppen kannst du öffentliche Links generieren. Diese Links enthalten einen verschlüsselten Token – niemand kann die URL erraten. Über den Link können Personen ohne Account auf die geteilten Inhalte zugreifen und je nach Einstellung abstimmen oder kommentieren.",
      },
      {
        question: "Kann ich einen öffentlichen Link mit Passwort schützen?",
        answer:
          "Ja, bei Gruppen kannst du optional ein Passwort festlegen. Besucher müssen dann zuerst das Passwort eingeben, bevor sie den Inhalt sehen können. So kannst du den Zugriff einschränken, auch wenn der Link geteilt wird.",
      },
      {
        question: "Wer kann meine Daten sehen?",
        answer:
          "Deine Spielesammlung, Sessions und Statistiken sind nur für dich sichtbar. Andere Nutzer sehen nur die Inhalte von Gruppen und Events, in denen sie Mitglied sind. Öffentliche Links zeigen nur die jeweils freigegebenen Inhalte.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Probleme & Tipps",
    icon: "wrench",
    description: "Häufige Probleme und Lösungen.",
    items: [
      {
        question: "Der BGG-Import findet meine Sammlung nicht.",
        answer:
          "Stelle sicher, dass dein BGG-Benutzername korrekt geschrieben ist und deine Sammlung auf BoardGameGeek öffentlich sichtbar ist. Wenn BGG gerade überlastet ist (HTTP 202), wird der Import automatisch nach einigen Sekunden erneut versucht.",
      },
      {
        question: "Der Barcode-Scanner erkennt mein Spiel nicht.",
        answer:
          "Nicht alle Spiele haben eine EAN/UPC in der BGG-Datenbank. Versuche alternativ den Cover-Foto-Tab: Mache ein Foto des Spielecovers und der Name wird per OCR erkannt. Falls beides nicht funktioniert, suche das Spiel manuell über die BGG-Suche.",
      },
      {
        question: "Ich habe mein Passwort vergessen.",
        answer:
          'Klicke auf der Login-Seite auf "Passwort vergessen". Gib deine E-Mail-Adresse ein und du erhältst einen Link zum Zurücksetzen deines Passworts.',
      },
      {
        question: "Wie kann ich mein Konto löschen?",
        answer:
          "Wende dich an den Administrator deiner Instanz. Admins können Nutzerkonten über die Nutzerverwaltung deaktivieren.",
      },
    ],
  },
];
