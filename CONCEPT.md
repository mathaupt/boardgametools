# BoardGameTools - Konzept

## Übersicht

BoardGameTools ist eine Next.js Webanwendung zur Verwaltung von Brettspielen, Spielsessions und Events mit Voting-Funktionalität. Die App unterstützt registrierte Nutzer sowie öffentliche Gäste-Teilnahme über Share-Links.

## Features

### 1. Brettspiel-Sammlung (CRUD)
- Spiele hinzufügen, bearbeiten, löschen
- Spieldetails: Name, Beschreibung, Min/Max Spieler, Spieldauer, Komplexität
- Bilder/Cover per URL
- Tags/Kategorien (implementiert: Tag-Modell, GameTag-Relation, /api/tags, Filter-Chips)
- BGG-ID für Integration
- EAN/Barcode für Spiel-Identifikation
- Bulk-Delete für mehrere Spiele gleichzeitig

### 2. Spielsessions/Partien tracken
- Session erstellen mit Datum, Spiel, Spielern
- Ergebnisse erfassen (Gewinner, Punkte, Platzierung)
- Notizen zur Session
- Dauer tracken

### 3. Spieler/Gruppen verwalten
- Spielerprofile (registrierte User)
- Gruppen erstellen
- Spieler zu Gruppen einladen
- Gruppen-Umfragen (Polls) mit Single-/Multiple-Choice
- Gruppen-Kommentare und Diskussionen
- Öffentliche Gruppen-Freigabe mit optionalem Passwortschutz über Share-Token

### 4. Statistiken & Auswertungen
- Meistgespielte Spiele
- Gewinnstatistiken pro Spieler
- Spielzeit-Auswertungen
- Gruppen-Statistiken

### 5. BGG (BoardGameGeek) Integration
- Spiele per BGG-ID importieren
- Daten von BGG abrufen (Name, Bild, Spieleranzahl, etc.)
- BGG-Suche nach Spielnamen
- BGG-Sammlungs-Import: Komplette BGG-Sammlung eines Nutzers importieren
- BGG-Spiele direkt in Events vorschlagen (auch ohne Sammlung)

### 6. Event-Voting System
- **Event erstellen**: Datum, Ort, Beschreibung
- **Spieler einladen**: Per E-Mail oder User-Suche, mit Einladungs-Mails
- **Spiele vorschlagen**: Eingeladene können Spiele aus der Sammlung oder per BGG-Suche vorschlagen
- **Voting**: Spieler stimmen für vorgeschlagene Spiele ab
- **Ergebnis**: Spiel mit meisten Stimmen wird ausgewählt
- **Einladungen erneut senden**: Reminder-E-Mails
- **Eigene Nachrichten**: Organizer kann individuelle Nachrichten an Teilnehmer senden

### 7. Öffentliche Events mit Gäste-Voting
- **Öffentliche Share-Links**: Events als öffentlich markieren, Share-Token generieren
- **Gäste-Teilnahme**: Nicht-registrierte Nutzer nehmen per Nickname teil
- **Gäste-Voting**: Gäste können Spiele vorschlagen und abstimmen
- **BGG-Vorschläge durch Gäste**: Gäste können Spiele direkt aus BGG vorschlagen
- **Öffentliche Einladungsantwort**: Einladungen per Token-Link annehmen/ablehnen ohne Login

### 8. Terminabstimmung (Date Polling)
- **Doodle-ähnliche Terminplanung**: Mehrere Datumsvorschläge pro Event
- **Verfügbarkeits-Abstimmung**: Ja / Vielleicht / Nein pro Termin
- **Gäste-Unterstützung**: Auch Gäste können über Termine abstimmen
- **Termin festlegen**: Organizer wählt den finalen Termin
- **Termin zurücksetzen**: Terminvorschläge können zurückgesetzt werden

