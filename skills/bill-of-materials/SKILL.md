---
name: bill-of-materials
description: Technologie-Inventar und Abhaengigkeits-Verwaltung – Dokumentiert alle Frameworks, Libraries, Services und deren Versionen. Definiert Regeln fuer Updates, Lizenz-Compliance und den Bewertungsprozess neuer Abhaengigkeiten.
metadata:
  author: BoardGameTools Team
  version: "1.0"
---

# Bill of Materials (BOM) -- Technologie-Inventar

## Grundsaetze

### Warum ein BOM wichtig ist

1. **Sicherheitsgrundlage**: Bei einem CVE muss sofort klar sein, ob das Projekt betroffen ist.
2. **Lizenz-Compliance**: Inkompatible Lizenzen (GPL, AGPL) koennen rechtliche Probleme verursachen.
3. **Update-Planung**: Versionsstande ermoeglichen systematische Update-Zyklen.
4. **Onboarding**: Neue Teammitglieder verstehen sofort den Tech-Stack.
5. **Audit-Faehigkeit**: Technologie-Inventar kann sofort vorgelegt werden.

### Regeln

- Jede neue Abhaengigkeit MUSS vor der Installation im BOM dokumentiert werden
- Abhaengigkeiten ohne klaren Zweck werden abgelehnt
- Doppelte Funktionalitaet ist nicht erlaubt
- Dev-Dependencies gehoeren NICHT in Produktions-Dependencies (`--save-dev`)

---

## Produktions-Dependencies

| Package | Version | Zweck | Lizenz |
|---------|---------|-------|--------|
| `@prisma/client` | ^5.22.0 | Database ORM Client | Apache-2.0 |
| `@radix-ui/react-dialog` | ^1.1.15 | Barrierefreie Dialog/Modal-Primitives | MIT |
| `@radix-ui/react-hover-card` | ^1.1.15 | Hover-Card-Komponente | MIT |
| `@radix-ui/react-toast` | ^1.2.15 | Toast-Benachrichtigungen | MIT |
| `@radix-ui/react-tooltip` | ^1.2.8 | Tooltip-Komponente | MIT |
| `@upstash/ratelimit` | ^2.0.8 | Redis-basiertes Rate Limiting | MIT |
| `@upstash/redis` | ^1.37.0 | Redis-Client (HTTP-basiert, Serverless) | MIT |
| `@vercel/blob` | ^2.3.1 | Cloud-Dateispeicher fuer Uploads | Apache-2.0 |
| `@vercel/speed-insights` | ^2.0.0 | Performance-Monitoring | Apache-2.0 |
| `bcryptjs` | ^3.0.3 | Passwort-Hashing (Bcrypt) | MIT |
| `class-variance-authority` | ^0.7.1 | Komponenten-Varianten (cva) | Apache-2.0 |
| `clsx` | ^2.1.1 | Bedingte CSS-Klassen (<1KB) | MIT |
| `html5-qrcode` | ^2.3.8 | Barcode/QR-Code-Scanner | Apache-2.0 |
| `lucide-react` | ^0.563.0 | Icon-Library (1000+ SVG-Icons) | ISC |
| `next` | ^16.2.1 | React-Framework (App Router) | MIT |
| `next-auth` | ^5.0.0-beta.30 | Authentifizierung (Credentials Provider) | ISC |
| `nodemailer` | ^7.0.13 | E-Mail-Versand (SMTP) | MIT |
| `pg` | ^8.13.1 | PostgreSQL-Treiber | MIT |
| `pino` | ^10.3.1 | Strukturiertes JSON-Logging | MIT |
| `prisma` | ^5.22.0 | Database ORM CLI und Engine | Apache-2.0 |
| `radix-ui` | ^1.4.3 | UI-Primitives-Sammlung | MIT |
| `react` | 19.2.3 | UI-Library (React 19) | MIT |
| `react-dom` | 19.2.3 | React DOM Renderer | MIT |
| `react-is` | ^19.2.4 | React Type-Checking (Peer-Dep recharts) | MIT |
| `recharts` | ^3.8.0 | Chart-Visualisierung | MIT |
| `tailwind-merge` | ^3.5.0 | Tailwind-Klassen-Zusammenfuehrung | MIT |
| `tesseract.js` | ^7.0.0 | OCR-Engine (WebAssembly) | Apache-2.0 |

### Abhaengigkeits-Gruppen

