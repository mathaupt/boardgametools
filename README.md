# BoardGameTools

Version: 0.44.0

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

Der Test-Benutzer muss zuerst erstellt werden (via Registrierungsformular):

```bash
# Option 1: Registrierungsformular im Browser öffnen
# Öffne http://localhost:3000/register und registriere dich mit:
# Email: test@example.com
# Passwort: password123
# Name: Test User

# Option 2: npm script für Hinweise
npm run db:seed:test-user
```

Danach kann man sich einloggen mit:
- Email: `test@example.com`
- Passwort: `password123`

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
| `npm run db:seed:test-user` | Zeigt Hinweise zur Test-Benutzer Erstellung |

### Pre-Commit Checks

Dieses Repo verwendet [Husky](https://typicode.github.io/husky) für einen verpflichtenden Pre-Commit-Hook. Vor jedem Commit werden automatisch

1. `npm run test` – komplette Vitest-Suite
2. `npm run security-check` – OWASP Top 10 Heuristiken inkl. `npm audit`

ausgeführt. Schlägt einer der Schritte fehl, wird das Commit blockiert. Das Security-Script befindet sich unter `scripts/security-check.sh` und generiert bei jedem Lauf eine aktuelle `security-report.md`.

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

## Deployment

### 📦 IONOS Deployment

Eine detaillierte Deployment-Anleitung für IONOS Hosting findest du in **[DEPLOYMENT_IONOS.md](./DEPLOYMENT_IONOS.md)**.

Die Anleitung deckt ab:
- Docker Deployment (empfohlen)
- Manuelleses Node.js Deployment
- SSL-Konfiguration mit Let's Encrypt
- PM2 Prozess-Management
- Backup-Strategien
- Monitoring & Fehlerbehebung

### 🚀 Schnell-Deployment (Docker)

```bash
# 1. Repository klonen
git clone https://github.com/mathaupt/boardgametools.git
cd boardgametools

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env.production
# .env.production mit deinen Werten bearbeiten

# 3. Docker starten
docker-compose up -d --build

# 4. Datenbank initialisieren
docker-compose exec app npx prisma migrate deploy
```

### ▲ Vercel Deployment

Vercel führt bei jedem Build automatisch die Prisma-Migrationen aus, bevor `next build` läuft. Voraussetzung:

1. `DATABASE_URL` (und ggf. `SHADOW_DATABASE_URL`) im Vercel-Projekt setzen.
2. Keine individuellen Build-Befehle notwendig – dank `package.json` ruft `npm run build` zuerst das Helper-Script `npm run prisma:deploy` auf. Dieses versucht `prisma migrate deploy` und fällt, falls P3005 (nicht-leere DB) auftritt, automatisch auf `prisma db push` zurück.
3. Bei Redeploy werden so ausstehende Migrationen auf die Produktions-Datenbank angewandt bzw. das Schema synchronisiert, danach folgt automatisch das Next.js-Build.

Damit bleiben Prisma-Schema und Produktions-Datenbank immer synchron.

## Lizenz

MIT
