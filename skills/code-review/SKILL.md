---
name: code-review
description: Senior Dev Code Reviewer – Prüft Code-Qualität, Architektur, Sicherheit und Konzept-Konformität. Erstellt priorisierte Verbesserungsvorschläge.
metadata:
  author: BoardGameTools Team
  version: 1.0
---

# Senior Dev Code Review

## Wann diesen Skill verwenden

- Bei Code-Reviews vor einem Release
- Wenn neue Features implementiert wurden und geprüft werden sollen
- Zur regelmäßigen Code-Qualitätssicherung
- Wenn das CONCEPT.md gegen die Implementierung abgeglichen werden soll
- Bei Security-Audits und Performance-Optimierung

## Review-Checkliste

### 1. Architektur & Patterns

**Prüfpunkte:**
- [ ] Konsistente Nutzung von Server Components vs. Client Components
- [ ] `"use client"` nur wo nötig (Interaktivität, Hooks)
- [ ] Keine Geschäftslogik in Komponenten – gehört in API Routes oder lib/
- [ ] DRY-Prinzip: Keine Code-Duplikation über Dateien hinweg
- [ ] Komponenten-Größe: Max ~300 Zeilen, sonst aufteilen
- [ ] Proper separation of concerns (UI / Logic / Data)

**Bekannte Hotspots:**
- `src/components/public-event/public-event-client.tsx` – über 1100 Zeilen, sollte in Subkomponenten aufgeteilt werden (GuestRegistration, ProposalList, VotingSection, DatePolling, BggSearch)
- `src/app/(dashboard)/dashboard/events/[id]/voting-client.tsx` – prüfen ob Logik-Duplikation mit public-event-client existiert
- API Routes mit ähnlicher Auth-Prüfung: Shared Middleware extrahieren

### 2. TypeScript & Typsicherheit

**Prüfpunkte:**
- [ ] Keine `any` Types außer in begründeten Ausnahmen
- [ ] Prisma-generierte Types nutzen statt manuelle Interfaces
- [ ] API Response Types definiert und konsistent
- [ ] Props-Interfaces für alle Komponenten
- [ ] Strict null checks beachtet

**Bekannte Hotspots:**
- `src/app/api/bgg/route.ts` – XML-Parsing mit `any` Types (Zeile 29: `const result: any = {}`, Zeile 84: `const games: any[]`)
- BGG-Suche gibt untypisierte Objekte zurück
- Einige API Routes geben `any` im catch-Block zurück

### 3. Sicherheit

**Prüfpunkte:**
- [ ] Alle geschützten API Routes prüfen `auth()` Session
- [ ] Input-Validierung auf allen POST/PUT Endpoints (Länge, Typ, Format)
- [ ] Keine PII (personenbezogene Daten) in console.log
- [ ] Keine Secrets in Code oder Commits
- [ ] Rate Limiting auf Auth-Endpoints
- [ ] CSRF-Schutz via NextAuth
- [ ] SQL Injection: `$queryRaw` nur mit tagged templates
- [ ] Debug-Routes in Produktion deaktiviert

**Bekannte Hotspots:**
- `src/app/api/debug/env/route.ts` – Environment-Variablen exponiert, muss in Prod deaktiviert sein
- `src/app/api/debug/session/route.ts` – Session-Daten exponiert
- `src/app/api/db/init/route.ts` – DB-Init ohne Admin-Check
- `src/app/api/bgg/search/route.ts` – loggt `session?.user?.email`
- `src/app/api/bgg/[id]/route.ts` – loggt `session?.user?.email`
- Auth-Routes ohne Rate Limiting: register, password-reset, login
- `src/app/api/public/group/[token]/route.ts` – Passwort als Query-Parameter

### 4. Performance

**Prüfpunkte:**
- [ ] Keine N+1 Queries (Prisma `include` nutzen)
- [ ] Pagination auf Listen-Endpoints
- [ ] `useMemo`/`useCallback` für teure Berechnungen
- [ ] Bilder optimiert (next/image statt <img>)
- [ ] Bundle Size: Große Libraries nur bei Bedarf laden
- [ ] DB-Indices auf häufig gefilterte Felder

