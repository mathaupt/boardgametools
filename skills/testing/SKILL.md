---
name: testing
description: Testing-Strategie und Konventionen – Definiert Unit-, Integrations- und E2E-Test-Standards, Mocking-Patterns, Abdeckungsziele und CI-Integration fuer BoardGameTools.
metadata:
  author: boardgametools
  version: "1.0"
---

# Testing – Verbindliche Regeln

> Dieses Skill-Dokument definiert die Testing-Strategie, Konventionen und Qualitaetsstandards fuer BoardGameTools.
> Alle neuen Features und Aenderungen MUESSEN diese Regeln einhalten.

---

## 1. Grundsaetze

### Test-Pyramide

BoardGameTools folgt der klassischen Test-Pyramide. Die Basis bilden schnelle, isolierte Unit Tests. Weniger, aber gezieltere E2E Tests sichern die kritischen Nutzerflows ab.

```
        /  E2E  \          wenige, langsam, teuer
       /----------\
      / Integration \      API-Route-Tests (geplant)
     /----------------\
    /    Unit Tests     \  viele, schnell, isoliert
   /____________________\
```

| Ebene       | Werkzeug              | Anzahl  | Ausfuehrungszeit | Wo                  |
|-------------|-----------------------|---------|------------------|---------------------|
| Unit        | Vitest 4.x            | 188+    | < 5 Sekunden     | `tests/unit/lib/`   |
| Integration | Vitest (geplant)      | --      | --               | `tests/unit/api/`   |
| E2E         | CodeceptJS + Playwright | wenige | 30-60 Sekunden   | `tests/e2e/`        |

### Kernprinzipien

| Prinzip               | Beschreibung                                                                 |
|-----------------------|------------------------------------------------------------------------------|
| **Isolation**         | Jeder Test ist unabhaengig. Kein Test darf von der Reihenfolge oder dem Ergebnis eines anderen Tests abhaengen. |
| **AAA-Pattern**       | Jeder Test folgt dem Aufbau: Arrange (Vorbereitung), Act (Ausfuehrung), Assert (Pruefung). |
| **Determinismus**     | Tests liefern bei jedem Lauf das gleiche Ergebnis. Keine Abhaengigkeit von Zeitstempeln, Zufallswerten oder externen Diensten. |
| **Schnelligkeit**     | Die gesamte Unit-Test-Suite laeuft in unter 10 Sekunden. Langsame Tests blockieren den Entwicklungsfluss. |
| **Lesbarkeit**        | Test-Beschreibungen dokumentieren das erwartete Verhalten. Ein fehlgeschlagener Test muss sofort zeigen, WAS kaputt ist. |
| **Keine Seiteneffekte** | Tests veraendern weder Dateisystem noch Datenbank noch globalen State dauerhaft. `beforeEach`/`afterEach` stellt den Ausgangszustand wieder her. |

### AAA-Pattern – Beispiel

```typescript
import { describe, it, expect } from "vitest";
import { validateString } from "@/lib/validation";

describe("validateString", () => {
  it("gibt Fehler zurueck bei ueberschrittener Maximallaenge", () => {
    // Arrange
    const input = "a".repeat(501);
    const feldname = "Name";

    // Act
    const result = validateString(input, feldname);

    // Assert
    expect(result).toBe("Name darf maximal 500 Zeichen lang sein");
  });
});
```

---

## 2. Unit-Test-Strategie

### Was wird getestet

| Kategorie              | Beispiel-Dateien                                      | Prioritaet |
|------------------------|-------------------------------------------------------|------------|
| Utility-Funktionen     | `validation.ts`, `crypto.ts`, `utils.ts`              | MUSS       |
| Business-Logik         | `public-event.ts`, `event-share.ts`, `group-share.ts`, `public-link.ts`, `password-reset.ts` | MUSS |
| Infrastruktur          | `db.ts`, `cache.ts`, `rate-limit.ts`, `storage.ts`, `logger.ts`, `api-logger.ts`, `mailer.ts` | MUSS |
| Konfiguration          | `env.ts`, `changelog.ts`, `faq.ts`                    | SOLL       |
| Externe Integrationen  | `bgg.ts` (mit Mocks)                                  | MUSS       |
| Security               | `security-check` (via Test-Wrapper)                    | MUSS       |

### Aktueller Stand: 20 von 22 lib-Dateien getestet

