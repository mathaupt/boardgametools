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

- Next.js 16 (App Router, Turbopack)
- TypeScript
- PostgreSQL + Prisma ORM
- Tailwind CSS 4 + shadcn/ui
- NextAuth.js v5 (Credentials)
- Vitest (Unit Tests)
- CodeceptJS + Playwright (E2E Tests)

## Schnellstart

```bash
# Dependencies installieren
npm install

# .env.local aus dem Beispiel erzeugen
cp .env.local.example .env.local

# Datenbank initialisieren
npx prisma migrate dev

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

### BGG Integration Setup

Für die BoardGameGeek-Integration wird ein Auth-Token benötigt:

```bash
# .env.local erstellen/konfigurieren
cp .env.local.example .env.local

# BGG Auth Token hinzufügen
BGG_AUTH_TOKEN="dein-bgg-token-hier"
```

**Test-Login:**

Erstelle einen Test-Benutzer über das Registrierungsformular unter `http://localhost:3000/register`.

Für automatisierte E2E-Tests wird der Account in `tests/e2e/bootstrap.ts` angelegt und wieder aufgeräumt.

## Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Führt `prisma migrate deploy` aus und erstellt anschließend den Produktions-Build |
| `npm run test` | Unit Tests ausführen |
| `npm run test:watch` | Unit Tests im Watch-Modus |
| `npm run test:e2e` | E2E Tests ausführen |
| `npm run db:migrate` | Datenbank-Migration |
| `npm run db:studio` | Prisma Studio öffnen |

### Pre-Commit Checks

Dieses Repo verwendet [Husky](https://typicode.github.io/husky) für einen verpflichtenden Pre-Commit-Hook. Vor jedem Commit werden automatisch Linting, Unit-Tests für geänderte Dateien, der OWASP Security-Check und der Review-Evaluator (Regressions-Check) ausgeführt. Schlägt einer der Schritte fehl, wird das Commit blockiert. Das Security-Script befindet sich unter `scripts/security-check.sh` und generiert bei jedem Lauf eine aktuelle `security-report.md` (lokal, nicht committet).

## Projektstruktur

```
boardgametools/
├── AGENTS.md              # Agent-Anweisungen für Entwicklung
├── CONCEPT.md             # Detailliertes Konzept
├── docs/                  # Projekt-Dokumentation
│   ├── DEPLOYMENT.md      # Deploy-Guide für Vercel + iOS
│   ├── bugs.md            # Bug-Tracking
│   ├── FEATURES.md        # Feature-Dokumentation
│   └── openapi.yaml       # OpenAPI/Swagger-Spezifikation
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
- **docs/DEPLOYMENT.md**: Schritt-für-Schritt-Deploy-Guide für Vercel + iOS
- **docs/FEATURES.md**: Feature-Übersicht
- **docs/openapi.yaml**: OpenAPI/Swagger-Spezifikation
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

## Deployment

Eine Schritt-für-Schritt-Anleitung für ein Live-Deployment unter Vercel — inklusive iOS-App-Verbindung — findest du in **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**.

## Lizenz

MIT
