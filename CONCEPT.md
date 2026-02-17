# BoardGameTools - Konzept

## Übersicht

BoardGameTools ist eine Next.js Webanwendung zur Verwaltung von Brettspielen, Spielsessions und Events mit Voting-Funktionalität.

## Features

### 1. Brettspiel-Sammlung (CRUD)
- Spiele hinzufügen, bearbeiten, löschen
- Spieldetails: Name, Beschreibung, Min/Max Spieler, Spieldauer, Komplexität
- Bilder/Cover hochladen
- Tags/Kategorien
- BGG-ID für Integration

### 2. Spielsessions/Partien tracken
- Session erstellen mit Datum, Spiel, Spielern
- Ergebnisse erfassen (Gewinner, Punkte)
- Notizen zur Session
- Dauer tracken

### 3. Spieler/Gruppen verwalten
- Spielerprofile (registrierte User)
- Gruppen erstellen
- Spieler zu Gruppen einladen

### 4. Statistiken & Auswertungen
- Meistgespielte Spiele
- Gewinnstatistiken pro Spieler
- Spielzeit-Auswertungen
- Gruppen-Statistiken

### 5. BGG (BoardGameGeek) Integration
- Spiele per BGG-ID importieren
- Daten von BGG abrufen (Name, Bild, Spieleranzahl, etc.)

### 6. Event-Voting System
- **Event erstellen**: Datum, Ort, Beschreibung
- **Spieler einladen**: Nur eingeladene sehen das Event
- **Spiele vorschlagen**: Eingeladene können Spiele aus der Sammlung vorschlagen
- **Voting**: Spieler stimmen für vorgeschlagene Spiele ab
- **Ergebnis**: Spiel mit meisten Stimmen wird ausgewählt

---

## Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Sprache** | TypeScript |
| **Datenbank** | SQLite + Prisma ORM |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Icons** | Lucide React |
| **Auth** | NextAuth.js (Credentials Provider) |
| **E2E Tests** | CodeceptJS + Playwright |
| **Unit Tests** | Vitest |
| **Skills** | AgentSkills.io Format |

---

## Datenbank-Schema

```
User
├── id (UUID)
├── email (unique)
├── passwordHash
├── name
├── createdAt
└── updatedAt

Game
├── id (UUID)
├── name
├── description
├── minPlayers
├── maxPlayers
├── playTimeMinutes
├── complexity (1-5)
├── bggId (optional)
├── imageUrl
├── ownerId (FK User)
├── createdAt
└── updatedAt

GameSession
├── id (UUID)
├── gameId (FK Game)
├── playedAt
├── durationMinutes
├── notes
├── createdById (FK User)
└── createdAt

SessionPlayer
├── id (UUID)
├── sessionId (FK GameSession)
├── userId (FK User)
├── score
├── isWinner
└── placement

Group
├── id (UUID)
├── name
├── description
├── ownerId (FK User)
├── createdAt
└── updatedAt

GroupMember
├── id (UUID)
├── groupId (FK Group)
├── userId (FK User)
├── role (owner/admin/member)
└── joinedAt

Event
├── id (UUID)
├── title
├── description
├── eventDate
├── location
├── status (draft/voting/closed)
├── createdById (FK User)
├── groupId (FK Group, optional)
├── selectedGameId (FK Game, optional)
├── createdAt
└── updatedAt

EventInvite
├── id (UUID)
├── eventId (FK Event)
├── userId (FK User)
├── status (pending/accepted/declined)
├── invitedAt
└── respondedAt

GameProposal
├── id (UUID)
├── eventId (FK Event)
├── gameId (FK Game)
├── proposedById (FK User)
├── createdAt

Vote
├── id (UUID)
├── proposalId (FK GameProposal)
├── userId (FK User)
├── createdAt
```

---

## Projektstruktur

```
boardgametools/
├── AGENTS.md                    # Agent-Entwicklungsanweisungen
├── CONCEPT.md                   # Dieses Dokument
├── README.md                    # Projekt-Dokumentation
│
├── skills/                      # AgentSkills für AI-Assistenten
│   ├── game-management/
│   │   └── SKILL.md
│   ├── session-tracking/
│   │   └── SKILL.md
│   ├── event-voting/
│   │   └── SKILL.md
│   └── statistics/
│       └── SKILL.md
│
├── prisma/
│   ├── schema.prisma            # Datenbank-Schema
│   └── seed.ts                  # Seed-Daten
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Auth-Routen (login, register)
│   │   ├── (dashboard)/         # Geschützte Routen
│   │   │   ├── games/
│   │   │   ├── sessions/
│   │   │   ├── events/
│   │   │   ├── groups/
│   │   │   └── statistics/
│   │   ├── api/                 # API Routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui Komponenten
│   │   └── features/            # Feature-spezifische Komponenten
│   │
│   ├── lib/
│   │   ├── db.ts                # Prisma Client
│   │   ├── auth.ts              # Auth Konfiguration
│   │   └── utils.ts             # Hilfsfunktionen
│   │
│   └── types/
│       └── index.ts             # TypeScript Types
│
├── tests/
│   ├── e2e/                     # CodeceptJS E2E Tests
│   │   ├── codecept.conf.ts
│   │   ├── auth.test.ts
│   │   ├── games.test.ts
│   │   └── events.test.ts
│   │
│   └── unit/                    # Vitest Unit Tests
│       ├── vitest.config.ts
│       └── lib/
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── .env.example
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/[...nextauth]` - NextAuth Handler

### Games
- `GET /api/games` - Alle Spiele
- `POST /api/games` - Spiel erstellen
- `GET /api/games/[id]` - Spiel Details
- `PUT /api/games/[id]` - Spiel aktualisieren
- `DELETE /api/games/[id]` - Spiel löschen
- `GET /api/games/bgg/[bggId]` - BGG Import

### Sessions
- `GET /api/sessions` - Alle Sessions
- `POST /api/sessions` - Session erstellen
- `GET /api/sessions/[id]` - Session Details

### Events
- `GET /api/events` - Meine Events
- `POST /api/events` - Event erstellen
- `GET /api/events/[id]` - Event Details
- `POST /api/events/[id]/invite` - Spieler einladen
- `POST /api/events/[id]/propose` - Spiel vorschlagen
- `POST /api/events/[id]/vote` - Abstimmen
- `POST /api/events/[id]/close` - Voting beenden

### Statistics
- `GET /api/statistics/games` - Spiel-Statistiken
- `GET /api/statistics/players` - Spieler-Statistiken

---

## Agent Skills

### 1. game-management
Hilft beim Verwalten der Spielesammlung (CRUD, BGG-Import).

### 2. session-tracking
Anleitung zum Erfassen und Auswerten von Spielsessions.

### 3. event-voting
Workflow für Event-Erstellung, Einladungen und Voting.

### 4. statistics
Erklärt verfügbare Statistiken und deren Interpretation.

---

## Nächste Schritte

1. ✅ Konzept erstellen
2. ⏳ Next.js Projekt initialisieren
3. ⏳ Prisma + SQLite Setup
4. ⏳ Auth implementieren
5. ⏳ Test-Infrastruktur aufsetzen
6. ⏳ Skills erstellen
7. ⏳ Core Features implementieren
