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

| Feature | Konzept | Status | Anmerkung |
|---------|---------|--------|-----------|
| Spielesammlung CRUD | Ja | Implementiert | Vollständig |
| Tags/Kategorien | Ja | FEHLT | Kein Tag-System im Schema/UI |
| Bilder/Cover hochladen | Ja | TEILWEISE | Nur URL-basiert, kein Upload |
| Spielsessions | Ja | Implementiert | Vollständig |
| Gruppen | Ja | Implementiert | Inkl. public groups |
| Statistiken | Ja | Implementiert | Basis-Stats vorhanden |
| Gruppen-Statistiken | Ja | FEHLT | Nur globale Stats |
| BGG Integration | Ja | Implementiert | Import + BGG-Suche |
| Event-Voting | Ja | Implementiert | Inkl. Public Events, Gäste |
| Spielereihen | Ja | Implementiert | Vollständig |
| Public Events + Gäste | Nein | Implementiert | Erweiterung über Konzept hinaus |
| Date Polling | Nein | Implementiert | Erweiterung über Konzept hinaus |
| Admin Monitoring | Nein | Implementiert | Erweiterung über Konzept hinaus |
| EAN-Scanner | Nein | Implementiert | Erweiterung über Konzept hinaus |
| Passwort-Reset | Nein | Implementiert | Erweiterung über Konzept hinaus |
| Profil-Seite | Nein | Implementiert | Erweiterung über Konzept hinaus |

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
1. **Debug-Routes in Produktion**: `/api/debug/env` und `/api/debug/session` exponieren sensible Daten. Müssen hinter `NODE_ENV === 'development'` Guard.
2. **DB-Init ohne Auth**: `/api/db/init` kann ohne Admin-Berechtigung aufgerufen werden und erstellt User mit Passwort `password123`.

### P1 – Wichtig
3. **Kein Rate Limiting auf Auth**: Login, Register, Passwort-Reset sind ohne Schutz gegen Brute-Force.
4. **PII in Logs**: `console.log` mit User-E-Mails in BGG-Routes.
5. **Passwort als URL-Parameter**: Gruppen-Passwort wird als Query-Param gesendet (sichtbar in Logs, Browser-History).
6. **Fehlende Input-Validierung**: API Routes prüfen nicht auf max. String-Längen.
7. **Keine Pagination**: Listen-Endpoints geben alle Datensätze zurück.

### P2 – Verbesserung
8. **Mega-Komponente aufteilen**: `public-event-client.tsx` (1130+ Zeilen) in Subkomponenten aufteilen.
9. **XML-Parsing mit `any`**: BGG-Route nutzt unsafe types.
10. **`next/image` nutzen**: Externe Bilder werden nicht optimiert.
11. **Fehlende Unit Tests**: auth.ts, public-event.ts, api-logger.ts haben keine Tests.
12. **Konsistente Error-Responses**: `{ error }` vs `{ message }` vereinheitlichen.

### P3 – Nice-to-have
13. **Tags/Kategorien**: Im Konzept vorgesehen, aber nicht implementiert.
14. **Bild-Upload**: Nur URL-basiert, kein echter Upload.
15. **Gruppen-Statistiken**: Im Konzept vorgesehen, fehlt noch.
16. **accessibility Skill**: In AGENTS.md referenziert, aber `skills/accessibility/SKILL.md` existiert nicht.

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