### 9. Spielereihen (Game Series)
- **Reihe erstellen**: Name, Beschreibung, Cover-Bild (z.B. "EXIT - Das Spiel", "Adventure Games")
- **Spiele hinzufügen**: Aus der Sammlung oder per BGG-Import (wird automatisch zur Sammlung hinzugefügt)
- **Fortschritt tracken**: Spiele als "gespielt" markieren mit Fortschrittsbalken
- **Erweiterte Erfassung**: Spielzeit, Punkte/Score, Spieleranzahl, Erfolg (ja/nein)
- **Bewertung**: 1-5 Sterne-Bewertung nach dem Spielen
- **Schwierigkeitsgrade**: Einsteiger, Fortgeschritten, Profi als Tags
- **Reihenfolge**: Spiele in der Reihe sortierbar (Drag & Drop)
- **Eigenständiger Status**: Gespielt-Status ist unabhängig vom Session-Tracking

### 10. EAN/Barcode-Scanner
- **Kamera-basierter Barcode-Scan**: EAN/UPC-Barcodes per Smartphone-Kamera scannen
- **Manuelle EAN-Eingabe**: EAN-Nummer manuell eingeben
- **Cover-Foto OCR**: Spielname per Texterkennung (Tesseract.js) aus Fotos extrahieren
- **Automatische BGG-Suche**: Erkannter Barcode/Text wird direkt in BGG gesucht

### 11. Kalender-Export (iCal)
- **ICS-Datei-Download**: Events als `.ics`-Datei für Kalender-Apps exportieren
- **Detaillierte Beschreibung**: Spielvorschläge und Teilnehmerliste im Kalender-Eintrag

### 12. E-Mail-Benachrichtigungen
- **SMTP-basierter Versand**: Über Nodemailer mit konfigurierbarem SMTP-Server
- **Gebrandete HTML-Templates**: Einheitliches Design in deutscher Sprache
- **E-Mail-Typen**: Passwort-Zurücksetzen, Event-Einladungen, Erinnerungen, Antwort-Benachrichtigungen, individuelle Nachrichten

### 13. Passwort-Zurücksetzen
- **E-Mail-basierter Reset-Flow**: Token per E-Mail, zeitlich begrenzt
- **Sichere Token**: Gehashte Tokens in der Datenbank
- **Admin-Tool**: Passwort direkt über Admin-Panel ändern

### 14. Profil-Seite
- **Benutzerprofil**: Name, E-Mail, Registrierungsdatum
- **Kommunikationshistorie**: Übersicht über erhaltene/gesendete Einladungen

### 15. Admin-Bereich
- **Benutzerverwaltung**: Alle User anzeigen, Passwörter ändern, Accounts deaktivieren
- **Monitoring-Dashboard**: API-Logging, Statistiken, Anomalie-Erkennung
- **Rollenbasiert**: Nur Admin-User haben Zugriff

### 16. Weitere Features
- **FAQ-Seite**, **Changelog**, **Health-Check** (`/api/health`)
- **Rate-Limiting**: Redis-basiert (@upstash/ratelimit) mit In-Memory-Fallback
- **Prod-Datenbank-Backup**: Automatisiertes Backup-System (max. 10 Backups)
- **Soft-Delete**: Spiele, Sessions, Events, Gruppen, Serien werden per `deletedAt` markiert statt physisch geloescht
- **Strukturiertes Logging**: Pino JSON-Logging, API-Request-Logging in DB (ApiLog)
- **Qualitaets-Dashboard**: Admin-Monitoring-Tab mit Review-Scores, Findings, Coverage, Architektur-Diagramm, Tech-Stack
- **Zentrales Error-Messages-Modul**: Alle API-Fehlermeldungen auf Deutsch in `src/lib/error-messages.ts`
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

---

## Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| **Framework** | Next.js 16.3.0 (App Router, Turbopack dev, Webpack prod) |
| **React** | React 19.2.8 |
| **Sprache** | TypeScript 6.0.3 (strict) |
| **Datenbank** | PostgreSQL (Prisma Postgres) + Prisma 7.9.1 (`@prisma/adapter-pg` + `pg`) |
| **Styling** | Tailwind CSS 4.3.3 + `@tailwindcss/postcss` + shadcn/ui + Radix UI |
| **Icons** | Lucide React 1.30.0 |
| **Charts** | Recharts 3.10.1 |
| **Auth** | NextAuth.js v5 beta.32 (Credentials Provider) |
| **E-Mail** | Nodemailer 9.0.5 (SMTP) |
| **Barcode-Scan** | html5-qrcode 2.3.8 |
| **OCR** | Tesseract.js 7.0.0 |
| **Passwort-Hashing** | bcryptjs 3.0.3 |
| **E2E Tests** | CodeceptJS 4.1.0 + Playwright 1.62.1 |
| **Unit Tests** | Vitest 4.1.10 + @vitejs/plugin-react 6.0.2 |
| **Linting** | ESLint 9.39.5 (Flat Config) |
| **Git Hooks** | Husky 9.1.7 |
| **Logging** | Pino 10.3.1 (strukturiertes JSON-Logging) |
| **API Docs** | swagger-ui-react 5.32.12 |
| **Node-Engine** | >=22.13.1 |
| **Rate Limiting** | @upstash/ratelimit + @upstash/redis |
| **File Storage** | @vercel/blob (Cloud) + Local Fallback |
| **Performance** | @vercel/speed-insights + @vercel/analytics |

