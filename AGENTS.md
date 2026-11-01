# BoardGameTools - Agent Instructions

## Projektübersicht

BoardGameTools ist eine Next.js 16 Webanwendung zur Verwaltung von Brettspielen, Spielsessions, Events mit Voting-Funktionalität, Gruppen und Spielereihen.

Der bestätigte Produktkontext für Web und iOS steht in `PRODUCT.md`. Bei Produkt- und Gestaltungsentscheidungen ist er gemeinsam mit den technischen Vorgaben zu berücksichtigen. Die Impeccable-Arbeitsweise steht in `.impeccable/config.json`; neue Oberflächen werden gemäß bestätigter Präferenz direkt im Code entwickelt.

Die Impeccable-Design-Hooks sind für das Projekt aktiviert. Sie melden nach Änderungen an UI-Dateien automatisch mechanisch erkennbare Gestaltungsprobleme. Codex erfordert beim ersten Einsatz die Freigabe über `/hooks`; in Cursor müssen Hooks in den Einstellungen aktiviert sein. Status prüfen: `.agents/skills/impeccable/scripts/impeccable hooks status`.

## Webgestaltung und UI-Prüfung

- Impeccable-Skillquellen und Agenten sind in den jeweiligen Werkzeugverzeichnissen versioniert. Heruntergeladene Engines unter `**/skills/impeccable/scripts/bin/` und `.claude/settings.local.json` bleiben lokal; der versionierte Launcher kann die passende Engine beziehen und prüft den Download anhand der mitgelieferten Prüfsummen.
- `npm run pipeline:check -- --list` zeigt optionale Provider in `scripts/pipeline-checks/`. Zugangsdaten ausschließlich über Umgebungsvariablen oder die ignorierte `.env.pipeline-check` bereitstellen. Exitcodes: 0 erfolgreich, 1 fehlgeschlagene Prüfung, 2 keine Prüfung ausgeführt oder ungültiger Aufruf. Konfiguration: `docs/DEPLOYMENT.md`.

- `DESIGN.md` und `.impeccable/design.json` dokumentieren die bestätigte Webgestaltung „Club Programme“; Produktfakten stehen in `PRODUCT.md`.
- Gemeinsame Anwendungsstile: `src/app/club.css`; semantische Farbvariablen: `src/app/globals.css`.
- Reine Dashboard-/Eventdarstellung: `src/components/dashboard/`; Datenabfragen verbleiben in den Server-Seiten.
- Sammlungskarten und Filter: `collection-game-card.tsx` und `collection-filters.tsx` neben `games-list-client.tsx`.
- Navigationstests: `tests/unit/components/club-navigation.test.tsx` und `tests/e2e/navigation_test.ts`; Dashboardzustände: `tests/unit/components/club-dashboard.test.tsx`.
- Lokale Impeccable-Prüfberichte und Browserbelege liegen unter `.impeccable/critique/`;
  bestätigte Fehler werden zusätzlich dauerhaft in `docs/bugs.md` erfasst.

## Native iOS-Gestaltung

- Übersicht, Navigation, Sammlung und Spieleabende folgen der bestätigten nativen
  Club-Programme-Adaption; Vertrag und Umfang stehen in
  `docs/superpowers/specs/2026-10-30-ios-club-programme-design.md`.
- Adaptive native Farbrollen liegen als `ClubTheme` in
  `BoardGameTools/BoardGameTools/Utilities/Theme.swift`; `ClubContent` in
  `Utilities/Date+Formatting.swift` wählt den nächsten Spieleabend und letzte Partien.
- `MainTabView` hat fünf Tabs. `MoreView` besitzt den gemeinsamen NavigationStack
  für Gruppen, Spielereihen und Einstellungen; diese Ziele erzeugen keinen eigenen Stack.
- Die Auswahltests gehören zum Swift-Vertragstest-Runner (`npm run test:ios:contracts`).

## Tech Stack

