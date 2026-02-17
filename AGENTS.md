# BoardGameTools - Agent Instructions

## Projektübersicht

BoardGameTools ist eine Next.js 14 Webanwendung zur Verwaltung von Brettspielen, Spielsessions und Events mit Voting-Funktionalität.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Sprache**: TypeScript
- **Datenbank**: SQLite + Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui Komponenten
- **Auth**: NextAuth.js v5 (beta) mit Credentials Provider
- **Testing**: Vitest (Unit), CodeceptJS + Playwright (E2E)

## Projektstruktur

```
boardgametools/
├── AGENTS.md              # Diese Datei
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
│   │   ├── ui/            # Basis-Komponenten
│   │   └── layout/        # Layout-Komponenten
│   └── lib/               # Utilities, DB, Auth
├── tests/
│   ├── unit/              # Vitest Tests
│   └── e2e/               # CodeceptJS Tests
└── package.json
```

## Verfügbare Skills

Die Skills im `skills/` Verzeichnis beschreiben detailliert wie Features funktionieren:

| Skill | Beschreibung |
|-------|-------------|
| `game-management` | Spielesammlung verwalten (CRUD, BGG-Import) |
| `session-tracking` | Spielsessions erfassen und auswerten |
| `event-voting` | Events mit Voting-System organisieren |
| `statistics` | Statistiken und Auswertungen |

**Lies den relevanten Skill bevor du an einem Feature arbeitest!**

## Entwicklungs-Workflows

### Neues Feature entwickeln

1. Lies den entsprechenden Skill in `skills/`
2. Prüfe das Datenmodell in `prisma/schema.prisma`
3. Erstelle/erweitere API Routes in `src/app/api/`
4. Erstelle UI-Komponenten und Seiten
5. Schreibe Unit Tests in `tests/unit/`
6. Schreibe E2E Tests in `tests/e2e/`

### Datenbank ändern

1. Ändere `prisma/schema.prisma`
2. Führe Migration aus: `npx prisma migrate dev --name <name>`
3. Generiere Client: `npx prisma generate`

### Tests ausführen

```bash
# Unit Tests
npm run test

# Unit Tests mit Watch
npm run test:watch

# E2E Tests (Server muss laufen)
npm run test:e2e

# E2E Tests headless
HEADLESS=true npm run test:e2e
```

## Code-Konventionen

### API Routes

- Immer Auth prüfen: `const session = await auth()`
- Fehler als JSON mit Status-Code zurückgeben
- Prisma für alle DB-Operationen verwenden

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

### Styling

- Tailwind CSS Klassen verwenden
- `cn()` Utility für bedingte Klassen
- CSS Variablen für Theming (definiert in `globals.css`)

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `src/lib/db.ts` | Prisma Client Singleton |
| `src/lib/auth.ts` | NextAuth Konfiguration |
| `src/lib/utils.ts` | Utility Funktionen |
| `prisma/schema.prisma` | Datenbank-Schema |
| `.env` | Umgebungsvariablen |

## Umgebungsvariablen

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<secret>"
```

## Häufige Aufgaben

### User erstellen (für Tests)
```typescript
import { hash } from "bcryptjs";
import prisma from "@/lib/db";

const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    passwordHash: await hash("password123", 12),
    name: "Test User",
  },
});
```

### Spiel mit Sessions laden
```typescript
const game = await prisma.game.findUnique({
  where: { id },
  include: {
    sessions: {
      include: { players: { include: { user: true } } },
      orderBy: { playedAt: "desc" },
    },
  },
});
```

### Event mit Voting-Status laden
```typescript
const event = await prisma.event.findUnique({
  where: { id },
  include: {
    invites: { include: { user: true } },
    proposals: {
      include: {
        game: true,
        _count: { select: { votes: true } },
      },
    },
  },
});
```

## Troubleshooting

### Prisma Client nicht gefunden
```bash
npx prisma generate
```

### Datenbank-Schema out of sync
```bash
npx prisma migrate dev
```

### TypeScript Fehler nach Schema-Änderung
```bash
npx prisma generate
# IDE neu starten
```

## Nächste Schritte (TODO)

- [ ] Sessions API und UI implementieren
- [ ] Events API und UI implementieren
- [ ] Groups API und UI implementieren
- [ ] Statistics API und UI implementieren
- [ ] BGG Import implementieren
- [ ] E-Mail Einladungen für Events
