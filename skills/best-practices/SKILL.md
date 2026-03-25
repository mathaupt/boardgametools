---
name: best-practices
description: Best Practices und Standards-Konformitaet – Definiert verbindliche Coding-Standards, Architektur-Regeln und Qualitaetskriterien fuer das BoardGameTools-Projekt. Nutze diesen Skill zur Orientierung bei Implementierung, Code-Reviews und Qualitaetssicherung.
metadata:
  author: BoardGameTools Team
  version: "1.0"
---

# Best Practices und Standards-Konformitaet

> Dieses Dokument definiert die verbindlichen Coding-Standards, Architektur-Regeln und
> Qualitaetskriterien fuer das BoardGameTools-Projekt. Jede Aenderung am Code MUSS
> diesen Regeln entsprechen. Abweichungen sind nur mit dokumentierter Begruendung zulaessig.

## Wann diesen Skill verwenden

- Bei der Implementierung neuer Features oder Komponenten
- Vor und waehrend Code-Reviews
- Beim Refactoring bestehender Module
- Zur Orientierung bei Architektur-Entscheidungen
- Fuer die Bewertung der Code-Qualitaet (Evaluator)
- Bei der Einarbeitung neuer Entwickler

---

## 1. Grundsaetze

### Clean Code

| Prinzip | Beschreibung | Konsequenz im Projekt |
|---------|-------------|----------------------|
| **DRY** | Keine Code-Duplikation ueber Dateien hinweg | Shared Queries in `src/lib/queries/`, Shared Utilities in `src/lib/` |
| **KISS** | Einfachste Loesung bevorzugen | Keine uebertriebene Abstraktion |
| **YAGNI** | Nur implementieren was gebraucht wird | Keine spekulativen Features |
| **SoC** | UI / Logik / Daten trennen | Geschaeftslogik in `src/lib/`, nicht in Komponenten |
| **Fail Fast** | Fehler frueh erkennen und melden | ENV-Validierung beim Start, strikte Input-Validierung |

### Benennungskonventionen

| Element | Konvention | Beispiel |
|---------|-----------|---------|
| Dateien | kebab-case | `game-management.ts` |
| Komponenten | PascalCase | `GameCard`, `EventList` |
| Funktionen / Variablen | camelCase | `getGameById`, `isLoading` |
| Konstanten | UPPER_SNAKE_CASE | `MAX_PLAYERS` |
| TypeScript-Interfaces | PascalCase ohne Prefix | `GameProps` (nicht `IGameProps`) |
| CSS-Klassen | Tailwind-Klassen | `cn("flex items-center gap-2")` |

### Verboten

- Magic Numbers ohne benannte Konstante
- `console.log` in Produktionscode (stattdessen `logger` aus `src/lib/logger.ts`)
- Auskommentierter Code im Repository
- `// TODO`-Kommentare ohne zugehoeriges Ticket/Issue
- Inline-Styles (stattdessen Tailwind-Klassen)

---

## 2. TypeScript-Standards

### Strict Mode

Das Projekt verwendet `"strict": true` in `tsconfig.json`.

### Typregeln

| Regel | Erlaubt | Verboten |
|-------|---------|----------|
| `any` | Niemals | `const data: any = ...` |
| `unknown` | Fuer unbekannte Typen | -- |
| Prisma-generierte Typen | Bevorzugt | Manuelle Interfaces fuer DB-Entities |
| Type Assertions (`as`) | Nur wenn unvermeidbar, mit Kommentar | Blindes `as any` |

### Nullish Coalescing statt Falsy-Checks

```typescript
// RICHTIG
const score = player.score ?? null;    // 0 bleibt 0

// FALSCH
const score = player.score || null;    // 0 wird zu null!
```

---

## 3. Next.js Konventionen

### App Router Grundregeln

| Regel | Details |
|-------|---------|
| Server Components als Standard | Jede Komponente ist Server Component, sofern nicht anders markiert |
| `"use client"` nur bei Bedarf | Nur bei Hooks, Event-Handlern, Browser-APIs |
| Geschaeftslogik serverseitig | Datenbankzugriffe, Auth-Pruefungen immer in Server Components oder API Routes |

### Datei-Konventionen im App Router

| Datei | Zweck | Pflicht |
|-------|-------|---------|
| `page.tsx` | Seitenkomponente | Pro Route |
| `layout.tsx` | Shared Layout | Pro Route-Gruppe |
| `loading.tsx` | Suspense-Fallback | Pro Route-Segment (13 vorhanden) |
| `error.tsx` | Error Boundary | Pro Route-Segment (10 vorhanden) |
| `route.ts` | API Route Handler | Fuer API-Endpoints |

### Route Handler Pattern

```typescript
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const nameError = validateString(body.name, "Name", { required: true, max: 200 });
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: { name: body.name.trim(), ownerId: session.user.id },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    logger.error({ err: error, route: "POST /api/games" }, "Fehler beim Erstellen");
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
```

---

## 4. Komponenten-Richtlinien

### Groessenbeschraenkung

| Regel | Wert |
|-------|------|
| Max. Zeilenanzahl pro Komponente | **300 Zeilen** |
| Max. Zeilenanzahl pro Datei | **400 Zeilen** |
| Max. Props-Anzahl | **7 Props** |

### Wann aufteilen?

- Mehr als 300 Zeilen
- Mehr als 3 Verantwortlichkeiten
- Teile sind wiederverwendbar
- Mehr als 5 useState-Hooks

### cn()-Utility

```typescript
import { cn } from "@/lib/utils";

<Button className={cn("w-full justify-start", isActive && "font-bold")}>
```

---

## 5. API-Design