**Bekannte Hotspots:**
- `tesseract.js` (7MB+) in dependencies – wird nur für EAN-Scan gebraucht, sollte lazy-loaded werden
- `recharts` (300KB+) – nur auf Statistics-Seite nötig, dynamic import nutzen
- BGG-Thumbnails: Batch-Request für 20 Ergebnisse verlangsamt die Suche
- Keine Pagination auf /api/games, /api/sessions, /api/events
- External images via `<img>` statt `next/image` (keine Optimierung)

### 5. API Design

**Prüfpunkte:**
- [ ] Konsistente Error-Response-Struktur: `{ error: string, details?: string }`
- [ ] HTTP Status Codes korrekt (400 vs 404 vs 422 vs 500)
- [ ] Request-Body-Validierung mit konkreten Fehlermeldungen
- [ ] Konsistente Naming-Konvention für Endpoints
- [ ] PATCH für partielle Updates statt PUT

**Bekannte Hotspots:**
- Inkonsistente Error-Formate zwischen verschiedenen Routes
- Manche Routes geben `{ message: ... }` statt `{ error: ... }` zurück
- Fehlende Validierung auf maximale String-Längen (Name, Beschreibung)
- Public API Routes (`/api/public/`) fehlt Rate Limiting

### 6. UI/UX & Accessibility

**Prüfpunkte:**
- [ ] WCAG AA Kontrast (4.5:1 für Text, 3:1 für große Elemente)
- [ ] Alle interaktiven Elemente: `aria-label` oder sichtbares Label
- [ ] Fokus-Management: Sichtbare Fokuszustände
- [ ] Touch-Targets mindestens 44x44px
- [ ] Loading States für alle async Operationen
- [ ] Error States mit hilfreichen Meldungen
- [ ] Responsive Design: Mobile-first testen
- [ ] Keyboard-Navigation durchgängig möglich

**Bekannte Hotspots:**
- Voting-Buttons auf Public Event Page haben keine aria-labels für Screenreader
- Einige Icon-only Buttons ohne title/aria-label (nach Mobile-Refactoring)
- Toast-Meldungen nicht per Screenreader erreichbar (Standard-Radix Verhalten)
- Tabellen-Layout bei DatePolling auf kleinen Screens problematisch

### 7. Testing

**Prüfpunkte:**
- [ ] Unit Tests für alle Business-Logik in lib/
- [ ] API Route Tests für kritische Endpoints
- [ ] E2E Tests für Kernflows (Login, Game CRUD, Event-Voting)
- [ ] Edge Cases: Leere Listen, ungültige IDs, Concurrent Requests
- [ ] Mock-Strategie konsistent (fetch mocking für BGG API)

**Bekannte Test-Lücken:**
- Keine Unit Tests für: auth.ts, public-event.ts, public-link.ts, api-logger.ts
- Keine API Route Tests
- E2E Tests existieren aber Coverage ist unklar
- Kein Test für BGG-Proposal Flow (public event → BGG search → propose)
- Kein Test für Date Polling
- Kein Test für Guest Voting

### 8. Datenbank & Schema

**Prüfpunkte:**
- [ ] Alle Relationen mit onDelete-Verhalten definiert
- [ ] Indices auf Foreign Keys und häufige Filter-Felder
- [ ] Optional vs. Required Felder korrekt
- [ ] Keine verwaisten Daten möglich (Cascading Deletes)
- [ ] Schema stimmt mit CONCEPT.md überein

**Bekannte Hotspots:**
- `GameProposal.gameId` optional gemacht für BGG-Proposals – prüfen ob `NULL` gameId + NULL bggId möglich ist (Datenintegritätsproblem)
- Fehlende Indices auf: `GuestVote.guestId`, `GuestVote.proposalId`, `GuestDateVote.guestId`
- `Event.status` als String statt Enum – Typo-Gefahr
- Kein Soft-Delete: Gelöschte Spiele reißen Referenzen in Sessions/Proposals

### 9. Konzept-Konformität

**Prüfpunkte:**
- [ ] Alle Features aus CONCEPT.md implementiert
- [ ] Keine Feature-Drift (implementierte Features die nicht im Konzept stehen)
- [ ] UI-Navigation stimmt mit Konzept überein
- [ ] Datenmodell entspricht der Spezifikation