---

## Native iOS-App

Das Mobile-API-Backend für die native iOS-Companion-App (SwiftUI + SwiftData) ist
implementiert. Das Xcode-Projekt `BoardGameTools/` wurde mit XcodeGen angelegt und
baut mit Swift 6 für iOS 17+. Es enthält bereits einen lauffähigen Client mit
automatischem Build und Unit-Test-Ziel:

- `APIClient` — zentraler HTTP-Client für `/api/mobile/v1/*` mit Bearer-Token,
  automatischem Refresh, multipart-Upload und deutschen Fehlermeldungen.
- `AuthManager` & `KeychainManager` — Login/Logout, Token-Speicherung in der
  Keychain, Vorbereitung für Sign in with Apple.
- SwiftData-Modell-Grundgerüst für `Game`, `Session`, `Event`, `Group`, `User`
  und `SyncMetadata` (Basis für Offline-First-Sync).
- `PersistenceController` mit zentralem `ModelContainer`.
- `LocalDataSource` / `RemoteDataSource` für entkoppelte Daten- und API-Zugriffe.
- `SyncEngine` synchronisiert den lokalen SwiftData-Speicher über
  `GET /api/mobile/v1/sync` mit Delta-Updates.
- SwiftUI-Views (`LoginView`, `DashboardView`, `GameListView`, `GameDetailView`,
  `SessionListView`, `EventListView`, `GroupListView`, `SettingsView`) nutzen
  SwiftData `@Query` und Pull-to-Refresh.
- Theming: indigo/violette Farbpalette, Farbverläufe, Kachel-Karten,
  Offline-Banner, leere Zustände und Cover-Bilder per `AsyncImage`.
- `GameEditView`, `GameAddSheet` und `BGGSearchView` ermöglichen das manuelle
  Erstellen/Bearbeiten/Löschen sowie den Import aus BoardGameGeek.
- `SessionEditView`, `EventEditView` und `GroupEditView` mit Detail-Views
  erlauben CRUD-Operationen für Sessions, Events und Gruppen.
- `BarcodeScannerView` scannt EAN/UPC-Barcodes, führt einen BGG-Lookup durch
  und importiert das erkannte Spiel.
- `CoverOCRView` nutzt Vision-Text-Erkennung auf einem Spielecover und sucht
  den erkannten Titel per BGG-Suche.
- `NotificationManager` verwaltet Push-Benachrichtigungs-Berechtigungen,
  empfängt das APNs-Geräte-Token und sendet es an `POST /api/mobile/v1/devices`.
- `PushService` auf dem Server signiert JWTs mit dem APNs-Key und sendet
  über HTTP/2 Benachrichtigungen an iOS-Geräte bei Event-Einladungen,
  Abstimmungsende, neuen Spielvorschlägen, neuen Stimmen und neuen Sessions.
- `DeepLinkManager` parsed URLs des Custom Schemes `boardgametools://` und
  öffnet öffentliche Event-Share-Links sowie zukünftige Spiel-/Event-Deep-Links.
- `PublicEventView` zeigt ein öffentliches Event, lädt es per Share-Token und
  erlaubt das Mitmachen und Abstimmen als Gast.
- `NetworkMonitor` zeigt den Online-/Offline-Status und triggert keinen Sync,
  wenn keine Verbindung besteht.

