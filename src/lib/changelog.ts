export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: Array<{
    type: "feature" | "fix" | "improvement" | "internal";
    text: string;
  }>;
}

export const changelog: ChangelogEntry[] = [
  {
    version: "0.10.0",
    date: "2026-03-15",
    title: "Spielergruppen mit Abstimmungen",
    description: "Gruppen können jetzt Umfragen und Abstimmungen durchführen. Über einen öffentlichen Link können auch Nicht-Mitglieder abstimmen und kommentieren.",
    changes: [
      { type: "feature", text: "Spielergruppen erstellen und verwalten mit Mitgliederverwaltung" },
      { type: "feature", text: "Umfragen mit Einzel- oder Mehrfachwahl innerhalb von Gruppen" },
      { type: "feature", text: "Kommentare zu Abstimmungen und auf Gruppenebene" },
      { type: "feature", text: "Öffentlicher Link zum Teilen – Abstimmen und Kommentieren ohne Login" },
      { type: "feature", text: "Optionaler Passwortschutz für öffentliche Gruppenseiten" },
      { type: "feature", text: "Echtzeit-Balkendiagramme mit Stimmverteilung und Teilnehmernamen" },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-03-15",
    title: "Versionshistorie",
    description: "Die App hat jetzt eine eigene Versionshistorie, damit alle Neuerungen transparent nachvollziehbar sind.",
    changes: [
      { type: "feature", text: "Neue Changelog-Seite unter \"Versionen\" in der Navigation" },
      { type: "feature", text: "Versionsanzeige in der Navigationsleiste mit Link zur Historie" },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-03-15",
    title: "E-Mail-System & Externe Einladungen",
    description: "Spieleabende lassen sich jetzt per E-Mail organisieren. Auch Personen ohne Account können eingeladen werden und direkt zusagen oder absagen.",
    changes: [
      { type: "feature", text: "E-Mail-Benachrichtigungen bei Event-Einladungen, Zu- und Absagen" },
      { type: "feature", text: "Externe Gäste per E-Mail einladen (kein Account nötig)" },
      { type: "feature", text: "Öffentliche Einladungs-Seite zum Zusagen/Absagen ohne Login" },
      { type: "feature", text: "Custom-Nachrichten an alle Teilnehmer mit frei wählbarem Betreff" },
      { type: "feature", text: "Erinnerungs-Mails an alle zugesagten Teilnehmer" },
      { type: "feature", text: "Teilnehmerliste mit Status auf der öffentlichen Event-Seite" },
      { type: "improvement", text: "Detaillierte Fehleranzeige wenn E-Mail-Versand fehlschlägt" },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-03-15",
    title: "Navigation & Tabletop Indigo Design",
    description: "Die Navigation wurde komplett neu gebaut und ist jetzt auf allen Geräten zuverlässig sichtbar. Das Design wurde mit dem neuen Tabletop Indigo Theme aufgefrischt.",
    changes: [
      { type: "feature", text: "Neues Tabletop Indigo Theme mit durchgängigen Farbvariablen" },
      { type: "fix", text: "Navigation ist jetzt auf Desktop und Mobil immer sichtbar" },
      { type: "improvement", text: "Horizontales Scrollen der Navigation auf kleinen Bildschirmen" },
      { type: "improvement", text: "Icons auf Mobilgeräten, Icons + Text ab 1024px Breite" },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-03-14",
    title: "Barcode-Scanner & Cover-Erkennung",
    description: "Spiele können jetzt blitzschnell per Barcode oder Foto des Covers importiert werden.",
    changes: [
      { type: "feature", text: "Barcode-Scanner zum Importieren von Spielen per EAN/UPC-Code" },
      { type: "feature", text: "Cover-Foto OCR: Spielname wird automatisch vom Cover erkannt" },
      { type: "feature", text: "Scanner direkt auf der Spiele-Übersicht und beim Anlegen neuer Spiele" },
      { type: "fix", text: "Verbesserte Namenserkennung und Fallback-Suche bei Barcodes" },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-02-28",
    title: "Barrierefreiheit & Deployment",
    description: "Alle Farben und Kontraste wurden auf WCAG AA-Standard gebracht, damit die App für alle gut lesbar ist.",
    changes: [
      { type: "improvement", text: "Alle Farben erfüllen WCAG AA Kontrastanforderungen (4.5:1)" },
      { type: "improvement", text: "Semantische Tailwind-Farbvariablen statt fester Farbwerte" },
      { type: "internal", text: "Verbesserte Vercel-Deployment-Skripte mit automatischen Migrationen" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-02-27",
    title: "Terminabstimmung & Sammlungsimport",
    description: "Events haben jetzt eine Doodle-artige Terminabstimmung und die komplette BGG-Sammlung kann importiert werden.",
    changes: [
      { type: "feature", text: "Terminabstimmung für Events (ja / vielleicht / nein pro Datum)" },
      { type: "feature", text: "Komplette Spielesammlung aus BoardGameGeek importieren" },
      { type: "feature", text: "Gäste können ohne Account über den öffentlichen Link abstimmen" },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-02-18",
    title: "UI-Verbesserungen & Admin",
    description: "Die Oberfläche wurde mit Toast-Benachrichtigungen und Spielbildern in der Abstimmung verbessert.",
    changes: [
      { type: "feature", text: "Admin-Nutzerverwaltung mit Rollen und Aktivierung/Deaktivierung" },
      { type: "feature", text: "Spielbilder werden in der Event-Abstimmung angezeigt" },
      { type: "improvement", text: "Toast-Benachrichtigungen statt Browser-Popups" },
      { type: "improvement", text: "Externe Bilder von BoardGameGeek werden korrekt geladen" },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-02-18",
    title: "Vercel & PostgreSQL",
    description: "Die App läuft jetzt auf Vercel mit einer PostgreSQL-Datenbank für mehr Stabilität und Performance.",
    changes: [
      { type: "feature", text: "Hosting auf Vercel mit automatischem Deployment" },
      { type: "feature", text: "PostgreSQL-Datenbank statt SQLite" },
      { type: "feature", text: "Health-Check API für Monitoring" },
      { type: "internal", text: "Sicherheitsupdates für alle Abhängigkeiten" },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-12",
    title: "Erste Version",
    description: "Die Grundversion von BoardGameTools mit Spieleverwaltung, Events und BoardGameGeek-Anbindung.",
    changes: [
      { type: "feature", text: "Spielesammlung verwalten (hinzufügen, bearbeiten, löschen)" },
      { type: "feature", text: "Spiele aus BoardGameGeek suchen und importieren" },
      { type: "feature", text: "Events erstellen mit Spielvorschlägen und Abstimmung" },
      { type: "feature", text: "Gruppen für regelmässige Spieleabende" },
      { type: "feature", text: "Benutzerregistrierung und Login" },
    ],
  },
];

export const currentVersion = changelog[0].version;