**Konzept-Gaps (Stand März 2026):**

| Feature | Konzept | Status | Umsetzung |
|---------|---------|--------|-----------|
| Spielesammlung CRUD | Ja | 90% | Kern vorhanden; **Tags/Kategorien fehlen**, Bild nur per URL |
| Bilder/Cover hochladen | Ja | TEILWEISE | Nur URL-basiert, kein Upload-Endpoint |
| Tags/Kategorien | Ja | FEHLT | Kein Tag/Category-Modell im Schema |
| Spielsessions | Ja | 70% | Erstellen/Listen OK; **Detailseite fehlt**, kein Edit/Delete |
| Gruppen | Ja | 100%+ | Inkl. Polls, Comments, Public Sharing |
| Statistiken | Ja | FEHLT | **Komplett unimplementiert** – Sidebar-Link vorhanden, aber keine Seite, keine API |
| Gruppen-Statistiken | Ja | FEHLT | Teil des fehlenden Statistik-Systems |
| BGG Integration | Ja | 100%+ | Import, Suche, Collection-Import, Thumbnails |
| Event-Voting | Ja | 85% | **Close-Voting Endpoint fehlt** (`POST /events/[id]/close`), kein Status-Wechsel |
| Spielereihen | Ja | 100% | Vollständig inkl. Sort/Filter |
| Public Events + Gäste | Nein | Implementiert | Erweiterung über Konzept hinaus |
| Date Polling | Nein | Implementiert | Doodle-ähnliche Terminabstimmung |
| Admin Monitoring | Nein | Implementiert | API-Logging + Dashboard |
| EAN-Scanner | Nein | Implementiert | Barcode-Scanner + OCR |
| Passwort-Reset | Nein | Implementiert | E-Mail-basierter Flow |
| Profil-Seite | Nein | Implementiert | Nutzerdaten + Kommunikationshistorie |
| Email-Benachrichtigungen | Nein | Implementiert | nodemailer für Einladungen |
| Kalender-Export | Nein | Implementiert | iCal-Export für Events |

**Gesamtbewertung: ~78% des Konzepts implementiert, ~150% Gesamtumfang**

### Tech-Stack-Abweichungen

| Konzept | Tatsächlich | Bewertung |
|---------|-------------|-----------|
| Next.js 14 | Next.js **16.1.6** | Major-Version-Sprung, Konzept aktualisieren |
| SQLite + Prisma | **PostgreSQL** + Prisma | DB gewechselt, Konzept aktualisieren |
| Projektstruktur `(dashboard)/games/` | `(dashboard)/dashboard/games/` | Extra `dashboard`-Nesting |
| `src/components/features/` | Kein features-Unterordner | Komponenten direkt in components/ |
| `src/types/index.ts` | Existiert nicht | Kein zentrales Type-File |

## Review-Workflow

### Schritt 1: Automatisierte Checks
```bash
# Build prüfen
npm run build

# Unit Tests
npm run test

# Security Check
npm run security-check

# Lint
npm run lint
```

### Schritt 2: Code-Review Durchführung

1. **Schema prüfen**: `prisma/schema.prisma` gegen CONCEPT.md abgleichen
2. **API Routes**: Jeden Endpoint auf Auth, Validierung, Error Handling prüfen
3. **Komponenten**: Größe, Props, State Management, Accessibility prüfen
4. **Lib-Dateien**: Utility-Funktionen auf Korrektheit und Edge Cases prüfen
5. **Tests**: Coverage und Qualität bewerten

### Schritt 3: Review-Report erstellen

Erstelle einen Report mit folgendem Format:

```markdown
# Code Review Report – [Datum]

## Zusammenfassung
- X kritische Findings
- Y wichtige Findings
- Z Verbesserungsvorschläge

## Kritisch (sofort beheben)
...

## Wichtig (nächster Sprint)
...

## Verbesserungsvorschläge (Backlog)
...

## Positiv (gut gemacht)
...
```

### Schritt 4: Priorisierung