Die versionierte REST-API `/api/mobile/v1/*` setzt auf dem bestehenden
Next.js-Backend auf und verwendet die Service-Schicht. Unterstützt werden
Bearer-Token-Authentifizierung, API-Token-Paar mit Refresh, Sync-Endpoint, CRUD
für Spiele, Sessions, Events und Gruppen, BGG-Suche/EAN-Lookup, Bild-Upload,
Push-Device-Registrierung, Sign in with Apple und Deep Links für öffentliche
Share-Links.

Das vollständige Design-Dokument befindet sich unter
`docs/superpowers/specs/2026-08-09-ios-app-design.md`.

---

## Datenbank-Schema

```
User
├── id (CUID)
├── email (unique)
├── passwordHash
├── name
├── role ("USER" | "ADMIN")
├── isActive (Boolean)
├── appleSub (unique, optional)
├── createdAt
└── updatedAt

ApiToken
├── id (CUID)
├── userId (FK User)
├── type ("access" | "refresh")
├── name
├── tokenHash (unique)
├── lastUsedAt (optional)
├── expiresAt (optional)
├── revokedAt (optional)
├── createdAt
└── user (Relation)

PushDevice
├── id (CUID)
├── userId (FK User)
├── deviceToken
├── platform
├── appVersion (optional)
├── locale (optional)
├── createdAt
└── updatedAt

Game
├── id (CUID)
├── name
├── description
├── minPlayers
├── maxPlayers
├── playTimeMinutes
├── complexity (1-5)
├── bggId (optional)
├── ean (optional, EAN/UPC-Barcode)
├── imageUrl
├── ownerId (FK User)
├── createdAt
└── updatedAt

GameSession
├── id (CUID)
├── gameId (FK Game)
├── playedAt
├── durationMinutes
├── notes
├── createdById (FK User)
└── createdAt

SessionPlayer
├── id (CUID)
├── sessionId (FK GameSession)
├── userId (FK User)
├── score
├── isWinner
└── placement

SessionRating
├── id (CUID)
├── sessionId (FK GameSession)
├── userId (FK User)
├── rating (1-5)
├── comment (optional)
└── createdAt

Group
├── id (CUID)
├── name
├── description
├── ownerId (FK User)
├── isPublic (Boolean)
├── shareToken (unique, optional)
├── password (optional, für Link-Zugang)
├── createdAt
└── updatedAt

GroupMember
├── id (CUID)
├── groupId (FK Group)
├── userId (FK User)
├── role (owner/admin/member)
└── joinedAt

GroupPoll
├── id (CUID)
├── groupId (FK Group)
├── title
├── description
├── type (single/multiple)
├── status (open/closed)
├── createdById (FK User)
├── createdAt
└── closedAt

GroupPollOption
├── id (CUID)
├── pollId (FK GroupPoll)
├── text
└── sortOrder

GroupPollVote
├── id (CUID)
├── optionId (FK GroupPollOption)
├── voterName
├── userId (FK User, optional)
└── createdAt

GroupComment
├── id (CUID)
├── groupId (FK Group)
├── pollId (FK GroupPoll, optional)
├── authorName
├── userId (FK User, optional)
├── content
└── createdAt

Event
├── id (CUID)
├── title
├── description
├── eventDate
├── location
├── status (draft/voting/closed)
├── createdById (FK User)
├── groupId (FK Group, optional)
├── selectedGameId (FK Game, optional)
├── winningProposalId (FK GameProposal, optional)
├── selectedDate (optional)
├── isPublic (Boolean)
├── shareToken (unique, optional)
├── createdAt
└── updatedAt

EventInvite
├── id (CUID)
├── eventId (FK Event)
├── userId (FK User, optional)
├── email (optional)
├── status (pending/accepted/declined)
├── invitedAt
└── respondedAt

GameProposal
├── id (CUID)
├── eventId (FK Event)
├── gameId (FK Game, optional)
├── proposedById (FK User, optional)
├── guestId (FK GuestParticipant, optional)
├── bggId, bggName, bggImageUrl (optional, inline BGG-Daten)
├── bggMinPlayers, bggMaxPlayers, bggPlayTimeMinutes
└── createdAt

Vote
├── id (CUID)
├── proposalId (FK GameProposal)
├── userId (FK User)
└── createdAt

GuestParticipant
├── id (CUID)
├── eventId (FK Event)
├── nickname (unique pro Event)
└── createdAt

GuestVote
├── id (CUID)
├── guestId (FK GuestParticipant)
├── proposalId (FK GameProposal)
└── createdAt

DateProposal
├── id (CUID)
├── eventId (FK Event)
├── date
└── createdAt

DateVote
├── id (CUID)
├── dateProposalId (FK DateProposal)
├── userId (FK User)
├── availability (yes/maybe/no)
└── createdAt

GuestDateVote
├── id (CUID)
├── dateProposalId (FK DateProposal)
├── guestId (FK GuestParticipant)
├── availability (yes/maybe/no)
└── createdAt

GameSeries
├── id (CUID)
├── name
├── description
├── imageUrl
├── ownerId (FK User)
├── createdAt
└── updatedAt

GameSeriesEntry
├── id (CUID)
├── seriesId (FK GameSeries)
├── gameId (FK Game)
├── sortOrder
├── played
├── playedAt
├── rating (1-5)
├── difficulty (einsteiger/fortgeschritten/profi)
├── playTimeMinutes
├── successful (Boolean, optional)
├── playerCount
├── score
├── createdAt
└── updatedAt

PasswordResetToken
├── id (CUID)
├── userId (FK User)
├── tokenHash (unique)
├── expiresAt
├── usedAt
└── createdAt

ApiLog
├── id (CUID)
├── method (GET/POST/PUT/DELETE/PATCH)
├── path
├── statusCode
├── durationMs
├── userId (FK User, optional)
├── userAgent
├── ip
├── errorMessage
└── createdAt
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/[...nextauth]` - NextAuth Handler
- `POST /api/auth/password-reset/request` - Passwort-Reset anfordern
- `POST /api/auth/password-reset/confirm` - Passwort-Reset bestätigen