- **Framework**: Next.js 16.4.3 (App Router, Turbopack dev, Webpack prod)
- **Sprache**: TypeScript 6.0.3 (strict)
- **Datenbank**: PostgreSQL (Prisma Postgres) + Prisma ORM 7.10.1
- **Styling**: Tailwind CSS 4.3.3 + `@tailwindcss/postcss` 4.3.3 + shadcn/ui Komponenten
- **Auth**: NextAuth.js v5 beta.32 mit Credentials Provider
- **Testing**: Vitest 4.1.12 (Unit), CodeceptJS 4.1.0 + Playwright 1.62.1 (E2E)
- **Lint**: ESLint 9.39.5 (Flat Config `eslint.config.mjs`)
- **CI/Hooks**: Husky 9.1.7 (pre-commit: Tests + Security + Review, pre-push: DB-Backup)
- **Node**: `>=24.0.0` (siehe `package.json` engines)
- **Package Manager**: npm mit `legacy-peer-deps=true` (`.npmrc`) zur Auflösung von Peer-Dependency-Konflikten
- **Native iOS-Client** (implementiert): Xcode, Swift 6, SwiftUI, SwiftData, URLSession, Keychain, Sign in with Apple, Push-Benachrichtigungen, Deep Links

## Dependency-Management

- `.npmrc` setzt `legacy-peer-deps=true`, um Breaking-Changes bei Peer-Dependencies zu vermeiden.
- `package.json` enthält `overrides` zur sofortigen Behebung von CVEs in transitiven Abhängigkeiten:
  - `mocha`: `diff ^8.0.4`, `serialize-javascript ^7.0.5`
  - `minimatch@3.1.5`: `brace-expansion ^1.1.18`
  - `codeceptjs`: `uuid ^11.1.1`, `axios ^1.19.0`
- Sicherheitsstand 0.50.16: `npm audit --omit=dev` meldet 0 Befunde; Gesamtaudit enthält drei niedrige Befunde in der shadcn/deepmerge-Entwicklungskette. Details: `docs/code-reviews/security.md`.
- Gezielte Overrides: `undici@>=6 <7` → `^6.29.1`, `zod@>=4 <4.6.6` → `^4.6.7`, `js-yaml@>=4 <5` → `^4.3.2`.
- GitHub CI benötigt schon für `npm ci` eine global definierte künstliche `SQL_DATABASE_URL`, da postinstall `prisma generate` startet. Niemals Produktionszugangsdaten für Codegenerierung verwenden; Regression: `tests/unit/scripts/ci-install.test.ts`.
- `npm run build` verändert keine Datenbank. Migrationen nur explizit über `npm run prisma:deploy`; bei Fehlern abbrechen, kein automatisches Baseline oder `db push`.
- iOS-Vertragstests auf macOS: `npm run test:ios:contracts`. Lokale Cache-Zuordnung und vollständige Bereinigung: `LocalAccountStore` in `Data/PersistenceController.swift`.

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
2. `npm run review-evaluate` ausführen (oder `npm run review-evaluate:regression` im Pre-Commit-Hook)
3. Ergebnis in `skills/code-review/SKILL.md` prüfen
4. Behobene Findings mit ~~Strikethrough~~ ✅ markieren
5. Score-Entwicklung verfolgen – Ziel: steigend!
6. **Regressions-Check:** Wurden Findings erkannt, die vorher gelöst waren und jetzt wieder offen sind?
   - Falls ja: **Sofort beheben** – Commit wird blockiert (`--fail-on-regression`)
   - Root-Cause in `docs/code-reviews/regressions.md` dokumentieren (wird automatisch befüllt)
7. **Review-Dokumentation in `docs/code-reviews/` aktualisieren:**
   - `YYYY-MM-DD_review-snapshot.md` – Scores, Findings-Status und Score-Verlauf aktualisieren
   - `YYYY-MM-DD_review-bewertung.md` – Meta-Bewertung und Vergleichstabelle aktualisieren
   - `YYYY-MM-DD_prozessanpassungen.md` – Maßnahmen-Status und Erfolgsmessung aktualisieren

