# BoardGameTools

Eine Webanwendung zur Verwaltung von Brettspielen, Spielsessions und Events mit Voting-Funktionalität.

## Features

- **Spielesammlung**: Verwalte deine Brettspiele (CRUD, BGG-Import)
- **BGG Integration**: Spiele direkt aus BoardGameGeek importieren mit Auth-Token
- **Session Tracking**: Erfasse gespielte Partien mit Ergebnissen
- **Gruppen**: Organisiere Spieler in Gruppen
- **Event Voting**: Plane Spieleabende mit Abstimmung über das zu spielende Spiel
- **Statistiken**: Auswertungen zu Spielen und Spielern

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- SQLite + Prisma ORM
- Tailwind CSS + shadcn/ui
- NextAuth.js v5 (Credentials)
- Vitest (Unit Tests)
- CodeceptJS + Playwright (E2E Tests)

## Schnellstart

```bash
# Dependencies installieren
npm install

# Datenbank initialisieren
npx prisma migrate dev

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

### BGG Integration Setup

Für die BoardGameGeek-Integration wird ein Auth-Token benötigt:

```bash
# .env Datei erstellen/konfigurieren
cp .env.example .env

# BGG Auth Token hinzufügen
BGG_AUTH_TOKEN="dein-bgg-token-hier"
```

**Test-Login:**
- Email: `test@example.com`
- Passwort: `password123`

## Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktions-Build erstellen |
| `npm run test` | Unit Tests ausführen |
| `npm run test:watch` | Unit Tests im Watch-Modus |
| `npm run test:e2e` | E2E Tests ausführen |
| `npm run db:migrate` | Datenbank-Migration |
| `npm run db:studio` | Prisma Studio öffnen |

## Projektstruktur

```
boardgametools/
├── AGENTS.md              # Agent-Anweisungen für Entwicklung
├── CONCEPT.md             # Detailliertes Konzept
├── skills/                # AgentSkills für AI-Assistenten
├── prisma/                # Datenbank-Schema
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # React Komponenten
│   └── lib/               # Utilities
└── tests/                 # Unit & E2E Tests
```

## Dokumentation

- **AGENTS.md**: Entwicklungsanweisungen für AI-Agenten
- **CONCEPT.md**: Detailliertes Konzept mit Datenmodell
- **skills/**: Feature-spezifische Anleitungen

## API Endpoints

### BGG Integration

- `GET /api/bgg/search?q={query}` - Spiele suchen
- `GET /api/bgg/{id}` - Spiel-Details abrufen

**Authentifizierung:** Alle Endpoints erfordern eine gültige User-Session.

### Beispiele

```bash
# Spiele suchen
curl "http://localhost:3000/api/bgg/search?q=catan" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Spiel-Details
curl "http://localhost:3000/api/bgg/13" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Lizenz

MIT