### Games
- `GET /api/games` - Alle Spiele (mit Pagination: `?page=N&limit=N`)
- `POST /api/games` - Spiel erstellen
- `GET /api/games/[id]` - Spiel Details
- `PUT /api/games/[id]` - Spiel aktualisieren
- `DELETE /api/games/[id]` - Spiel löschen
- `POST /api/games/bulk-delete` - Mehrere Spiele löschen
- `POST /api/games/import-bgg` - Spiel aus BGG importieren

### BGG Integration
- `GET /api/bgg` - BGG-API Proxy
- `GET /api/bgg/[id]` - BGG-Spiel per ID
- `GET /api/bgg/search` - BGG-Suche
- `GET /api/bgg/collection` - BGG-Sammlungs-Import

### Barcode
- `GET /api/barcode/lookup` - EAN/Barcode-Lookup + BGG-Suche

### Sessions
- `GET /api/sessions` - Alle Sessions (mit Pagination)
- `POST /api/sessions` - Session erstellen
- `GET /api/sessions/[id]` - Session Details
- `PUT /api/sessions/[id]` - Session aktualisieren
- `DELETE /api/sessions/[id]` - Session löschen
- `GET /api/sessions/[id]/votes` - Session-Bewertungen
- `POST /api/sessions/[id]/votes` - Session bewerten

### Events
- `GET /api/events` - Meine Events (mit Pagination)
- `POST /api/events` - Event erstellen
- `GET /api/events/[id]` - Event Details
- `PUT /api/events/[id]` - Event aktualisieren
- `DELETE /api/events/[id]` - Event löschen
- `GET /api/events/[id]/invites` - Einladungen abrufen
- `POST /api/events/[id]/invites` - Spieler einladen
- `POST /api/events/[id]/invites/resend` - Einladung erneut senden
- `POST /api/events/[id]/proposals` - Spiel vorschlagen
- `POST /api/events/[id]/votes` - Abstimmen
- `POST /api/events/[id]/close` - Voting beenden
- `POST /api/events/[id]/publish` - Event veröffentlichen
- `GET /api/events/[id]/share` - Share-Link abrufen
- `POST /api/events/[id]/mail` - E-Mail an Teilnehmer
- `GET /api/events/[id]/calendar` - iCal-Export (.ics)

### Date Polling
- `GET /api/events/[id]/date-proposals` - Terminvorschläge abrufen
- `POST /api/events/[id]/date-proposals` - Terminvorschlag erstellen
- `POST /api/events/[id]/date-proposals/vote` - Über Termin abstimmen
- `POST /api/events/[id]/date-proposals/select` - Termin festlegen
- `POST /api/events/[id]/date-proposals/reset` - Termine zurücksetzen