### 3. Regressions-Vermeidung (KRITISCH!)

**Vor jeder größeren Änderung (Refactoring, Migration, Dependency-Update):**

1. **Impact-Analyse:** Prüfe, welche Review-Findings von der Änderung betroffen sein könnten
2. **Evaluator-Vorlauf:** `npm run review-evaluate:report` ausführen, um den aktuellen Stand zu sichern
3. **Nach der Änderung:** Erneut `npm run review-evaluate:regression` ausführen und prüfen, ob Regressions aufgetreten sind
4. **Bei Regression:** Root-Cause in `docs/code-reviews/regressions.md` dokumentieren (Felder ausfüllen!)

**Typische Regressions-Ursachen:**
- Framework-Migrationen (z.B. Next.js 15 → 16: `middleware.ts` → `proxy.ts`)
- Dependency-Updates die APIs ändern
- Refactorings die Security-Patterns entfernen (z.B. `include: { user: true }` wieder einführen)
- Komponentenaufteilung die Error Boundaries vergisst

### 4. Prisma-Queries: NIEMALS `user: true` oder `createdBy: true`

```typescript
// VERBOTEN – leakt passwordHash:
include: { user: true }
include: { createdBy: true }

// RICHTIG:
include: { user: { select: { id: true, name: true, email: true } } }
include: { createdBy: { select: { id: true, name: true, email: true } } }
```

### 5. Komponenten-Groesse

- Maximum ~300 Zeilen pro Datei
- Grosse Komponenten in Subkomponenten aufteilen
- Shared State ueber Props oder Context weitergeben

### 6. Dokumentations-Pflicht (KRITISCH!)

**Alle Dokumentationen MUESSEN bei jeder Aenderung aktuell gehalten werden!**

| Dokument | Pfad | Aktualisieren bei... |
|----------|------|---------------------|
| **Changelog** | `src/lib/changelog.ts` | JEDER Aenderung (Pflicht-Regel 1) |
| **CONCEPT.md** | `CONCEPT.md` | Neues Feature, Tech-Stack-Aenderung, Schema-Aenderung |
| **FEATURES.md** | `docs/FEATURES.md` | Neue Seite, neuer Endpunkt, geaenderte Funktionalitaet |
| **Feature-Backlog** | `docs/FEATURE-BACKLOG.md` | Neue Anforderung, Plan, Umsetzungsfreigabe oder Feature-Status |
| **OpenAPI/Swagger** | `docs/openapi.yaml` | Neuer API-Endpunkt, geaendertes Request/Response-Schema, neue Query-Parameter |
| **FAQ** | `src/lib/faq.ts` | Neues Feature das Nutzer betrifft, geaenderte Bedienung |
| **Deployment** | `docs/DEPLOYMENT.md` | Neue Deploy-Schritte, neue Env-Variablen, Build-Einstellungen |
| **AGENTS.md** | `AGENTS.md` | Neue Regeln, neue Dateien, neue Skills, geaenderte Konventionen |
| **Bugs** | `docs/bugs.md` | Neuer Bug gefunden, Bug-Status-Update, Bug behoben |

**Workflow bei neuem Bug:**
1. Bug in `docs/bugs.md` eintragen mit fortlaufender Nummer (BUG-XXX)
2. Status auf `open` setzen, Schweregrad zuweisen
3. Reproduktionsschritte und erwartetes/tatsächliches Verhalten dokumentieren
4. Changelog-Eintrag schreiben (falls Bug-Fix Teil eines Releases)

**Workflow bei Bug-Fix:**
1. Bug in `docs/bugs.md` auf `fixed` setzen
2. Behoben-Datum und Version eintragen
3. **PFLICHT:** Test schreiben um Regression zu verhindern
4. Test-Status in Bug-Eintrag dokumentieren
5. Changelog-Eintrag mit Bug-Referenz schreiben
6. Bug-Statistik am Ende der Datei aktualisieren