**Kern-Framework:** `next`, `react`, `react-dom`
**Datenbank:** `@prisma/client`, `prisma`, `pg`
**Auth & Sicherheit:** `next-auth`, `bcryptjs`, `@upstash/ratelimit`
**UI-Komponenten:** `@radix-ui/*`, `radix-ui`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
**Infrastruktur:** `@upstash/redis`, `@vercel/blob`, `@vercel/speed-insights`, `nodemailer`, `pino`
**Spezial-Features:** `html5-qrcode`, `tesseract.js`, `recharts`

---

## Entwicklungs-Dependencies

| Package | Version | Zweck | Lizenz |
|---------|---------|-------|--------|
| `@codeceptjs/configure` | ^1.0.6 | CodeceptJS E2E-Konfiguration | MIT |
| `@next/bundle-analyzer` | ^16.2.1 | Bundle-Groessen-Analyse | MIT |
| `@tailwindcss/postcss` | ^4 | Tailwind PostCSS-Plugin | MIT |
| `@testing-library/jest-dom` | ^6.9.1 | DOM-Testing-Matcher | MIT |
| `@testing-library/react` | ^16.3.2 | React-Komponenten-Tests | MIT |
| `@types/bcryptjs` | ^2.4.6 | TypeScript-Typen fuer bcryptjs | MIT |
| `@types/node` | ^20 | TypeScript-Typen fuer Node.js | MIT |
| `@types/nodemailer` | ^7.0.11 | TypeScript-Typen fuer nodemailer | MIT |
| `@types/react` | ^19 | TypeScript-Typen fuer React | MIT |
| `@types/react-dom` | ^19 | TypeScript-Typen fuer React DOM | MIT |
| `@vitejs/plugin-react` | ^5.1.4 | Vite React-Plugin (Vitest) | MIT |
| `ajv` | ^8.17.1 | JSON-Schema-Validierung | MIT |
| `axios` | ^1.7.9 | HTTP-Client (E2E-Tests) | MIT |
| `codeceptjs` | ^3.5.4 | E2E-Test-Framework | MIT |
| `diff` | ^5.2.0 | Text-Diffing-Utility | BSD-3-Clause |
| `eslint` | ^9.18.0 | Statische Code-Analyse | MIT |
| `eslint-config-next` | 16.1.6 | Next.js ESLint-Konfiguration | MIT |
| `husky` | ^9.1.7 | Git-Hooks | MIT |
| `jsdom` | ^28.0.0 | DOM-Emulation (Unit-Tests) | MIT |
| `mocha` | ^10.8.2 | Test-Framework (CodeceptJS) | MIT |
| `playwright` | ^1.58.2 | Browser-Automatisierung (E2E) | Apache-2.0 |
| `shadcn` | ^3.8.5 | UI-Komponenten-Generator | MIT |
| `tailwindcss` | ^4.2.0 | Utility-First CSS-Framework | MIT |
| `tw-animate-css` | ^1.4.0 | Tailwind-Animations | MIT |
| `typescript` | ^5 | TypeScript-Compiler | Apache-2.0 |
| `vitest` | ^4.0.18 | Unit-Test-Framework | MIT |

---

## Infrastruktur und Services

| Service | Zweck | Konfiguration | Kosten-Modell |
|---------|-------|---------------|---------------|
| **Vercel** | Hosting, Deployment, Edge | `vercel.json`, GitHub | Free/Pro |
| **Prisma Postgres** | Managed PostgreSQL | `DATABASE_URL` | Free/Scale |
| **Upstash Redis** | Cache, Rate Limiting | `UPSTASH_REDIS_REST_*` | Free/Pay-per-Request |
| **Vercel Blob** | Datei-Uploads | `BLOB_READ_WRITE_TOKEN` | Free/Pay-per-Storage |
| **SMTP** | E-Mail-Zustellung | `SMTP_*` | Anbieter-abhaengig |
| **BGG API** | Spieldaten-Import | Kein Key erforderlich | Kostenlos |

---

## Technologie-Entscheidungen

### Next.js (App Router, v16)

**Warum:** Server Components, App Router, API Routes, Vercel-Integration, Image/Font Optimization.
**Alternativen evaluiert:** Remix (kleineres Oekosystem), Vite+Express (mehr Boilerplate), SvelteKit (kein React-Oekosystem).

### Prisma (ORM, v5)

**Warum:** Typsicherer DB-Zugriff, deklaratives Schema, automatische Migrationen, Prisma Studio.
**Alternativen evaluiert:** Drizzle (weniger ausgereift), Knex (zu niedrig-level), TypeORM (schlechtere TS-Integration).