### Konsistentes Error-Format

```typescript
NextResponse.json({ error: "Beschreibung des Fehlers" }, { status: 400 });
```

### HTTP Status Codes

| Code | Bedeutung | Wann verwenden |
|------|-----------|----------------|
| `200` | OK | Erfolgreiche GET, PUT, PATCH, DELETE |
| `201` | Created | Erfolgreiche POST |
| `400` | Bad Request | Ungueltige Eingabedaten |
| `401` | Unauthorized | Nicht authentifiziert |
| `403` | Forbidden | Keine Berechtigung |
| `404` | Not Found | Ressource existiert nicht |
| `429` | Too Many Requests | Rate Limit ueberschritten |
| `500` | Internal Server Error | Unerwarteter Fehler |

### Pagination

Alle Listen-Endpoints MUESSEN Pagination unterstuetzen.

---

## 6. Code-Organisation

### Import-Reihenfolge

```typescript
// 1. React / Next.js
// 2. Externe Bibliotheken
// 3. Interne Bibliotheken (src/lib/)
// 4. Komponenten (src/components/)
// 5. Typen
```

### Shared Queries

Sobald eine Prisma-Query an 2+ Stellen identisch verwendet wird, muss sie in `src/lib/queries/` extrahiert werden.

---

## 7. Fehlerbehandlung

### Drei-Schichten-Modell

| Schicht | Mechanismus |
|---------|-------------|
| UI | Error Boundaries (`error.tsx`) |
| API | try/catch in Route Handlern |
| System | ENV-Validierung, DB-Connection-Check |

### Strukturiertes Logging

```typescript
import { logger } from "@/lib/logger";
logger.error({ err: error, route: "POST /api/games", userId }, "Spiel konnte nicht erstellt werden");
```

**Regeln:**
- Keine PII in Logs
- Strukturiert statt String-Concat
- Error-Objekte immer als `err`
- Kein `console.log` in Produktionscode

---

## 8. Dependency-Management

| Regel | Beschreibung |
|-------|-------------|
| Minimale Dependencies | Nur installieren was gebraucht wird |
| Regelmaessige Audits | `npm audit` vor jedem Release |
| Keine Beta in Prod | Ausnahme: NextAuth v5 |
| Lock-File | `package-lock.json` immer committen |

---

## 9. Git-Konventionen

### Commit-Nachrichten

Format: `<typ>(<scope>): <beschreibung>`

| Typ | Verwendung |
|-----|-----------|
| `feat` | Neues Feature |
| `fix` | Bugfix |
| `refactor` | Code-Umstrukturierung |
| `docs` | Dokumentation |
| `test` | Tests |
| `chore` | Build-Prozess, Dependencies |
| `security` | Sicherheitsfixes |

### Pre-Commit Hooks (Husky)

```bash
npm run test                          # Unit Tests
npm run security-check                # OWASP Security Check
npm run review-evaluate:regression    # Review Evaluator
```

### Changelog-Pflicht

Jede nutzersichtbare Aenderung MUSS einen Changelog-Eintrag in `src/lib/changelog.ts` erhalten.

---

## 10. Bewertungsprozess

Der Review Evaluator bewertet die Code-Qualitaet in 10 Kategorien:

| Kategorie | Pruefgegenstand |
|-----------|----------------|
| Sicherheit | Auth, Input-Validierung, Rate Limiting |
| TypeScript | Strict Mode, keine `any` |
| Architektur | Server/Client Components, Komponentengroesse |
| Performance | Dynamic Imports, Pagination, Caching |
| API Design | Error-Format, Status Codes |
| Testing | Unit Tests, Coverage |
| Datenbank | Indices, Relations |
| Konzept-Konformitaet | CONCEPT.md Abgleich |
| Best Practices | ESLint, Error Boundaries |
| Skalierung | Connection Pooling, Logging |

---

## 11. Checkliste fuer Code-Reviews

### Allgemeine Qualitaet

- [ ] Keine Magic Numbers
- [ ] Keine Code-Duplikation (DRY)
- [ ] Keine auskommentierten Code-Bloecke
- [ ] Keine `console.log`-Aufrufe
- [ ] Dateien unter 400 Zeilen, Komponenten unter 300 Zeilen

### TypeScript

- [ ] Keine `any`-Types
- [ ] Exportierte Funktionen haben explizite Return-Typen
- [ ] `??` statt `||` fuer Nullish-Checks

### Next.js / React

- [ ] Server Components als Standard
- [ ] `"use client"` nur bei Hooks/Event-Handlern/Browser-APIs
- [ ] Error Boundary fuer neue Route-Segmente
- [ ] Loading State fuer neue Route-Segmente

### API Routes

- [ ] Auth-Check als erste Aktion
- [ ] Input-Validierung mit `src/lib/validation.ts`
- [ ] Konsistentes Error-Format: `{ error: string }`
- [ ] Korrekte HTTP Status Codes (401 vs. 403)
- [ ] try/catch mit strukturiertem Logging
- [ ] Pagination auf Listen-Endpoints

### Datenbank / Prisma

- [ ] `select` statt `include` (kein passwordHash-Leak)
- [ ] Indices auf neue Foreign Keys
- [ ] `$transaction` fuer zusammengehoerige Schreiboperationen

### Sicherheit

- [ ] Keine Secrets in Code oder Commits
- [ ] Neue ENV-Variablen in `src/lib/env.ts` registriert
- [ ] Rate Limiting auf neue oeffentliche Endpoints

### Tests

- [ ] Unit Tests fuer neue Geschaeftslogik
- [ ] Bestehende Tests laufen weiter (`npm run test`)