**Workflow bei neuem API-Endpunkt:**
1. Route in `src/app/api/` implementieren
2. `docs/openapi.yaml` um den Endpunkt erweitern (Pfad, Methoden, Request/Response, Auth)
3. `docs/FEATURES.md` aktualisieren (falls nutzersichtbar)
4. `src/lib/faq.ts` erweitern (falls neue Nutzerfrage entsteht)
5. `CONCEPT.md` aktualisieren (falls neuer Feature-Bereich)
6. Changelog-Eintrag schreiben

**Workflow bei neuer Seite/Feature:**
1. Seite unter `src/app/` implementieren
2. `docs/FEATURES.md` um die Seite erweitern (Route, Zugriff, Aktionen)
3. `src/lib/faq.ts` um relevante Fragen erweitern
4. `CONCEPT.md` aktualisieren
5. Changelog-Eintrag schreiben

**Swagger-Konventionen (`docs/openapi.yaml`):**
- Alle Beschreibungen auf Deutsch
- Tags nach Domaene: Auth, Games, BGG, Sessions, Series, Events, Groups, Public, Admin, System
- Jeder Endpunkt: summary, parameters, requestBody (mit Schema), responses
- Auth: `security: []` fuer oeffentliche Endpunkte, Session-Cookie fuer geschuetzte
- Fehler immer als `{ error: string }` Schema referenzieren

### 7. Bug-Tracking (KRITISCH!)

**Jeder gefundene Bug muss in `docs/bugs.md` dokumentiert werden!**

**Bug-Format:**
```markdown
### [BUG-XXX] Bug-Titel

**Status:** `open` | `in_progress` | `fixed` | `wontfix`
**Schweregrad:** `critical` | `high` | `medium` | `low`
**Entdeckt:** YYYY-MM-DD
**Behoben:** YYYY-MM-DD (falls fixed)
**Behoben in Version:** X.Y.Z
**Test geschrieben:** Ja/Nein (Pflicht bei Fix!)

**Beschreibung:** ...
**Reproduktion:** ...
**Erwartetes Verhalten:** ...
**Tatsächliches Verhalten:** ...
**Ursache:** ...
**Lösung:** ...
**Referenz im Changelog:** Version X.Y.Z - Fix: ...
```

**Bug-Status-Workflow:**
1. **Neuer Bug:** Status `open`, in `docs/bugs.md` eintragen
2. **In Bearbeitung:** Status `in_progress`
3. **Behoben:** Status `fixed`, Version eintragen, **TEST SCHREIBEN** (Pflicht!)
4. **Wontfix:** Status `wontfix` mit Begründung

**Test-Pflicht bei Bug-Fix:**
- Nach JEDEM Bug-Fix muss ein Test geschrieben werden
- Unit-Test für logische Fehler
- E2E-Test für UI/Workflow-Fehler
- Test-Status im Bug-Eintrag dokumentieren
- Ziel: Regression verhindern

### 8. Deutsche Rechtschreibung und Grammatik (KRITISCH!)

**Alle deutschen Texte MUESSEN korrekte deutsche Rechtschreibung verwenden!**

**Verpflichtende Regeln:**
- **Umlaute verwenden:** "ö" statt "oe", "ä" statt "ae", "ü" statt "ue"
- **Beispiele:** "löschen" statt "loeschen", "öffentlich" statt "oeffentlich", "Größe" statt "Groesse"
- **Ausnahmen:** Technische Begriffe (z.B. "Soft-Delete", "IDOR", "Coverage")
- **Gilt für:** Frontend-Texte, Fehlermeldungen, FAQ, Changelog, Dokumentation

**Falsch:** "loeschen", "oeffentlich", "Groesse", "uebersicht"  
**Richtig:** "löschen", "öffentlich", "Größe", "Übersicht"

## Projektstruktur