| Priorität | Kriterium | Zeitrahmen |
|-----------|-----------|------------|
| P0 – Kritisch | Security-Lücken, Datenverlust-Risiko, Produktions-Blocker | Sofort |
| P1 – Wichtig | Bugs, Performance-Probleme, fehlende Validierung | Nächster Sprint |
| P2 – Verbesserung | Code-Qualität, Refactoring, bessere Types | Backlog |
| P3 – Nice-to-have | Kosmetik, Dokumentation, zusätzliche Tests | Gelegenheit |

## Aktuelle Top-Findings (Stand: 2026-03-17)

### P0 – Kritisch
1. **Debug-Routes in Produktion**: `/api/debug/env` und `/api/debug/session` exponieren sensible Daten ohne Auth. Müssen hinter `NODE_ENV === 'development'` Guard.
2. **DB-Init ohne Auth**: `/api/db/init` kann ohne Berechtigung aufgerufen werden und erstellt User mit Passwort `password123`. Außerdem nutzt es SQLite-Queries auf PostgreSQL.
3. **Hardcoded Admin-Credentials**: `src/lib/admin-create.ts` enthält Admin-E-Mail und Passwort (`Admin123!`) im Klartext im Quellcode – committed in Git.
4. **Gruppen-Passwörter im Klartext**: Gruppen-Passwörter in DB gespeichert und mit `===` verglichen (timing-attack-anfällig). Werden auch als URL-Query-Parameter übertragen.
5. **Kein Rate Limiting + keine middleware.ts**: Keine zentrale Auth-Middleware. Jede Route prüft manuell. Vergessene Checks = offene Route. `/api/bgg/route.ts` ist komplett unauthentifiziert und nutzbar als Proxy.
6. **passwordHash in API-Responses**: `events/route.ts` und `events/[id]/route.ts` inkludieren `createdBy: true` ohne `select` – passwordHash wird an Client gesendet.

### P1 – Wichtig
7. **PII in Logs**: `console.log` mit User-E-Mails in BGG-Routes + `admin-create.ts`. 175 console.log-Statements insgesamt in Production-Code.
8. **Fehlende Input-Validierung**: API Routes prüfen nicht auf max. String-Längen. Nur `join/route.ts` truncated auf 80 Zeichen.
9. **Keine Pagination**: Listen-Endpoints (`/api/games`, `/api/sessions`, `/api/events`) geben alle Datensätze zurück.
10. **Statistiken komplett fehlend**: Im Konzept vorgesehen, Sidebar-Link vorhanden, aber weder Seite noch API existiert.
11. **Session-Detailseite fehlt**: Links zu `/sessions/[id]` und `/sessions/[id]/edit` führen ins Leere. Kein Edit/Delete für Sessions.
12. **Close-Voting fehlt**: Kein `POST /events/[id]/close` Endpoint. Event-Status kann nicht von `voting` auf `closed` gewechselt werden.
13. **Registrierung: Keine E-Mail-Validierung**: Kein Format-Check, kein Lowercase-Normalisierung. `Test@Example.com` und `test@example.com` könnten getrennte Accounts sein.
14. **P95 Duration Query lädt alle Zeilen**: `admin/monitoring/stats/route.ts` fetcht ALLE ApiLog-Durations in Speicher für P95-Berechnung. OOM-Risiko bei vielen Logs.
15. **Admin kann sich selbst deaktivieren**: Keine Self-Protection in `/api/admin/users/deactivate` und `/api/admin/users/change-password`.
16. **Admin-Endpoints: 401 statt 403**: Authentifizierte Non-Admin-User bekommen 401 statt 403.