### Public API (ohne Auth)
- `GET /api/public/event/[token]` - Öffentliches Event abrufen
- `POST /api/public/event/[token]/join` - Als Gast teilnehmen
- `POST /api/public/event/[token]/propose` - Spiel vorschlagen (Gast)
- `POST /api/public/event/[token]/propose-bgg` - BGG-Spiel vorschlagen (Gast)
- `POST /api/public/event/[token]/vote` - Abstimmen (Gast)
- `POST /api/public/event/[token]/date-vote` - Terminabstimmung (Gast)
- `GET /api/public/group/[token]` - Öffentliche Gruppe abrufen
- `POST /api/public/group/[token]/vote` - Gruppen-Poll abstimmen (Gast)
- `POST /api/public/group/[token]/comment` - Gruppen-Kommentar (Gast)
- `POST /api/public/invite/[token]/respond` - Einladung annehmen/ablehnen

### Mobile API (iOS)
- `POST /api/mobile/v1/auth/login` - Login, liefert Token-Paar
- `POST /api/mobile/v1/auth/refresh` - Token-Paar erneuern
- `POST /api/mobile/v1/auth/logout` - Token widerrufen
- `POST /api/mobile/v1/auth/logout-all` - Alle Tokens widerrufen
- `POST /api/mobile/v1/auth/apple` - Sign in with Apple
- `GET  /api/mobile/v1/me` - Profil und Totalen
- `GET  /api/mobile/v1/dashboard` - Statistik-Kacheln
- `GET  /api/mobile/v1/sync` - Offline-Snapshot
- `GET/POST /api/mobile/v1/games` - Spiele CRUD
- `GET/PUT/DELETE /api/mobile/v1/games/[id]` - Spiel-Detail
- `GET /api/mobile/v1/games/[id]/sessions` - Sessions zu einem Spiel
- `GET/POST /api/mobile/v1/sessions` - Sessions CRUD
- `GET/PUT/DELETE /api/mobile/v1/sessions/[id]` - Session-Detail
- `GET/POST /api/mobile/v1/events` - Events CRUD
- `GET/PUT/DELETE /api/mobile/v1/events/[id]` - Event-Detail
- `POST /api/mobile/v1/events/[id]/close` - Voting schliessen
- `GET/POST /api/mobile/v1/events/[id]/proposals` - Vorschlaege
- `POST /api/mobile/v1/events/[id]/votes` - Fuer Spiel abstimmen
- `GET/POST /api/mobile/v1/events/[id]/date-proposals` - Terminvorschlaege
- `POST /api/mobile/v1/events/[id]/date-proposals/vote` - Termin abstimmen
- `GET/POST /api/mobile/v1/groups` - Gruppen CRUD
- `GET/PUT/DELETE /api/mobile/v1/groups/[id]` - Gruppen-Detail
- `POST /api/mobile/v1/groups/[id]/join` - Gruppe beitreten
- `GET/POST /api/mobile/v1/groups/[id]/polls` - Gruppen-Umfragen
- `POST /api/mobile/v1/groups/[id]/polls/[pollId]/vote` - Umfrage-Option waehlen
- `GET/POST /api/mobile/v1/groups/[id]/comments` - Gruppen-Kommentare
- `GET /api/mobile/v1/bgg/search` - BGG-Suche
- `POST /api/mobile/v1/bgg/lookup` - EAN/UPC-Lookup via BGG
- `POST /api/mobile/v1/bgg/import` - Spiel aus BGG importieren
- `POST /api/mobile/v1/uploads` - Bild-Upload
- `POST /api/mobile/v1/devices` - Push-Device-Token registrieren
- `GET /api/mobile/v1/public/event/[token]` - Oeffentliches Event (Gast)
- `POST /api/mobile/v1/public/event/[token]/join` - Als Gast teilnehmen
- `POST /api/mobile/v1/public/event/[token]/vote` - Gast-Abstimmung