| Datei              | Test vorhanden | Anmerkung                                            |
|--------------------|----------------|------------------------------------------------------|
| `api-logger.ts`    | Ja             | --                                                   |
| `bgg.ts`           | Ja             | Fetch-Mocking fuer BGG-API                           |
| `cache.ts`         | Ja             | --                                                   |
| `changelog.ts`     | Ja             | --                                                   |
| `crypto.ts`        | Ja             | --                                                   |
| `db.ts`            | Ja             | Prisma-Client-Mock                                   |
| `env.ts`           | Ja             | Umgebungsvariablen-Mocking                           |
| `event-share.ts`   | Ja             | --                                                   |
| `faq.ts`           | Ja             | --                                                   |
| `group-share.ts`   | Ja             | --                                                   |
| `logger.ts`        | Ja             | --                                                   |
| `mailer.ts`        | Ja             | --                                                   |
| `password-reset.ts`| Ja             | --                                                   |
| `public-event.ts`  | Ja             | --                                                   |
| `public-link.ts`   | Ja             | --                                                   |
| `rate-limit.ts`    | Ja             | Fake Timers fuer Zeitfenster-Tests                   |
| `storage.ts`       | Ja             | --                                                   |
| `utils.ts`         | Ja             | --                                                   |
| `validation.ts`    | Ja             | Umfangreichste Suite (String, Number, Email, URL, Date, Enum) |
| `security-check`   | Ja             | Shell-Script via Test-Wrapper                        |
| `admin-create.ts`  | **Nein**       | Schwer testbar: externe Abhaengigkeiten (DB, Hashing)|
| `auth.ts`          | **Nein**       | Schwer testbar: NextAuth-Konfiguration, Session-Management |

### Vitest-Konfiguration

Die zentrale Konfiguration liegt in `vitest.config.ts`:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Wichtige Einstellungen:**

| Einstellung          | Wert                                        | Grund                                     |
|----------------------|---------------------------------------------|-------------------------------------------|
| `environment`        | `jsdom`                                     | DOM-APIs fuer Komponenten-Tests verfuegbar|
| `globals`            | `true`                                      | `describe`, `it`, `expect` ohne Import    |
| `setupFiles`         | `./tests/setup.ts`                          | `@testing-library/jest-dom` Matcher       |
| `coverage.provider`  | `v8`                                        | Schnelle native Coverage-Erfassung        |
| `alias @`            | `./src`                                     | Gleiche Pfadaufloesung wie in Next.js     |

### Test-Befehle

```bash
# Alle Unit Tests einmalig ausfuehren
npm run test

# Unit Tests im Watch-Modus (Entwicklung)
npm run test:watch

# Unit Tests mit Coverage-Report
npm run test:coverage

# E2E Tests (erfordert laufenden Dev-Server)
npm run test:e2e

# E2E Tests headless (CI)
npm run test:e2e:headless
```

---

## 3. E2E-Test-Strategie

### CodeceptJS + Playwright Setup

Die E2E-Konfiguration liegt in `tests/e2e/codecept.conf.ts`:

```typescript
// tests/e2e/codecept.conf.ts (vereinfacht)
export const config = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost:3000",
      show: false,
      waitForNavigation: "networkidle0",
    },
  },
  include: {
    I: "./steps_file",
  },
  name: "boardgametools-e2e",
};
```

### CodeceptJS-Konventionen

| Konvention             | Regel                                                      |
|------------------------|------------------------------------------------------------|
| Dateinamen             | `*_test.ts` (Unterstrich, nicht Punkt)                     |
| Feature-Beschreibung   | Englisch, beschreibt den getesteten Bereich                |
| Scenario-Beschreibung  | Englisch, beschreibt das erwartete Nutzerverhalten         |
| Selektoren             | CSS-Selektoren bevorzugen, `data-testid` fuer instabile Elemente |
| Wartezeiten            | `waitForText` oder `waitForElement` statt fester `pause()` |

### Wann E2E Tests schreiben

| Situation                                      | E2E Test? | Begruendung                                |
|------------------------------------------------|-----------|--------------------------------------------|
| Neuer kritischer Nutzerflow (Login, Registrierung) | Ja     | Absicherung der wichtigsten Pfade          |
| Komplexe mehrstufige Interaktion (Voting-Flow) | Ja        | Unit Tests koennen die Integration nicht pruefen |
| Einfache CRUD-Operation                        | Nein      | Unit Tests fuer Logik + manueller Smoke-Test genuegt |
| Rein visuelle Aenderung (Farbe, Abstand)       | Nein      | Kein funktionaler Test noetig              |
| API-Endpoint ohne UI                           | Nein      | API-Integrations-Test statt E2E            |

