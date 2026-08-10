# BoardGameTools — Feature-Dokumentation

> **Version 0.49.0** | 42 Seiten | 92 API-Endpunkte | 29 Datenbank-Modelle
>
> Vollstaendige Dokumentation aller Nutzer-sichtbaren Features,
> organisiert nach Bereichen mit Screenshots-Beschreibungen,
> Aktionen und Zugriffsrechten.

---

## Inhaltsverzeichnis

1. [Dashboard](#1-dashboard)
2. [Spielesammlung](#2-spielesammlung)
3. [BGG-Integration](#3-bgg-integration)
4. [Spielsessions](#4-spielsessions)
5. [Spielereihen](#5-spielereihen)
6. [Events & Spieleabende](#6-events--spieleabende)
7. [Terminabstimmung](#7-terminabstimmung)
8. [Oeffentliche Teilnahme](#8-oeffentliche-teilnahme)
9. [Spielergruppen](#9-spielergruppen)
10. [Statistiken](#10-statistiken)
11. [Profil & Konto](#11-profil--konto)
12. [Administration](#12-administration)
13. [Sonstige Features](#13-sonstige-features)
14. [Mobile API](#14-mobile-api)
15. [iOS-Companion-App](#15-ios-companion-app)
16. [Technische Uebersicht](#16-technische-uebersicht)

---

## 1. Dashboard

**Route:** `/dashboard` | **Zugriff:** Angemeldet

Das Dashboard ist die zentrale Startseite nach dem Login.

### Statistik-Kacheln (4)

| Kachel | Wert | Verlinkt zu |
|--------|------|-------------|
| Spiele | Anzahl in der Sammlung | `/dashboard/games` |
| Sessions | Gespielte Partien | `/dashboard/sessions` |
| Gruppen | Mitgliedschaften | `/dashboard/groups` |
| Events | Angenommene Einladungen | `/dashboard/events` |

### Schnellzugriffe (5)

| Aktion | Ziel |
|--------|------|
| Spiel hinzufuegen | `/dashboard/games/new` |
| BGG Import | `/dashboard/bgg` |
| Session erstellen | `/dashboard/sessions/new` |
| Gruppe erstellen | `/dashboard/groups/new` |
| Event planen | `/dashboard/events/new` |

### Widgets

- **Offene Einladungen** — Event-Einladungen die auf Antwort warten (Zusagen/Absagen)
- **Kommende Events** — Die naechsten 5 Events mit Datum, Ort und Spielvorschlaegen
- **Letzte Sessions** — Die letzten 5 gespielten Partien mit Spielname und Datum

---

## 2. Spielesammlung

### Uebersicht

**Route:** `/dashboard/games` | **Zugriff:** Angemeldet

Zeigt alle Spiele des Nutzers als Karten-Grid mit Cover-Bild, Name, Spieleranzahl,
Spieldauer, Komplexitaet und Tags.

**Aktionen:**
- Textsuche (filtert nach Name, clientseitig)
- Tag-Filter (klickbare Chips, z.B. "Strategie", "Familie")
- Neues Spiel hinzufuegen
- Von BGG importieren
- Barcode-Scanner oeffnen
- Einzelnes Spiel loeschen (mit Bestaetigung)
- Alle Spiele loeschen (Bulk-Delete mit Bestaetigung)

### Spiel hinzufuegen

**Route:** `/dashboard/games/new` | **Zugriff:** Angemeldet

Formular mit folgenden Feldern:

| Feld | Typ | Pflicht |
|------|-----|---------|
| Name | Text | Ja |
| Beschreibung | Textarea | Nein |
| Min. Spieler | Zahl | Nein |
| Max. Spieler | Zahl | Nein |
| Spieldauer (Min.) | Zahl | Nein |
| Komplexitaet | 1-5 | Nein |
| Bild | Upload oder URL | Nein |
| BGG-ID | Zahl | Nein |
| EAN/Barcode | Barcode-Scanner | Nein |

Beim Anlegen kann direkt der **Barcode-Scanner** genutzt werden:
Kamera scannt EAN/UPC → automatische BGG-Suche → Spiel-Import mit allen Daten.

### Spiel-Detailseite

**Route:** `/dashboard/games/[id]` | **Zugriff:** Eigentuemer

Zeigt alle Spieldaten, Cover-Bild, BGG-Link (falls vorhanden), Tags und die
Anzahl gespielter Sessions. Buttons fuer Bearbeiten und Loeschen.

### Spiel bearbeiten

**Route:** `/dashboard/games/[id]/edit` | **Zugriff:** Eigentuemer

Identisches Formular wie "Spiel hinzufuegen", vorausgefuellt mit aktuellen Daten.

---

## 3. BGG-Integration

### Import-Seite

**Route:** `/dashboard/games/import` | **Zugriff:** Angemeldet

Drei Import-Methoden:

| Methode | Beschreibung |
|---------|-------------|
| **Namensuche** | BGG nach Spielname durchsuchen, Ergebnis waehlen, importieren |
| **Direkte BGG-ID** | BGG-ID eingeben → Spieldaten laden → importieren |
| **Sammlungs-Import** | BGG-Benutzername eingeben → komplette Sammlung laden → einzeln oder alle importieren |

Importierte Daten: Name, Bild, Spieleranzahl, Spieldauer, Komplexitaet,
Kategorien, Mechaniken, BGG-Rating, BGG-Rang.

### BGG-Suche

**Route:** `/dashboard/bgg` | **Zugriff:** Angemeldet

Vereinfachte BGG-Suchseite: Suchfeld → Ergebnisliste mit Bild, Rating,
Rang → Ein-Klick-Import in die Sammlung.

### Barcode-Scanner

Verfuegbar auf: Spiele-Uebersicht, Neues Spiel, Import-Seite

| Funktion | Beschreibung |
|----------|-------------|
| **Kamera-Scan** | EAN/UPC-Barcode per Smartphone-Kamera scannen |
| **Manuelle Eingabe** | EAN-Nummer per Tastatur eingeben |
| **Cover-Foto OCR** | Foto des Spielecovers → Texterkennung (Tesseract.js) → BGG-Suche |

Erkannter Barcode wird automatisch in BGG gesucht und das Spiel kann
mit einem Klick importiert werden.

---

## 4. Spielsessions

### Uebersicht

**Route:** `/dashboard/sessions` | **Zugriff:** Angemeldet

Liste der letzten 20 Sessions als Karten. Jede Karte zeigt:
- Spielname, Datum, Dauer, Spieleranzahl
- Spieler-Ergebnisse: Platzierung (#1, #2...), Punkte, Gewinner (Pokal-Icon)
- Notizen (falls vorhanden)

**Aktionen:** Neue Session erstellen, Details ansehen, Session bearbeiten.

### Session erstellen

**Route:** `/dashboard/sessions/new` | **Zugriff:** Angemeldet

| Feld | Typ | Pflicht |
|------|-----|---------|
| Spiel | Auswahl aus eigener Sammlung | Ja |
| Datum | Datumspicker (Standard: heute) | Ja |
| Dauer (Min.) | Zahl | Nein |
| Mitspieler | Auswahl aus registrierten Nutzern | Nein |
| Punkte pro Spieler | Zahl | Nein |
| Platzierung pro Spieler | Zahl (#1, #2...) | Nein |
| Gewinner | Auswahl | Nein |
| Notizen | Textarea | Nein |

### Session-Detail & Bearbeiten

**Routen:** `/dashboard/sessions/[id]`, `/dashboard/sessions/[id]/edit`

Alle Felder koennen nachtraeglich bearbeitet werden.

---

## 5. Spielereihen

### Uebersicht

**Route:** `/dashboard/series` | **Zugriff:** Angemeldet

Grid-Ansicht aller Spielereihen mit Cover-Bild/Collage, Fortschrittsbalken
(X von Y gespielt) und Abschluss-Badge.

**Filter & Sortierung:**
- Textsuche nach Reihenname
- Status-Filter: Alle / In Bearbeitung / Abgeschlossen / Leer
- Sortierung: Name, Fortschritt, Anzahl Eintraege, Neueste/Aelteste

**Aktionen:** Neue Reihe erstellen, Reihe oeffnen.

### Reihe erstellen

**Route:** `/dashboard/series/new` | **Zugriff:** Angemeldet

| Feld | Typ | Pflicht |
|------|-----|---------|
| Name | Text (z.B. "EXIT - Das Spiel") | Ja |
| Beschreibung | Textarea | Nein |
| Cover-Bild | Upload oder URL | Nein |

### Reihen-Detail

**Route:** `/dashboard/series/[id]` | **Zugriff:** Eigentuemer

Zeigt alle Eintraege der Reihe mit erweiterten Erfassungsmoeglichkeiten:

| Feld pro Eintrag | Beschreibung |
|-------------------|-------------|
| Bewertung | 1-5 Sterne |
| Schwierigkeit | Einsteiger / Fortgeschritten / Profi |
| Spieldauer | Minuten |
| Spieleranzahl | Zahl |
| Score/Punkte | Zahl |
| Erfolg | Ja/Nein (z.B. EXIT geloest?) |
| Gespielt-Status | Unabhaengig vom Session-Tracking |

**Aktionen:**
- Spiel hinzufuegen (aus Sammlung oder per BGG-Import)
- Reihenfolge per Drag & Drop aendern
- Eintrag bearbeiten / loeschen
- Reihe loeschen

---

## 6. Events & Spieleabende

### Uebersicht

**Route:** `/dashboard/events` | **Zugriff:** Angemeldet

Liste aller Events des Nutzers. Jede Karte zeigt: Titel, Datum, Ort,
Anzahl Einladungen, Spielvorschlaege mit Stimmenanzahl, ausgewaehltes Spiel.

Oben: **Offene Einladungen** mit Zusagen/Absagen-Buttons.

### Event erstellen

**Route:** `/dashboard/events/new` | **Zugriff:** Angemeldet

| Feld | Typ | Pflicht |
|------|-----|---------|
| Titel | Text | Ja |
| Datum/Uhrzeit | Datumspicker | Nein |
| Ort | Text | Nein |
| Beschreibung | Textarea | Nein |
| Einladungen | Kommagetrennte E-Mail-Adressen | Nein |

### Event-Detailseite

**Route:** `/dashboard/events/[id]` | **Zugriff:** Eingeladene + Eigentuemer

Die zentrale Seite fuer Event-Management mit folgenden Bereichen:

#### Event-Info
Datum, Ort, Status (Entwurf / Abstimmung / Abgeschlossen), Beschreibung.

#### Oeffentlicher Link
- Status-Badge (Oeffentlich / Nicht veroeffentlicht)
- Link generieren / erneuern
- Link kopieren (Zwischenablage)

#### Gaeste-Teilnehmer
Uebersicht der Gaeste (per oeffentlichem Link beigetreten) mit Stimmenanzahl.

#### Terminabstimmung
→ Siehe [Abschnitt 7: Terminabstimmung](#7-terminabstimmung)

#### Spielvorschlaege & Abstimmung
- Vorschlaege mit Bild, Name, Spieleranzahl, Spieldauer, Komplexitaet
- Wer hat vorgeschlagen, wie viele Stimmen
- Abstimmen / Stimme zurueckziehen
- Gewinnerspiel hervorgehoben

#### Organizer-Aktionen (nur Ersteller)
| Aktion | Beschreibung |
|--------|-------------|
| Abstimmung schliessen | Gewinnerspiel festlegen, Status → "Abgeschlossen" |
| E-Mail senden | Erinnerung oder individuelle Nachricht an alle Teilnehmer |
| Kalender-Export | .ics-Datei mit Event-Details herunterladen |

### Einladungen verwalten

**Route:** `/dashboard/events/[id]/invite` | **Zugriff:** Eigentuemer

- Nutzer aus der Nutzerliste einladen
- Bestehende Einladungen mit Status-Badge (Ausstehend/Zugesagt/Abgesagt)
- Einladungen erneut senden

### Event teilen

**Route:** `/dashboard/events/[id]/share` | **Zugriff:** Eigentuemer

- Oeffentlichen Link aktivieren/deaktivieren
- Nutzer per Suche und Checkbox einladen
- Sharing-Status: Ausstehend/Zugesagt/Abgesagt Zaehler

### Voting-Seite

**Route:** `/dashboard/events/[id]/voting` | **Zugriff:** Eingeladene

- Spiel aus eigener Sammlung vorschlagen
- Spiel per BGG-Suche vorschlagen
- Ueber vorgeschlagene Spiele abstimmen
- Rangliste der Vorschlaege nach Stimmen

---

## 7. Terminabstimmung

Integriert in die Event-Detailseite. Doodle-aehnliche Terminplanung.

### Ablauf

1. **Organisator erstellt Terminvorschlaege** — Start-/Enddatum, Wochentag-Filter
2. **Teilnehmer stimmen ab** — Pro Termin: Ja / Vielleicht / Nein
3. **Uebersichtsmatrix** — Alle Antworten auf einen Blick (Teilnehmer x Termine)
4. **Organisator waehlt Termin** — Bester Termin wird festgelegt
5. **Zuruecksetzen** — Terminabstimmung kann jederzeit zurueckgesetzt werden

### Gaeste-Unterstuetzung

Auch Gaeste (ueber oeffentlichen Link) koennen an der Terminabstimmung teilnehmen
und ihre Verfuegbarkeit angeben.

---

## 8. Oeffentliche Teilnahme

Drei oeffentliche Seiten, die ohne Login erreichbar sind:

### Oeffentliches Event

**Route:** `/public/event/[token]` | **Zugriff:** Jeder mit Link

Gaeste koennen:
- Event-Details sehen (Datum, Ort, Teilnehmer)
- Per Nickname beitreten (Gast-Registrierung)
- Spiele vorschlagen (aus vorgegebener Liste oder per BGG-Suche)
- Ueber Spielvorschlaege abstimmen
- An der Terminabstimmung teilnehmen (Ja/Vielleicht/Nein)

### Oeffentliche Gruppe

**Route:** `/public/group/[token]` | **Zugriff:** Jeder mit Link (optional Passwort)

Besucher koennen:
- Gruppen-Umfragen sehen und abstimmen (mit Anzeigename)
- Kommentare schreiben
- Mitgliederliste einsehen

Falls ein Passwort gesetzt ist, muss dieses zuerst eingegeben werden.

### Einladungs-Antwort

**Route:** `/public/invite/[token]` | **Zugriff:** Eingeladene Person

- Event-Details und Spielvorschlaege einsehen
- Einladung annehmen oder ablehnen — ohne Login

---

## 9. Spielergruppen

### Uebersicht

**Route:** `/dashboard/groups` | **Zugriff:** Angemeldet

Grid-Ansicht aller Gruppen. Jede Karte zeigt: Name, Beschreibung,
Eigentuemer-Badge, Mitgliederzahl, Umfragen-Anzahl, Kommentar-Anzahl,
Mitglieder-Avatare.

### Gruppe erstellen

**Route:** `/dashboard/groups/new` | **Zugriff:** Angemeldet

| Feld | Typ | Pflicht |
|------|-----|---------|
| Name | Text | Ja |
| Beschreibung | Textarea | Nein |

### Gruppen-Detail

**Route:** `/dashboard/groups/[id]` | **Zugriff:** Mitglieder

#### Mitglieder-Bereich
- Mitgliederliste mit Rollen
- Mitglied hinzufuegen (per E-Mail, nur Eigentuemer)
- Mitglied entfernen (nur Eigentuemer, nicht sich selbst)

#### Umfragen-Bereich
- Bestehende Umfragen mit Optionen und Stimmen
- Neue Umfrage erstellen:
  - Frage eingeben
  - Einzel- oder Mehrfachwahl
  - Freitext-Optionen oder Spiele als Optionen (aus Sammlung / BGG-Suche)
- Abstimmen (Optionen anklicken)

#### Kommentar-Bereich
- Diskussionsfaden mit Zeitstempeln
- Neuen Kommentar schreiben

#### Einstellungen (nur Eigentuemer)
- Oeffentlichen Link generieren / deaktivieren
- Passwortschutz setzen

### Gruppen-Statistiken

**Route:** `/dashboard/groups/[id]/statistics` | **Zugriff:** Mitglieder

Auswertungen fuer die Gruppe: meistgespielte Spiele, Gewinnquoten der Mitglieder,
basierend auf den Sessions der Gruppenmitglieder.

---

## 10. Statistiken

**Route:** `/dashboard/statistics` | **Zugriff:** Angemeldet

### Uebersicht (4 KPI-Kacheln)

| Metrik | Beschreibung |
|--------|-------------|
| Spiele | Gesamtanzahl in der Sammlung |
| Sessions | Gesamtanzahl gespielter Partien |
| Spielzeit | Gesamtspielzeit + Durchschnitt pro Session |
| Spieler | Anzahl verschiedener Mitspieler |

### Diagramme (4, dynamisch geladen)

| Diagramm | Typ | Beschreibung |
|----------|-----|-------------|
| Monatliche Aktivitaet | Balken | Sessions und Spielminuten der letzten 12 Monate |
| Gewinnquoten | Horizontale Balken | Gewinnrate pro Spieler |
| Wochentag-Verteilung | Balken | Sessions nach Wochentag (So–Sa) |
| Komplexitaets-Verteilung | Torte | Spiele nach Komplexitaetsstufe (1–5) |

### Ranglisten

- **Top 10 Spiele** — Sortiert nach Anzahl Sessions, mit Gesamtspielzeit
- **Spieler-Rangliste** — Sortiert nach Gewinnquote (Siege / Teilnahmen)

---

## 11. Profil & Konto

**Route:** `/dashboard/profile` | **Zugriff:** Angemeldet

### Profil bearbeiten

| Feld | Aenderbar |
|------|-----------|
| Name | Ja |
| E-Mail | Ja (Duplikat-Pruefung) |
| Registrierungsdatum | Nein (Anzeige) |

### Passwort aendern

Aktuelles Passwort + neues Passwort (2x). Laenge: 8–128 Zeichen.

### Aktivitaets-Uebersicht

| Widget | Inhalt |
|--------|--------|
| Einladungen | Erhaltene Event-Einladungen mit Status |
| Events | Events an denen teilgenommen wird |
| Gruppen | Gruppen-Mitgliedschaften |
| Nachrichten | Kommentare in Gruppen und Umfragen |

### Passwort vergessen

**Route:** `/passwort-vergessen` | **Zugriff:** Nicht angemeldet

E-Mail eingeben → Token per E-Mail → neues Passwort setzen.
Token ist zeitlich begrenzt (konfigurierbar, Standard: 60 Minuten).

---

## 12. Administration

Nur fuer Nutzer mit der Rolle **ADMIN** sichtbar.

### Benutzerverwaltung

**Route:** `/dashboard/admin/users` | **Zugriff:** ADMIN

| Aktion | Beschreibung |
|--------|-------------|
| Nutzer anlegen | Name, E-Mail, Passwort, Rolle (USER/ADMIN) |
| Passwort aendern | Neues Passwort fuer beliebigen Nutzer setzen |
| Account deaktivieren | Nutzer sperren (Self-Protection: eigenes Konto nicht deaktivierbar) |

Nutzerliste zeigt: Name, E-Mail, Rolle-Badge, Aktiv-Status, Anzahl Spiele/Events/Abstimmungen.

### Monitoring-Dashboard

**Route:** `/dashboard/admin/monitoring` | **Zugriff:** ADMIN

4 Tabs mit konfigurierbarem Zeitraum (1h / 6h / 24h / 7d / 30d):

#### Tab 1: Uebersicht
- API-Anfragen pro Minute
- Fehlerrate (4xx/5xx)
- Durchschnittliche Antwortzeit
- Top-Endpunkte nach Aufrufen

#### Tab 2: Logs
- Alle API-Requests mit: Methode, Pfad, Status-Code, Dauer, Nutzer-ID, Zeitstempel
- Logs loeschen

#### Tab 3: Anomalien
- Automatische Erkennung von:
  - Langsamen Endpoints (P95 > 1s)
  - Fehlerhaeufungen (gehaeuftes 4xx/5xx)
  - Ungewoehnlich hoher Aktivitaet einzelner Nutzer
- Anomalie-Zaehler als Badge im Tab

#### Tab 4: Qualitaet
- Deep-Dive Review Score (Radar-Chart, 10 Kategorien)
- Findings nach Prioritaet (Balkendiagramm)
- Score-Verlauf ueber Zeit (Liniendiagramm)
- Code-Qualitaets-Badges (TypeScript, ESLint, npm audit, Error Boundaries, Loading States)
- Code Coverage
- Architektur-Diagramm (4 Schichten: Client → Next.js → Business Logic → Daten)
- Tech-Stack mit Logos und Lizenzen

---

## 13. Sonstige Features

### E-Mail-Benachrichtigungen

| E-Mail-Typ | Anlass |
|------------|--------|
| Passwort-Zuruecksetzen | Nutzer fordert Reset an |
| Event-Einladung | Organizer laedt ein |
| Einladungs-Erinnerung | Organizer sendet Reminder |
| Antwort-Benachrichtigung | Gast antwortet auf Einladung |
| Individuelle Nachricht | Organizer sendet freien Text |

Alle E-Mails: Gebrandete HTML-Templates auf Deutsch, ueber konfigurierbaren SMTP-Server.

### Kalender-Export

Auf jeder Event-Detailseite: Download einer `.ics`-Datei mit:
- Event-Titel, Datum, Ort
- Spielvorschlaege in der Beschreibung
- Teilnehmerliste

Kompatibel mit Google Calendar, Apple Kalender, Outlook, Thunderbird.

### Changelog

**Route:** `/dashboard/changelog` | **Zugriff:** Angemeldet

Versions-Timeline mit: Versionsnummer, Datum, Titel, Beschreibung und
kategorisierten Aenderungen (Neu / Fix / Verbessert / Intern).

### FAQ & Anleitung

**Route:** `/dashboard/faq` | **Zugriff:** Angemeldet

11 Sektionen mit 55 Fragen zu allen Features. Schnell-Navigation per
klickbare Section-Chips. Akkordeon-Darstellung.

### Health-Check

**Route:** `/api/health` | **Zugriff:** Oeffentlich

Gibt zurueck: DB-Status (Ping), Speicherverbrauch, Uptime, Version.

### Landing Page

**Route:** `/` | **Zugriff:** Oeffentlich

Marketing-Seite mit Feature-Uebersicht. Angemeldete Nutzer werden
automatisch zum Dashboard weitergeleitet.

### Rechtliche Seiten

| Route | Inhalt |
|-------|--------|
| `/privacy` | Datenschutzerklaerung |
| `/terms` | Nutzungsbedingungen |

---

## 14. Mobile API

**Namespace:** `/api/mobile/v1/*` | **Zugriff:** API-Token (`Authorization: Bearer <token>`) oder NextAuth-Session

Native iOS-Companion-App (SwiftUI). Alle Domänenregeln werden vom bestehenden
Next.js-Backend bereitgestellt; die Mobile-API ist ein duenner Wrapper mit
Bearer-Token-Authentifizierung.

### Auth

- `POST /api/mobile/v1/auth/login` — E-Mail/Passwort → Token-Paar
- `POST /api/mobile/v1/auth/refresh` — Refresh-Token tauschen
- `POST /api/mobile/v1/auth/logout` — Access-Token widerrufen
- `POST /api/mobile/v1/auth/logout-all` — Alle Tokens widerrufen
- `POST /api/mobile/v1/auth/apple` — Sign in with Apple → Token-Paar

### Profil & Übersicht

- `GET /api/mobile/v1/me` — Profil + Totalen
- `GET /api/mobile/v1/dashboard` — Statistik-Kacheln

### Spiele, Sessions, Events, Gruppen

- `GET/POST /api/mobile/v1/games` — Spiele-Liste / anlegen
- `GET/PUT/DELETE /api/mobile/v1/games/[id]` — Spiel-Detail / ändern / löschen
- `GET /api/mobile/v1/games/[id]/sessions` — Sessions zu einem Spiel
- `GET/POST /api/mobile/v1/sessions` — Sessions-Liste / anlegen
- `GET/PUT/DELETE /api/mobile/v1/sessions/[id]` — Session-Detail / ändern / löschen
- `GET/POST /api/mobile/v1/events` — Events-Liste / anlegen
- `GET /api/mobile/v1/events/[id]` — Event inkl. Vorschlägen und Terminvorschlägen
- `POST /api/mobile/v1/events/[id]/proposals` — Spiel vorschlagen
- `POST /api/mobile/v1/events/[id]/votes` — Für Spiel abstimmen
- `POST /api/mobile/v1/events/[id]/date-votes` — Termin abstimmen
- `GET/POST /api/mobile/v1/groups` — Gruppen-Liste / anlegen
- `GET/PUT/DELETE /api/mobile/v1/groups/[id]` — Gruppendetails / ändern / löschen
- `POST /api/mobile/v1/groups/[id]/join` — Gruppe beitreten (Share-Token)
- `GET/POST /api/mobile/v1/groups/[id]/polls` — Umfragen
- `GET/POST /api/mobile/v1/groups/[id]/comments` — Kommentare

### BGG, Upload, Sync, Push

- `GET /api/mobile/v1/bgg/search?q=...` — BGG-Suche
- `POST /api/mobile/v1/bgg/lookup` — EAN → BGG-Vorschlag
- `POST /api/mobile/v1/bgg/import` — Spiel aus BGG importieren
- `POST /api/mobile/v1/uploads` — Bild-Upload
- `GET /api/mobile/v1/sync` — Vollständiger Offline-Snapshot
- `POST /api/mobile/v1/devices` — Push-Device-Token registrieren
- `PushService` (`src/lib/services/push.service.ts`) sendet Benachrichtigungen
  über APNs an registrierte iOS-Geräte (Event-Einladungen, Abstimmungsende,
  Spielvorschläge, Votes, neue Sessions).

### Öffentliche Teilnahme

- `GET /api/mobile/v1/public/event/[token]` — Gast-Event-Details
- `POST /api/mobile/v1/public/event/[token]/join` — Gast beitreten
- `POST /api/mobile/v1/public/event/[token]/vote` — Gast-Abstimmung

### Sync-Endpoint

`GET /api/mobile/v1/sync` liefert alle relevanten Entitäten für den
authentifizierten Nutzer als Änderungssatz (`created/updated/deleted`), damit die
iOS-App ihren lokalen SwiftData-Speicher synchronisieren kann.

---

## 15. iOS-Companion-App

**Projekt:** `BoardGameTools/` | **Technologie:** Swift 6, SwiftUI, SwiftData, iOS 17+

Native iOS-Companion-App, die über die `/api/mobile/v1/*` REST-API mit dem Backend
kommuniziert. Unterstützt Authentifizierung, Token-Refresh, Offline-Datenhaltung
und alle Kernbereiche des Web-Frontends.

### Features (MVP)

| Bereich | Status |
|---------|--------|
| Login / Anmeldung | Anmelden per E-Mail/Passwort, Sign in with Apple vorbereitet |
| Dashboard | Statistik-Kacheln (Spiele, Sessions, Events, Gruppen) |
| Spiele | Liste, Detailansicht mit Tags/Komplexität, BGG-Import-Endpoint nutzbar |
| Sessions | Liste gespielter Partien mit Brettspiel-Thumbnail |
| Events | Liste anstehender Events mit Brettspiel-Thumbnail |
| Gruppen | Liste eigener Gruppen |
| Einstellungen | API-URL konfigurierbar, Abmelden, Name und Passwort bearbeiten |

### Architektur

- `APIClient` — zentraler HTTP-Client mit Bearer-Token, automatischem Refresh,
  multipart Upload und deutschen Fehlermeldungen.
- `AuthManager` — Anmeldestatus, Login/Logout, Sign in with Apple.
- `KeychainManager` — sichere Speicherung von Access-/Refresh-Token.
- SwiftData-Modelle für `Game`, `Session`, `Event`, `Group`, `User` und
  `SyncMetadata` (Basis für Offline-First-Sync).
- `PersistenceController` — zentraler `ModelContainer` für die gesamte App.
- `LocalDataSource` / `RemoteDataSource` — lokale SwiftData-CRUD-Operationen
  und entkoppelte API-Zugriffe.
- `SyncEngine` — abonniert `GET /api/mobile/v1/sync` und wendet
  Delta-Updates (`created/updated/deleted`) auf den lokalen Speicher an.
- `DashboardView`, `GameListView`, `GameDetailView`, `SessionListView`,
  `EventListView`, `GroupListView`, `SettingsView` nutzen SwiftData `@Query`
  und synchronisieren per Pull-to-Refresh.
- Theming: indigo/violette Farbpalette, Farbverläufe, Kachel-Karten,
  Offline-Banner, leere Zustände, Cover-Bilder per `AsyncImage`.
- `GameEditView` und `BGGSearchView`: Spiele manuell anlegen/bearbeiten/löschen
  oder direkt aus BoardGameGeek importieren.
- `SessionEditView`, `EventEditView`, `GroupEditView` plus zugehörige
  Detail-Views: Sessions, Events und Gruppen anlegen, bearbeiten und löschen.
- `BarcodeScannerView` scannt EAN/UPC-Barcodes und importiert das Spiel aus BGG.
- `CoverOCRView` erkennt Text auf Spielecovers und sucht per OCR in BGG.
- `NotificationManager` fragt Push-Berechtigungen an und registriert das Gerät-Token
  beim Backend (`POST /api/mobile/v1/devices`).
- `DeepLinkManager` verarbeitet `boardgametools://public/event/<token>`,
  `boardgametools://event/<id>` und `boardgametools://game/<id>`.
- `PublicEventView` öffnet öffentliche Event-Share-Links und erlaubt
  Mitmachen/Abstimmen als Gast.
- `NetworkMonitor` meldet Online-/Offline-Status in den Listen.

### Build & Tests

```bash
cd BoardGameTools
xcodegen generate --project .
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' build
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' test
```

---

## 16. Technische Uebersicht

### Navigation (Hauptmenue)

| # | Label | Route | Icon |
|---|-------|-------|------|
| 1 | Dashboard | `/dashboard` | LayoutDashboard |
| 2 | Spiele | `/dashboard/games` | Gamepad2 |
| 3 | Sessions | `/dashboard/sessions` | CalendarDays |
| 4 | Reihen | `/dashboard/series` | Library |
| 5 | Events | `/dashboard/events` | Vote |
| 6 | Gruppen | `/dashboard/groups` | Users |
| 7 | Statistiken | `/dashboard/statistics` | BarChart3 |
| 8 | FAQ | `/dashboard/faq` | HelpCircle |
| — | *Nutzerverwaltung* | `/dashboard/admin/users` | Shield (nur ADMIN) |
| — | *Monitoring* | `/dashboard/admin/monitoring` | Activity (nur ADMIN) |

Zusaetzlich: Profil-Link, Logout-Button, Versions-Badge → Changelog.

### Seiten nach Bereich

| Bereich | Seiten | API-Endpunkte |
|---------|--------|---------------|
| Auth | 6 | 4 |
| Dashboard | 1 | — |
| Spiele | 5 + BGG-Seite | 4 + 4 BGG + 1 Barcode + 1 Upload + 1 Tags |
| Sessions | 4 | 3 |
| Reihen | 4 | 5 |
| Events | 6 | 15 |
| Gruppen | 4 | 8 |
| Statistiken | 1 | 1 |
| Profil | 1 | 3 |
| Admin | 2 | 7 |
| Oeffentlich | 3 | 10 |
| Mobile API | — | 21 |
| Sonstige | 4 | 3 |
| **Gesamt** | **41** | **92** |

### Datenbank-Modelle (27)

| Bereich | Modelle |
|---------|---------|
| Nutzer & Auth | User, PasswordResetToken, ApiToken, PushDevice |
| Spiele | Game, Tag, GameTag, Upload |
| Sessions | GameSession, SessionPlayer, SessionRating |
| Reihen | GameSeries, GameSeriesEntry |
| Events | Event, EventInvite, GameProposal, Vote, GuestParticipant, GuestVote |
| Terminplanung | DateProposal, DateVote, GuestDateVote |
| Gruppen | Group, GroupMember, GroupPoll, GroupPollOption, GroupPollVote, GroupComment |
| System | ApiLog |

### Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Lucide Icons |
| Sprache | TypeScript (strict) |
| Datenbank | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Credentials Provider) |
| E-Mail | Nodemailer (SMTP, HTML-Templates) |
| Charts | Recharts (dynamisch geladen) |
| Barcode | html5-qrcode + Tesseract.js (OCR) |
| Logging | Pino (strukturiertes JSON) |
| Rate Limiting | @upstash/ratelimit + @upstash/redis |
| Storage | @vercel/blob (Cloud) + lokaler Fallback |
| Monitoring | @vercel/speed-insights + @vercel/analytics |
| Testing | Vitest (508 Tests), CodeceptJS + Playwright (E2E) |
| CI/CD | Husky (pre-commit: lint-staged, pre-push: Tests) |

### Zugriffsrechte

| Rolle | Zugriff |
|-------|---------|
| **Nicht angemeldet** | Landing Page, Login, Registrierung, Passwort-Reset, oeffentliche Links (/public/*), Health-Check |
| **USER** | Dashboard, Spiele, Sessions, Reihen, Events, Gruppen, Statistiken, Profil, FAQ, Changelog |
| **ADMIN** | Alles von USER + Benutzerverwaltung + Monitoring-Dashboard |
| **Gast (Link)** | Oeffentliches Event (abstimmen, vorschlagen) oder Gruppe (abstimmen, kommentieren) |

---

*Erstellt am 2026-03-24 | Version 0.40.0 | 41 Seiten, 71 API-Endpunkte, 27 Modelle, 508 Tests*