```
boardgametools/
├── AGENTS.md              # Diese Datei (IMMER aktuell halten!)
├── CONCEPT.md             # Detailliertes Konzept
├── BoardGameTools/        # Xcode-Projekt für native iOS-App (SwiftUI/SwiftData)
├── skills/                # AgentSkills (siehe unten)
├── docs/                  # Projekt-Dokumentation
│   ├── DEPLOYMENT.md      # Deploy-Guide für Vercel + iOS
│   ├── bugs.md            # **Bug-Tracking Liste (PFLICHT aktuell halten!)**
│   ├── FEATURES.md        # **Feature-Dokumentation (PFLICHT aktuell halten!)**
│   ├── DEVELOPMENT-PROCESS.md  # Entwicklungsprozess & Agent-Architektur
│   ├── openapi.yaml       # **Swagger/OpenAPI Spec (PFLICHT aktuell halten!)**
│   ├── superpowers/specs/ # Design-Specs für iOS-App
│   ├── architecture/      # Architektur-Snapshots und Bewertungen
│   ├── best-practices/    # Best-Practices-Snapshots und Bewertungen
│   ├── bill-of-materials/ # BOM-Snapshots und Bewertungen
│   ├── code-reviews/      # Review-Snapshots, Bewertungen, Prozessanpassungen
│   ├── performance/       # Performance-Snapshots und Bewertungen
│   ├── processes/         # Prozess-Dokumentation (README.md)
│   ├── security/          # Security-Snapshots und Bewertungen
│   └── testing/           # Testing-Snapshots und Bewertungen
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
| `security` | OWASP Top 10, Auth-Härtung, Rate Limiting, CSP, Token-Sicherheit |
| `performance` | Bundle-Optimierung, Caching, DB-Queries, Core Web Vitals, Loading States |
| `best-practices` | Coding-Standards, TypeScript-Regeln, Komponenten-Richtlinien, API-Design |
| `architecture` | Schichtenarchitektur, Datenfluss, 29 Prisma-Modelle, Deployment, State Management |
| `testing` | Unit Tests (Vitest), E2E Tests (CodeceptJS/Playwright), Test-Strategie |
| `bill-of-materials` | Technologie-Inventar (53 Dependencies), Lizenz-Compliance, Update-Policy |

**Lies den relevanten Skill bevor du an einem Feature arbeitest!**

## Entwicklungs-Workflows

### Verbindlicher Ablauf für neue Features

1. Anforderung in `docs/FEATURE-BACKLOG.md` mit fortlaufender ID `FEAT-XXX`, Ziel,
   Status und Abnahmekriterien erfassen. Ein TODO autorisiert keine Umsetzung.
2. Bestehendes Verhalten, betroffene Plattformen, Daten, Berechtigungen und
   Review-Findings prüfen; offene Entscheidungen im Implementierungsplan klären.
3. Implementierungsplan mit Feature-ID unter `docs/superpowers/plans/` erstellen:
   Umfang, Arbeitsschritte, Tests, Impeccable-Prüfung, Security-Prüfung und Dokumentation.
4. Den konkreten Plan vorlegen und die ausdrückliche **Freigabe der Umsetzung**
   abwarten; Datum und freigegebenen Umfang im Backlog festhalten.
5. **Unmittelbar vor jeder Implementierung den Plan kurz auf Aktualität prüfen**:
   aktuellen Code-/Deploymentstand, uncommittierte Änderungen, vorher umgesetzte
   Features und betroffene Verträge mit dem Plan vergleichen. Datum, geprüften Stand,
   Ergebnis und nötige Planänderungen dokumentieren. Das gilt auch für ältere und
   bereits freigegebene Pläne sowie beim Fortsetzen nach relevanten Zwischenänderungen.
   Routineanpassungen innerhalb der bestehenden Freigabe direkt übernehmen;
   wesentliche Änderungen an Umfang, Datenfreigabe, Berechtigungen, Kosten oder
   Betriebswirkung vor der Umsetzung erneut abstimmen. Nicht bei jeder kleinen
   Codekorrektur die gesamte Planung wiederholen.
6. Nach Freigabe und Aktualitätsprüfung umsetzen und angemessene Tests ausführen. Bei UI-Änderungen ist
   Impeccable einschließlich gerenderter Prüfung verpflichtend. Security-Auswirkungen
   bei jedem Feature prüfen; relevante Berechtigungen, Validierung und Datenschutz
   gezielt testen. Nicht zutreffende Prüfbereiche begründet dokumentieren.
7. Changelog, betroffene Dokumentation und Backlog aktualisieren; Commit, Security-
   und Review-Regressionscheck gemäß den bestehenden Regeln abschließen.

Details und Prüfnachweise: `docs/DEVELOPMENT-PROCESS.md`, Abschnitt
„Verbindlicher Feature-Ablauf“. Diese Schritte gelten für jedes neue Feature,
auch wenn mehrere Feature-IDs gemeinsam geplant werden.

Gemeinsamer Plan für FEAT-001 bis FEAT-004:
`docs/superpowers/plans/2026-10-30-FEAT-001-004-voting.md`.
Bestätigter Plattformumfang: Web zuerst, native iOS-Oberflächen separat planen.
Der Plan selbst ist noch keine Umsetzungsfreigabe.

### Neues Feature nach Freigabe entwickeln

1. Lies den entsprechenden Skill in `skills/`
2. Pruefe das Datenmodell in `prisma/schema.prisma`
3. Erstelle/erweitere API Routes in `src/app/api/`
4. **`docs/openapi.yaml` um neue Endpunkte erweitern**
5. Erstelle UI-Komponenten und Seiten
6. **`docs/FEATURES.md` aktualisieren**
7. Schreibe Unit Tests in `tests/unit/`
8. **`src/lib/faq.ts` erweitern** (falls neue Nutzerfrage)
9. **`CONCEPT.md` aktualisieren** (falls neuer Feature-Bereich)
10. **Changelog-Eintrag schreiben** in `src/lib/changelog.ts`
11. Commit + Review-Evaluator pruefen

### Datenbank ändern

1. Ändere `prisma/schema.prisma`
2. Führe Migration aus: `npx prisma migrate dev --name <name>`
3. Generiere Client: `npx prisma generate`

### Bug-Fix entwickeln

1. Bug in `docs/bugs.md` finden oder erstellen
2. Status auf `in_progress` setzen
3. Bug analysieren und fixen
4. **PFLICHT:** Test schreiben um Regression zu verhindern
5. Bug in `docs/bugs.md` auf `fixed` setzen
6. Changelog-Eintrag mit Bug-Referenz schreiben
7. Commit + Review-Evaluator prüfen

### Tests ausführen

```bash
npm run test              # Unit Tests
npm run test:watch        # Unit Tests mit Watch
npm run test:e2e          # E2E Tests (Server muss laufen)
HEADLESS=true npm run test:e2e  # E2E Tests headless
```

### Review & Qualitätssicherung

```bash
npm run review-evaluate              # Bewertet Findings, aktualisiert SKILL.md
npm run review-evaluate:report       # Nur Report (ohne SKILL.md Update)
npm run review-evaluate:json         # JSON-Output (für CI/CD)
npm run review-evaluate:strict       # Exit 1 bei Score < 5/10
npm run review-evaluate:regression   # Exit 1 bei Regressions (Pre-Commit-Hook)
npm run security-check               # OWASP Security Check
npm run backup:prod              # Manuelles Prod-DB-Backup
```

**Pre-Commit Hook**: Unit Tests → Security Check → Review Evaluator (mit Regressions-Blockade)
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
| `src/lib/changelog.ts` | **Changelog (PFLICHT bei jeder Aenderung!)** |
| `src/lib/faq.ts` | **FAQ (PFLICHT bei neuen Features aktualisieren!)** |
| `src/lib/error-messages.ts` | Zentrale deutsche Fehlermeldungen |
| `docs/openapi.yaml` | **Swagger/OpenAPI Spec (PFLICHT bei API-Aenderungen!)** |
| `docs/FEATURES.md` | **Feature-Dokumentation (PFLICHT bei neuen Seiten/Features!)** |
| `docs/DEVELOPMENT-PROCESS.md` | Entwicklungsprozess & Agent-Architektur (91 Regeln) |
| `scripts/review-evaluate.mjs` | Review-Evaluator (50 Findings + Regressionserkennung) |
| `docs/code-reviews/regressions.md` | **Regressions-Log** (automatisch + manuell) |
| `docs/code-reviews/history/` | Historische Review-Snapshots (JSON, fuer Regression-Diff) |
| `prisma/schema.prisma` | Datenbank-Schema |
| `.npmrc` | npm-Konfiguration (`legacy-peer-deps=true`) |
| `eslint.config.mjs` | ESLint 9 Flat-Config (regelbasiert) |
| `vitest.config.ts` | Vitest-Konfiguration (React-Plugin, Aliase, Mocks) |
| `.env` | Lokale Umgebungsvariablen (NICHT committen, wird von `.gitignore` ignoriert) |
| `.env.prod` | Prod-DB-Credentials (NIEMALS committen!) |
| `.env.local.example` | Template fuer lokale Entwicklung |
| `.env.local` | Lokale Geheimnisse (wird NICHT versioniert; Kopie aus `.env.local.example` erstellen) |

## Umgebungsvariablen

```env
SQL_DATABASE_URL="postgres://..."      # PostgreSQL Connection
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<secret>"
HEALTH_READINESS_TOKEN="<mindestens-32-zufaellige-Zeichen>" # optional; nur serverseitig für Readiness-Monitore