### Vorhandene E2E Tests

| Datei            | Getestete Flows                                          |
|------------------|----------------------------------------------------------|
| `auth_test.ts`   | Login-Seite, Registrierungs-Seite, Navigation, Fehlermeldung |
| `games_test.ts`  | Spieleverwaltung-Flows                                   |

---

## 4. Test-Abdeckungsziele

### Zielwerte nach Schicht

| Schicht                      | Ziel-Coverage | Aktuell       | Strategie                                |
|------------------------------|---------------|---------------|------------------------------------------|
| `src/lib/` (Business-Logik)  | **90%+**      | 20/22 Dateien | Jede lib-Datei hat eine eigene Test-Datei |
| `src/components/` (UI)       | Key Interactions | --         | Interaktive Komponenten mit Testing Library |
| `src/app/api/` (API Routes)  | Kritische Pfade | --          | Integrations-Tests fuer Auth, Validierung |
| E2E (Nutzerflows)            | Kern-Flows    | 2 Dateien     | Login, Game CRUD, Event-Voting           |

### Coverage-Report

```bash
npm run test:coverage
```

| Format | Ort                      | Verwendung                        |
|--------|--------------------------|-----------------------------------|
| `text` | Terminal-Ausgabe          | Schnelle Uebersicht beim Entwickeln |
| `json` | `coverage/coverage.json` | CI-Integration, Trend-Tracking    |
| `html` | `coverage/index.html`    | Detaillierte Analyse im Browser   |

---

## 5. Mocking-Patterns

### 5.1 Prisma-Client mocken

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@prisma/client", () => {
  class MockPrismaClient {
    $connect = vi.fn();
    $disconnect = vi.fn();
    user = {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
  }
  return { PrismaClient: MockPrismaClient };
});

describe("db", () => {
  it("exportiert eine Prisma-Client-Instanz", async () => {
    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });
});
```

### 5.2 Externe API mocken (BGG)

```typescript
const originalFetch = global.fetch;

async function loadBGGLib() {
  vi.resetModules();
  return import("@/lib/bgg");
}

describe("BGG API", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("gibt null zurueck bei API-Fehler", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 404 });
    const { fetchBGGGame } = await loadBGGLib();
    expect(await fetchBGGGame("999")).toBeNull();
  });
});
```

### 5.3 Umgebungsvariablen mocken

```typescript
const originalEnv = { ...process.env };

afterEach(() => {
  process.env = originalEnv;
});

it("liest gesetzte Variable", async () => {
  vi.resetModules();
  process.env.CUSTOM_VAR = "custom-value";
  const { getConfig } = await import("@/lib/env");
  expect(getConfig().customVar).toBe("custom-value");
});
```

### 5.4 Timer mocken (Rate Limiting)

```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.resetModules(); });

it("setzt Rate Limit nach Zeitfenster zurueck", async () => {
  const { checkRateLimit } = await import("@/lib/rate-limit");
  for (let i = 0; i < 10; i++) checkRateLimit("ip-test");
  expect(checkRateLimit("ip-test").allowed).toBe(false);
  vi.advanceTimersByTime(60_001);
  expect(checkRateLimit("ip-test").allowed).toBe(true);
});
```

### Mocking-Uebersicht

| Was wird gemockt         | Technik                         | Wiederherstellung           |
|--------------------------|---------------------------------|-----------------------------|
| Prisma Client            | `vi.mock("@prisma/client")`     | `vi.resetModules()`         |
| `global.fetch`           | `global.fetch = vi.fn()`        | `afterEach` + Original      |
| `process.env`            | Direktes Setzen/Loeschen        | `afterEach` + Original-Kopie|
| Timer (`setTimeout`)     | `vi.useFakeTimers()`            | `vi.useRealTimers()`        |
| Console-Ausgaben         | `vi.spyOn(console, "log")`      | `mockRestore()` in afterEach|

---

## 6. Test-Konventionen

### Dateistruktur

```
tests/
  setup.ts                          # Globales Setup (jest-dom Matcher)
  unit/
    lib/
      validation.test.ts            # Tests fuer src/lib/validation.ts
      bgg.test.ts                   # Tests fuer src/lib/bgg.ts
      ...                           # 1:1 Zuordnung zu src/lib/
    api/                            # (geplant) API-Route-Tests
    components/                     # (geplant) Komponenten-Tests
  e2e/
    codecept.conf.ts                # E2E-Konfiguration
    steps_file.ts                   # Custom Steps
    auth_test.ts                    # E2E: Authentication
    games_test.ts                   # E2E: Spieleverwaltung