### Groups
- `GET /api/groups` - Alle Gruppen
- `POST /api/groups` - Gruppe erstellen
- `GET /api/groups/[id]` - Gruppe Details
- `PUT /api/groups/[id]` - Gruppe aktualisieren
- `DELETE /api/groups/[id]` - Gruppe löschen
- `POST /api/groups/[id]/publish` - Gruppe veröffentlichen
- `GET /api/groups/[id]/members` - Mitglieder
- `POST /api/groups/[id]/members` - Mitglied hinzufügen
- `GET /api/groups/[id]/polls` - Umfragen
- `POST /api/groups/[id]/polls` - Umfrage erstellen
- `GET /api/groups/[id]/polls/[pollId]` - Umfrage Details
- `PUT /api/groups/[id]/polls/[pollId]` - Umfrage schließen
- `POST /api/groups/[id]/polls/[pollId]/vote` - Abstimmen
- `GET /api/groups/[id]/comments` - Kommentare
- `POST /api/groups/[id]/comments` - Kommentar erstellen

### Series (Spielereihen)
- `GET /api/series` - Alle Reihen
- `POST /api/series` - Reihe erstellen
- `GET /api/series/[id]` - Reihe Details
- `PUT /api/series/[id]` - Reihe aktualisieren
- `DELETE /api/series/[id]` - Reihe löschen
- `POST /api/series/[id]/entries` - Spiel zur Reihe hinzufügen
- `PUT /api/series/[id]/entries/[entryId]` - Entry aktualisieren
- `DELETE /api/series/[id]/entries/[entryId]` - Entry entfernen
- `PUT /api/series/[id]/entries/reorder` - Reihenfolge ändern

### Users
- `GET /api/users` - Alle User
- `GET /api/users/me` - Eigenes Profil
- `PUT /api/users/me` - Profil aktualisieren
- `GET /api/users/shareable` - Teilbare User-Liste

### Admin
- `GET /api/admin/users` - Alle User verwalten
- `POST /api/admin/users/change-password` - Passwort ändern
- `POST /api/admin/users/deactivate` - Account deaktivieren
- `GET /api/admin/monitoring/logs` - API-Logs
- `GET /api/admin/monitoring/stats` - Monitoring-Statistiken
- `GET /api/admin/monitoring/anomalies` - Anomalie-Erkennung

### System
- `GET /api/health` - Health-Check
- `POST /api/db/init` - Datenbank initialisieren
- `GET /api/statistics` - Übersicht, meistgespielte Spiele, Spieler-Stats, monatliche Aktivität

---

## Agent Skills

### 1. game-management
Hilft beim Verwalten der Spielesammlung (CRUD, BGG-Import, Barcode-Scan).

### 2. session-tracking
Anleitung zum Erfassen und Auswerten von Spielsessions.

### 3. event-voting
Workflow für Event-Erstellung, Einladungen, Voting, Terminabstimmung und öffentliche Events.

### 4. game-series
Spielereihen verwalten, Fortschritt tracken und bewerten (inkl. Spielzeit, Score, Erfolg).

### 5. statistics
Erklärt verfügbare Statistiken und deren Interpretation.

### 6. accessibility
Verbindliche Regeln für Farbkontrast, Schriftgrößen und Fokuszustände.

### 7. code-review
Senior Dev Code Reviewer – Prüft Code-Qualität, Architektur, Sicherheit und Konzept-Konformität.

---

## Status

1. ✅ Konzept erstellen
2. ✅ Next.js Projekt initialisieren (Next.js 16)
3. ✅ Prisma + PostgreSQL Setup
4. ✅ Auth implementieren (NextAuth v5 + Passwort-Reset)
5. ✅ Test-Infrastruktur aufsetzen (Vitest + CodeceptJS)
6. ✅ Skills erstellen
7. ✅ Core Features implementieren
8. ✅ Event-Voting mit Gäste-Unterstützung
9. ✅ Terminabstimmung (Date Polling)
10. ✅ Spielereihen mit erweitertem Tracking
11. ✅ E-Mail-Benachrichtigungen
12. ✅ EAN/Barcode-Scanner + Cover-OCR
13. ✅ Kalender-Export (iCal)
14. ✅ Gruppen-Polls & Kommentare
15. ✅ Öffentliche Gruppen-Freigabe
16. ✅ BGG-Sammlungs-Import
17. ✅ Admin-Monitoring-Dashboard
18. ✅ Prod-Datenbank-Backup-System
19. ✅ Profil-Seite
20. ✅ FAQ & Changelog
