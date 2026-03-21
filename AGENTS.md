# BoardGameTools - Agent Instructions

## Projektübersicht

BoardGameTools ist eine Next.js 16 Webanwendung zur Verwaltung von Brettspielen, Spielsessions, Events mit Voting-Funktionalität, Gruppen und Spielereihen.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Sprache**: TypeScript (strict)
- **Datenbank**: PostgreSQL (Prisma Postgres) + Prisma ORM
- **Styling**: Tailwind CSS 4 + shadcn/ui Komponenten
- **Auth**: NextAuth.js v5 (beta) mit Credentials Provider
- **Testing**: Vitest (Unit), CodeceptJS + Playwright (E2E)
- **CI/Hooks**: Husky (pre-commit: Tests + Security + Review, pre-push: DB-Backup)

## PFLICHT-Regeln

### 1. Changelog-Pflicht (KRITISCH!)

**Bei JEDER Änderung muss ein Changelog-Eintrag geschrieben werden!**

- Datei: `src/lib/changelog.ts`
- Neue Version als erstes Element im `changelog`-Array einfügen
- Typen: `feature`, `fix`, `improvement`, `internal`
- Deutsch schreiben, verständlich für Endnutzer
- Auch bei reinen Refactorings oder internen Änderungen (als `internal`)

```typescript
{
  version: "X.Y.Z",
  date: "YYYY-MM-DD",
  title: "Kurztitel",
  description: "Was wurde gemacht und warum.",
  changes: [
    { type: "feature", text: "Beschreibung für Endnutzer" },
    { type: "fix", text: "Was wurde gefixt" },
    { type: "internal", text: "Interne Änderung" },
  ],
}
```

### 2. Review-Workflow nach jeder Umsetzung

1. Änderungen committen
2. `npm run review-evaluate` ausführen
3. Ergebnis in `skills/code-review/SKILL.md` prüfen
4. Behobene Findings mit ~~Strikethrough~~ ✅ markieren
5. Score-Entwicklung verfolgen – Ziel: steigend!

### 3. Prisma-Queries: NIEMALS `user: true` oder `createdBy: true`

```typescript
// VERBOTEN – leakt passwordHash:
include: { user: true }
include: { createdBy: true }

// RICHTIG:
include: { user: { select: { id: true, name: true, email: true } } }
include: { createdBy: { select: { id: true, name: true, email: true } } }
```

### 4. Komponenten-Größe

- Maximum ~300 Zeilen pro Datei
- Große Komponenten in Subkomponenten aufteilen
- Shared State über Props oder Context weitergeben

## Projektstruktur

```
boardgametools/
├── AGENTS.md              # Diese Datei (IMMER aktuell halten!)
├── CONCEPT.md             # Detailliertes Konzept
├── skills/                # AgentSkills (siehe unten)
├── prisma/
│   └── schema.prisma      # Datenbank-Schema
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Login, Register
│   │   ├── (dashboard)/   # Geschützte Routen
│   │   └── api/           # API Routes
│   ├── components/
│   │   ├── ui/            # shadcn/ui Basis-Komponenten
│   │   ├── layout/        # Layout-Komponenten
│   │   └── public-event/  # Public Event Subkomponenten
│   └── lib/               # Utilities, DB, Auth, Validation
├── scripts/               # Build/Deploy/Backup-Scripts
├── tests/
│   ├── unit/              # Vitest Tests
│   └── e2e/               # CodeceptJS Tests
└── package.json
```

## Verfügbare Skills

| Skill | Beschreibung |
|-------|-------------|
| `game-management` | Spielesammlung verwalten (CRUD, BGG-Import) |
| `session-tracking` | Spielsessions erfassen und auswerten |
| `event-voting` | Events mit Voting-System organisieren |
| `game-series` | Spielereihen (EXIT, Adventure Games, etc.) tracken |
| `statistics` | Statistiken und Auswertungen |
| `accessibility` | Verbindliche Regeln für Farbkontrast, Schriftgrößen und Fokuszustände |
| `code-review` | Senior Dev Code Reviewer – Prüft Code-Qualität, Architektur, Sicherheit und Konzept-Konformität |

**Lies den relevanten Skill bevor du an einem Feature arbeitest!**

## Entwicklungs-Workflows

### Neues Feature entwickeln

1. Lies den entsprechenden Skill in `skills/`
2. Prüfe das Datenmodell in `prisma/schema.prisma`
3. Erstelle/erweitere API Routes in `src/app/api/`
4. Erstelle UI-Komponenten und Seiten
5. Schreibe Unit Tests in `tests/unit/`
6. **Changelog-Eintrag schreiben** in `src/lib/changelog.ts`
7. Commit + Review-Evaluator prüfen

### Datenbank ändern

1. Ändere `prisma/schema.prisma`
2. Führe Migration aus: `npx prisma migrate dev --name <name>`
3. Generiere Client: `npx prisma generate`

### Tests ausführen

```bash
npm run test              # Unit Tests
npm run test:watch        # Unit Tests mit Watch
npm run test:e2e          # E2E Tests (Server muss laufen)
HEADLESS=true npm run test:e2e  # E2E Tests headless
```

### Review & Qualitätssicherung

```bash
npm run review-evaluate          # Bewertet Findings, aktualisiert SKILL.md
npm run review-evaluate:report   # Nur Report (ohne SKILL.md Update)
npm run review-evaluate:json     # JSON-Output (für CI/CD)
npm run review-evaluate:strict   # Exit 1 bei Score < 5/10
npm run security-check           # OWASP Security Check
npm run backup:prod              # Manuelles Prod-DB-Backup
```

**Pre-Commit Hook**: Unit Tests → Security Check → Review Evaluator
**Pre-Push Hook**: Prod-DB-Backup (automatisch)

## Code-Konventionen

### API Routes

- Immer Auth prüfen: `const session = await auth()`
- Fehler als JSON: `{ error: string }` mit passendem HTTP-Status
- Input-Validierung mit `src/lib/validation.ts`
- **NIEMALS** `include: { user: true }` – immer mit `select`!
- Prisma für alle DB-Operationen

```typescript
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

### Komponenten

- Server Components als Default
- `"use client"` nur wenn nötig (Interaktivität, Hooks)
- shadcn/ui Komponenten aus `@/components/ui/` verwenden
- Lucide Icons für Icons
- Max ~300 Zeilen – danach aufteilen!

### Styling

- Tailwind CSS Klassen verwenden
- `cn()` Utility für bedingte Klassen
- CSS Variablen für Theming (definiert in `globals.css`)
- **Accessibility first**: WCAG AA Kontrast (4.5:1), Fokuszustände, Touch-Targets >44px

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `src/lib/db.ts` | Prisma Client Singleton |
| `src/lib/auth.ts` | NextAuth Konfiguration |
| `src/lib/utils.ts` | Utility Funktionen |
| `src/lib/validation.ts` | Input-Validierung |
| `src/lib/rate-limit.ts` | Rate Limiting |
| `src/lib/changelog.ts` | **Changelog (PFLICHT bei jeder Änderung!)** |
| `prisma/schema.prisma` | Datenbank-Schema |
| `.env` | Lokale Umgebungsvariablen |
| `.env.prod` | Prod-DB-Credentials (NIEMALS committen!) |

## Umgebungsvariablen

```env
SQL_DATABASE_URL="postgres://..."      # PostgreSQL Connection
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<secret>"
```

## Troubleshooting

```bash
npx prisma generate          # Prisma Client nicht gefunden
npx prisma migrate dev       # Schema out of sync
npm run backup:prod          # Manuelles DB-Backup
```