### Tailwind CSS (v4)

**Warum:** Utility-First, JIT-Kompilierung, konsistentes Design-System, shadcn/ui-Integration.
**Alternativen evaluiert:** CSS Modules, styled-components (Runtime-Overhead), Vanilla Extract.

### shadcn/ui + Radix

**Warum:** Kopiert ins Projekt (kein Lock-in), WAI-ARIA konform, vollstaendig anpassbar, TypeScript-native.

### Upstash Redis

**Warum:** HTTP-basiert (Serverless-kompatibel), Pay-per-Request, eingebautes Rate-Limiting-SDK.

### Vitest

**Warum:** Native ESM, Jest-kompatible API, Vite-basiert, schnelle Ausfuehrung, eingebaute Coverage.

### Pino

**Warum:** Strukturiertes JSON-Logging, <1ms pro Eintrag, Log-Levels, Vercel-kompatibel.

---

## Update-Policy

### Regelmaessige Updates

| Frequenz | Scope | Verantwortung |
|----------|-------|---------------|
| Woechentlich | `npm audit`, Patch-Updates | Entwickler |
| Monatlich | Minor-Updates evaluieren | Entwickler |
| Quartalsweise | Major-Updates planen | Team |
| Sofort | Kritische CVEs (CVSS >= 7.0) | Alle |

### Update-Prozess

1. `npm outdated` ausfuehren, Changelog lesen
2. Breaking Changes identifizieren
3. Update + `npm run build && npm run test`
4. BOM aktualisieren
5. PR erstellen mit Begruendung

### Pinning-Strategie

- **Exakt:** `react`, `react-dom` (muessen synchron sein)
- **Caret (`^`):** Alle anderen Packages
- **Beta:** `next-auth@5.0.0-beta.30` (bewusstes Risiko)

---

## Lizenz-Compliance

### Erlaubte Lizenzen (Greenlist)

MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Unlicense, CC0-1.0

### Verbotene Lizenzen (Blocklist)

GPL-2.0, GPL-3.0, AGPL-3.0, SSPL, CC-BY-NC, EUPL

### Pruefung

```bash
npm info <package-name> license
npx license-checker --summary
npx license-checker --failOn "GPL-2.0;GPL-3.0;AGPL-3.0;SSPL"
```

### Aktueller Status

Alle Dependencies verwenden ausschliesslich Lizenzen aus der Greenlist. Keine Verstoesse.

---

## Bewertungsprozess fuer neue Abhaengigkeiten

### Bewertungsmatrix

| Kriterium | Akzeptabel | Grenzwertig | Abgelehnt |
|-----------|------------|-------------|-----------|
| Bundle-Groesse | <50KB | 50-200KB | >200KB (ohne Lazy Loading) |
| Letztes Update | <3 Monate | 3-12 Monate | >12 Monate |
| Downloads/Woche | >100K | 10K-100K | <10K |
| Transitive Deps | <10 | 10-30 | >30 |
| Lizenz | Greenlist | -- | Blocklist |
| Bekannte CVEs | 0 | Patches verfuegbar | Ungepatcht |

---

## Regelmaessiger BOM-Review

### Zeitplan

| Intervall | Aktion |
|-----------|--------|
| Bei jedem PR | `npm audit` automatisch |
| Monatlich | `npm outdated` pruefen |
| Quartalsweise | Vollstaendiger BOM-Review |
| Jaehrlich | Strategische Bewertung |

### Review-Befehle

```bash
npm outdated --long
npm audit
npx depcheck
npx license-checker --summary
ANALYZE=true npm run build
npm ls --depth=0
```

---

## Checkliste

### Bei Aenderung an Dependencies

- [ ] Im BOM dokumentiert
- [ ] Lizenz auf Greenlist
- [ ] `npm audit` clean
- [ ] Bundle-Groesse geprueft
- [ ] `npm run build` erfolgreich
- [ ] `npm run test` erfolgreich
- [ ] Dev-Dependency korrekt mit `--save-dev`
- [ ] Keine doppelte Funktionalitaet

### Beim quartalsweisen Review

- [ ] `npm outdated --long` dokumentiert
- [ ] `npm audit` clean
- [ ] `npx depcheck` -- keine ungenutzten Dependencies
- [ ] Lizenzen geprueft
- [ ] Bundle-Analyse durchgefuehrt
- [ ] Versionsnummern aktuell
- [ ] Beta-Dependencies auf Stable geprueft