# Apple Push Notifications (APNs) — optional
APNS_ENABLED="false"                   # true/false
APNS_PRODUCTION="false"                # true/false (Sandbox vs. Production)
APNS_TEAM_ID="<apple-team-id>"         # 10-stelliger Apple Team ID
APNS_KEY_ID="<apns-key-id>"            # APNs Auth Key ID
APNS_SIGNING_KEY="<base64-p8-key>"     # Base64-codierte .p8 oder PEM mit \n
APNS_TOPIC="com.boardgametools.ios"    # Bundle-ID der iOS-App
```

## Troubleshooting

```bash
npx prisma generate          # Prisma Client nicht gefunden
npx prisma migrate dev       # Schema out of sync
npm run backup:prod          # Manuelles DB-Backup
npm install --legacy-peer-deps  # Falls Peer-Dependency-Konflikte auftreten (alternativ `.npmrc` verwenden)

cd BoardGameTools            # iOS-Client
xcodegen generate --project .
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' build
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' test
npm run typecheck            # TypeScript-Fehler isolieren
npm run lint                 # ESLint-Fehler prüfen
npm run security-check:fast  # Security-Check ohne npm audit (schnell)
```

### iOS-Build mit Personal Team (kostenloses Apple-ID-Team)

Falls Xcode meldet, dass das Provisioning Profile wegen `com.apple.developer.applesignin` oder `com.apple.developer.usernotifications.filter` nicht erstellt werden kann:

- Diese Entitlements sind für ein Personal Team nicht verfügbar (erfordern Apple Developer Program).
- Sie wurden aus `BoardGameTools/BoardGameTools/BoardGameTools.entitlements` entfernt, damit der Build mit einem kostenlosen Team funktioniert.
- Für Release/Sign in with Apple/Push-Notifications muss ein kostenpflichtiger Apple Developer Account verwendet und die Capabilities wieder in den Entitlements aktiviert werden.

### Nach einem Dependency-Update

1. `npm run typecheck` ausführen (kritisch bei TypeScript-/Prisma-Major-Updates)
2. `npm run lint` ausführen (ESLint-Regeln können sich mit Major-Versionen ändern)
3. `npm run test` ausführen
4. `npm run build` ausführen
5. `npm audit` prüfen und bekannte Restrisiken in `docs/code-reviews/security.md` dokumentieren

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