```

### Namenskonventionen

| Regel                        | Beispiel                                           |
|------------------------------|---------------------------------------------------|
| Unit-Test-Dateiname          | `{modulname}.test.ts` (identisch zum Quellmodul)  |
| E2E-Test-Dateiname           | `{feature}_test.ts` (Unterstrich fuer CodeceptJS) |
| Ort: Unit Tests              | `tests/unit/lib/` (spiegelt `src/lib/`)           |
| Ort: E2E Tests               | `tests/e2e/`                                      |

### describe/it-Struktur

```typescript
describe("validateString", () => {
  describe("required-Validierung", () => {
    it("gibt Fehler zurueck bei fehlendem Pflichtfeld", () => {
      expect(validateString(undefined, "Name")).toBe("Name ist erforderlich");
    });
  });
});
```

### Was in jedem Test stehen MUSS

| Anforderung              | Umsetzung                                                 |
|--------------------------|------------------------------------------------------------|
| Happy Path               | Mindestens ein Test fuer den Standardfall                  |
| Fehlerfall               | Mindestens ein Test fuer ungueltige Eingaben               |
| Grenzwerte               | Tests fuer Randfaelle (leerer String, 0, null, undefined)  |
| Cleanup                  | `afterEach` fuer alle Mocks und globalen Aenderungen       |

---

## 7. Continuous Integration

### Pre-Commit Hook (Husky)

```bash
# .husky/pre-commit
npm run test                          # Alle 188+ Unit-Tests
npm run security-check                # OWASP Security-Pruefung
npm run review-evaluate:regression    # Review-Evaluator mit Regressionserkennung
```

**Konsequenz:** Kein Commit ist moeglich, solange ein Unit Test fehlschlaegt.

### CI-Reihenfolge bei Aenderungen

```
1. Entwickler macht Aenderung
2. git commit --> Pre-Commit Hook
   a) npm run test              (alle 188+ Unit Tests)
   b) npm run security-check    (OWASP Security-Pruefung)
   c) npm run review-evaluate:regression
3. Bei Erfolg: Commit wird erstellt
4. git push --> DB-Backup (automatisch)
```

---

## 8. Bewertungsprozess

### Dokumentation

| Dokument                           | Ort                               | Inhalt                          |
|------------------------------------|------------------------------------|--------------------------------|
| Testing-Skill (dieses Dokument)    | `skills/testing/SKILL.md`          | Strategie, Konventionen, Patterns |
| Coverage-Reports                   | `coverage/` (gitignored)           | HTML/JSON Coverage-Reports      |
| Test-Snapshots                     | `docs/testing/`                    | Periodische Zustandsberichte    |

---

## 9. Checkliste fuer Code-Reviews

### Pflicht-Pruefpunkte

- [ ] Neues Feature = neue Tests. Jede neue `src/lib/`-Datei hat eine zugehoerige Test-Datei.
- [ ] Kein `it.skip` oder `describe.skip` im Code.
- [ ] Kein `it.only` oder `describe.only` eingecheckt.
- [ ] Tests laufen durch: `npm run test` meldet 0 Fehler.
- [ ] Mocks werden aufgeraeumt: Jeder Mock hat ein passendes `afterEach`-Cleanup.
- [ ] Edge Cases abgedeckt: null/undefined, leerer String, Grenzwerte, Fehlerfall.
- [ ] Keine Abhaengigkeit von Testreihenfolge.
- [ ] Coverage sinkt nicht.
- [ ] Bug-Fix = Regressions-Test.

### E2E-spezifisch

- [ ] Keine festen Wartezeiten (`I.wait(5)` verboten).
- [ ] Selektoren stabil (`data-testid` bevorzugen).
- [ ] Test-Daten isoliert (eigene Daten erstellen und aufraeumen).