### P2 – Verbesserung
17. **Mega-Komponenten aufteilen**: `public-event-client.tsx` (1130 Zeilen), `group-detail-client.tsx` (987 Zeilen), `monitoring-dashboard.tsx` (906 Zeilen).
18. **38× `any` Type**: Besonders in `public-event.ts` (7×), `group-detail-client.tsx` (9×), BGG XML-Parsing.
19. **Duplikat: Prisma-Client-Dateien**: `db.ts` und `db-postgres.ts` existieren parallel, letztere wird nie importiert.
20. **Duplikat: BGG-Logik**: `bgg/route.ts` dupliziert XML-Parsing aus `lib/bgg.ts` mit weniger robuster Implementierung + Hardcoded Mock-Daten.
21. **`next/image` statt `<img>`**: Externe Bilder werden nicht optimiert. `next.config.ts` nutzt deprecated `images.domains`.
22. **Fehlende Unit Tests**: Nur 3 Test-Dateien (bgg, utils, security-check). Keine Tests für: Auth, API-Routes, Komponenten, Voting, Guest-Flow.
23. **Inkonsistente Error-Responses**: `{ error }` vs `{ message }` vs `{ success }`. Sprachen gemischt (Deutsch/Englisch).
24. **CONCEPT.md aktualisieren**: Tech-Stack (Next.js 16, PostgreSQL), neue Features, geänderte Projektstruktur nachziehen.
25. **Pendende Invites dupliziert**: Gleicher Query-Code in `dashboard/page.tsx` und `events/page.tsx`.
26. **Navbar nutzt Inline-Styles**: Einzige Komponente mit `style={{}}` statt Tailwind-Klassen.
27. **Prisma Transactions fehlen**: Event-Share erstellt mehrere Invites ohne Transaction – bei Fehler bleiben Teil-Invites.

### P3 – Nice-to-have
28. **Tags/Kategorien**: Im Konzept vorgesehen, aber nicht implementiert.
29. **Bild-Upload**: Nur URL-basiert, kein echter File-Upload.
30. **Gruppen-Statistiken**: Im Konzept vorgesehen, fehlt noch.
31. **accessibility Skill**: In AGENTS.md referenziert, aber Datei existiert nicht.
32. **DB-Dumps in Git**: `.sql`, `.bak`, `.db` Dateien committed – könnten Nutzerdaten enthalten.
33. **Links zu /terms und /privacy**: Registrierungsseite verlinkt auf nicht existierende Seiten.
34. **ENV-Variablen inkonsistent**: `.env.example` sagt `DATABASE_URL`, Schema nutzt `SQL_DATABASE_URL`.
35. **Fehlende DB-Indices**: `Game.ownerId`, `GameSession.createdById`, `Event.createdById`, `Event.eventDate`, `GroupMember.userId` ohne Index.

## Codebeispiele für Fixes

### Debug-Route Guard (P0)
```typescript
// src/app/api/debug/env/route.ts
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  // ... existing code
}
```

### Input-Validierung Helper (P1)
```typescript
// src/lib/validation.ts
export function validateStringLength(
  value: string | undefined,
  field: string,
  max: number = 500
): string | null {
  if (!value?.trim()) return `${field} ist erforderlich`;
  if (value.length > max) return `${field} darf max. ${max} Zeichen lang sein`;
  return null;
}
```

### API Rate Limiting Middleware (P1)
```typescript
// src/lib/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
```

### Komponenten-Aufteilung (P2)
```
src/components/public-event/
├── public-event-client.tsx        # Haupt-Container (orchestriert State)
├── guest-registration.tsx         # Gast-Anmeldung + Gästeliste
├── proposal-list.tsx              # Spielvorschläge + Voting
├── date-polling.tsx               # Terminabstimmung
├── bgg-search.tsx                 # BGG-Suche + Vorschlag
└── collection-propose.tsx         # Spiel aus Sammlung vorschlagen
```

### User-Include absichern (P0)
```typescript
// FALSCH – schickt passwordHash an Client:
include: { createdBy: true }

// RICHTIG:
include: { createdBy: { select: { id: true, name: true, email: true } } }
```

### middleware.ts erstellen (P0)
```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/api/auth",
  "/api/public",
  "/api/health",
  "/api/bgg",       // ggf. einschränken
  "/login",
  "/register",
  "/passwort-vergessen",
  "/reset-password",
  "/public",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!isPublic && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
```

### Gruppen-Passwort hashen (P0)
```typescript
// Speichern:
import { hash } from "bcryptjs";
const hashed = await hash(password, 12);
await prisma.group.update({ where: { id }, data: { password: hashed } });

// Prüfen:
import { compare } from "bcryptjs";
const isValid = await compare(inputPassword, group.password);
```
