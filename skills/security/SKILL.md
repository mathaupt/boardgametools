# Security -- Verbindliche Regeln

> Dieses Skill-Dokument definiert die Sicherheits-Standards fuer BoardGameTools.
> Alle neuen und bestehenden Komponenten MUESSEN diese Regeln einhalten.
> Grundlage: OWASP Top 10 (2021), DSGVO und projektspezifische Anforderungen.

## Grundsaetze

| Prinzip | Beschreibung |
|---------|-------------|
| Defense in Depth | Mehrere Sicherheitsebenen: Validierung im Client UND Server, Auth UND Autorisierung, CSP UND Input Sanitization |
| Least Privilege | Jede Komponente erhaelt nur die minimal noetigen Rechte. Prisma-Queries nutzen `select` statt `include` |
| Fail Secure | Bei Fehlern wird der Zugriff verweigert, nicht gewaehrt. Unbekannte Rollen erhalten keinen Zugriff |
| Zero Trust | Jeder API-Request wird authentifiziert und autorisiert -- auch interne Aufrufe |
| Secure by Default | Neue Routes sind geschuetzt, es sei denn, sie werden explizit als oeffentlich markiert |
| Datensparsamkeit | Nur die tatsaechlich benoetigten Daten werden abgefragt, gespeichert und zurueckgegeben |

---

## 1. OWASP Top 10 Checkliste

### A01 -- Broken Access Control

| Regel | Details |
|-------|---------|
| Auth-Pruefung in jeder API Route | Jede `route.ts` unter `src/app/api/` MUSS `auth()` aus `@/lib/auth` aufrufen |
| 401 vs. 403 unterscheiden | `401 Unauthorized` = nicht eingeloggt, `403 Forbidden` = eingeloggt aber nicht berechtigt |
| Oeffentliche Routes dokumentieren | Routes ohne Auth (z.B. `/api/auth/*`, `/api/health`, `/api/bgg/*`) muessen in `PUBLIC_ROUTES` stehen |
| Admin-Routen schuetzen | Admin-Endpoints pruefen `session.user.role === "ADMIN"` |
| Keine IDOR-Luecken | Objekt-IDs aus der URL immer gegen die Session validieren: "Gehoert diese Ressource dem anfragenden User?" |

```typescript
// Korrekt: Auth + Autorisierung
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const item = await prisma.collection.findUnique({ where: { id: params.id } });
  if (item?.userId !== session.user.id) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }
  // ...
}
```

**Automatische Pruefung:** `security-check.sh --only A01` findet API Routes ohne Auth-Referenz.

---

### A02 -- Cryptographic Failures

| Regel | Details |
|-------|---------|
| Passwoerter nur mit bcrypt hashen | `bcryptjs` mit Standardrunden (10+) verwenden |
| Kein Klartext | Passwoerter NIEMALS als Klartext speichern, loggen oder in Responses zurueckgeben |
| HTTPS erzwingen | Produktionsumgebung ausschliesslich ueber HTTPS (Vercel erzwingt dies automatisch) |
| Keine schwachen Algorithmen | Kein MD5, kein SHA1 fuer sicherheitsrelevante Hashes |
| Tokens mit Ablaufzeit | Reset-Tokens und Einladungs-Tokens muessen eine TTL haben |

```typescript
// Korrekt: bcrypt-Hashing
import bcrypt from "bcryptjs";
const passwordHash = await bcrypt.hash(password, 10);

// VERBOTEN:
const passwordHash = crypto.createHash("md5").update(password).digest("hex");
```

**Automatische Pruefung:** `security-check.sh --only A02` findet Klartext-Passwoerter und schwache Hashes.

---

### A03 -- Injection

| Regel | Details |
|-------|---------|
| Prisma ORM verwenden | Parametrisierte Queries ueber Prisma -- KEIN Raw SQL mit String-Interpolation |
| Kein `eval()` | `eval()` und `new Function()` sind verboten |
| Kein `dangerouslySetInnerHTML` | Wenn unvermeidbar: Input mit DOMPurify sanitizen und Grund im Code dokumentieren |
| Input validieren | Alle Eingaben mit `src/lib/validation.ts` pruefen (26 Routes nutzen dies bereits) |
| URL-Validierung | Externe URLs ueber `validateUrl()` mit Protokoll-Whitelist pruefen |

```typescript
// Korrekt: Prisma-Parameterisierung
const user = await prisma.user.findUnique({
  where: { email: input.email },  // automatisch escaped
});

// VERBOTEN: Raw SQL mit Interpolation
const result = await prisma.$executeRaw`SELECT * FROM users WHERE email = '${email}'`;

// Korrekt: Raw SQL mit Parametern (wenn unbedingt noetig)
const result = await prisma.$executeRaw`SELECT * FROM users WHERE email = ${email}`;
```

**Automatische Pruefung:** `security-check.sh --only A03` findet `eval()`, `dangerouslySetInnerHTML` und Raw SQL.

---

### A04 -- Insecure Design

| Regel | Details |
|-------|---------|
| Debug-Routes hinter NODE_ENV | `/api/debug/*`-Endpoints nur wenn `process.env.NODE_ENV !== "production"` |
| DB-Init-Routes Admin-geschuetzt | `/api/db/init` erfordert Admin-Session |
| Admin-Selbstschutz | Admins koennen sich NICHT selbst herabstufen oder loeschen |
| Fehler-Details nur in Development | Stack-Traces und interne Fehlermeldungen nur wenn `NODE_ENV === "development"` |
| Kein Informationsabfluss | API-Responses enthalten keine Implementierungsdetails (Datenbankstruktur, Library-Versionen) |

```typescript
// Debug-Route mit NODE_ENV-Guard
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Nicht verfuegbar" }, { status: 404 });
  }
  // Debug-Logik...
}
```

**Automatische Pruefung:** `security-check.sh --only A04` findet ungeschuetzte Debug- und Init-Routes.

---

### A05 -- Security Misconfiguration

| Regel | Details |
|-------|---------|
| `.env` in `.gitignore` | `.env` und `.env.local` werden NICHT versioniert; `.env.example` als Vorlage |
| Keine hardcoded Secrets | Secrets kommen aus `process.env`, niemals als String-Literal im Code |
| Security Headers aktiv | CSP, X-Frame-Options, X-Content-Type-Options konfiguriert in `next.config.ts` |
| Kein Wildcard CORS | `Access-Control-Allow-Origin: *` ist verboten |
| Server-Informationen verbergen | `X-Powered-By`-Header wird von Next.js standardmaessig entfernt |

Aktuelle Security Headers in `next.config.ts`:

| Header | Wert | Zweck |
|--------|------|-------|
| `X-Frame-Options` | `DENY` | Clickjacking-Schutz |
| `X-Content-Type-Options` | `nosniff` | MIME-Sniffing verhindern |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer-Informationen einschraenken |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=()` | Browser-APIs einschraenken |
| `Content-Security-Policy` | Siehe unten | XSS- und Injection-Schutz |

**Automatische Pruefung:** `security-check.sh --only A05` findet versionierte `.env`-Dateien, hardcoded Secrets und Wildcard CORS.

---

### A06 -- Vulnerable Components

| Regel | Details |
|-------|---------|
| `npm audit` clean halten | Keine `high` oder `critical` Vulnerabilities in Production-Dependencies |
| Regelmaessige Updates | Dependencies mindestens monatlich pruefen und aktualisieren |
| Lockfile committen | `package-lock.json` MUSS im Repository sein |
| Keine unnoetigen Packages | Nicht verwendete Dependencies entfernen |

```bash
# Pruefung ausfuehren
npm audit --audit-level=high --omit=dev

# Security-Check (enthaelt npm audit)
bash scripts/security-check.sh --only A06

# Ohne npm audit (schneller, z.B. in Pre-Commit)
bash scripts/security-check.sh --no-audit
```

**Automatische Pruefung:** `security-check.sh --only A06` fuehrt `npm audit` aus.

---

### A07 -- Authentication Failures

| Regel | Details |
|-------|---------|
| Rate Limiting auf Auth-Routes | `/api/auth/register` und `/api/auth/password-reset/*` haben Rate Limiting |
| Passwort-Komplexitaet | Mindestens 8 Zeichen, validiert mit `validateString()` |
| Keine Credentials im Code | Passwoerter und API-Keys nur ueber Umgebungsvariablen |
| Session-Management via NextAuth | Keine eigene Session-Implementierung, NextAuth.js v5 verwenden |
| Account-Enumeration verhindern | Login-Fehler: "E-Mail oder Passwort falsch" (nicht "Benutzer existiert nicht") |

```typescript
// Rate Limiting in Auth-Route (src/app/api/auth/register/route.ts)
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`, 5, 60_000);
if (!allowed) return rateLimitResponse(retryAfterMs);
```

**Automatische Pruefung:** `security-check.sh --only A07` findet hardcoded Credentials und Auth-Routes ohne Rate Limiting.

---

### A08 -- Software and Data Integrity

| Regel | Details |
|-------|---------|
| Lockfile vorhanden | `package-lock.json` wird committet und geprueft |
| Husky Pre-Commit Hooks | `prepare`-Script in `package.json` installiert Husky |
| CI/CD-Pipeline | Security-Check laeuft vor jedem Deployment |
| Keine `postinstall`-Skripte aus Drittquellen | `postinstall` in Drittanbieter-Packages kritisch pruefen |

**Automatische Pruefung:** `security-check.sh --only A08` prueft Lockfile und Husky-Konfiguration.

---

### A09 -- Security Logging and Monitoring

| Regel | Details |
|-------|---------|
| API-Logging aktiv | Alle geschuetzten Routes nutzen `withApiLogging()` aus `src/lib/api-logger.ts` |
| 401/403 werden geloggt | Auth-Fehler erzeugen Log-Eintraege mit Status-Code |
| Keine PII in Logs | Logs enthalten userId, NICHT E-Mail, Name oder Passwort |
| Error-Handling ueberall | Try-Catch in jeder Route, 500er-Fehler werden geloggt |
| Log-Retention planen | API-Logs regelmaessig bereinigen (z.B. nach 90 Tagen) |

```typescript
// API-Route mit Logging (empfohlenes Muster)
import { withApiLogging } from "@/lib/api-logger";

export const GET = withApiLogging(async (req: NextRequest) => {
  // ... Business-Logik
  return NextResponse.json(data);
});
```

Die `withApiLogging()`-Funktion protokolliert automatisch:

| Feld | Quelle | PII? |
|------|--------|------|
| `method` | Request | Nein |
| `path` | Request URL | Nein |
| `statusCode` | Response | Nein |
| `durationMs` | Berechnet | Nein |
| `userId` | Session | Nein (opake ID) |
| `userAgent` | Header (max 500 Zeichen) | Gering |
| `ip` | Header | Ja -- nur kurzfristig speichern |
| `errorMessage` | Catch (max 1000 Zeichen) | Nein |

**Automatische Pruefung:** `security-check.sh --only A09` prueft, ob Auth-Fehler geloggt werden und Error-Handling existiert.

---

### A10 -- Server-Side Request Forgery (SSRF)

| Regel | Details |
|-------|---------|
| URL-Validierung pflicht | Externe URLs werden mit `validateUrl()` aus `src/lib/validation.ts` geprueft |
| Allowlist fuer externe APIs | Nur erlaubte Domains: `boardgamegeek.com`, `cf.geekdo-images.com` |
| Keine internen URLs | `fetch()` darf keine `localhost`-, `127.0.0.1`- oder `10.x.x.x`-Adressen aufrufen |
| CSP connect-src | Nur `'self'` und `https://boardgamegeek.com` erlaubt |

```typescript
// Korrekt: URL gegen Allowlist pruefen
const ALLOWED_HOSTS = ["boardgamegeek.com", "www.boardgamegeek.com"];

function isAllowedUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" && ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
```

**Automatische Pruefung:** `security-check.sh --only A10` findet dynamische Fetch-URLs mit Template-Literalen.

---

## 2. Datenschutz / DSGVO

| Regel | Details |
|-------|---------|
| Keine PII in Logs | `console.log` darf KEINE E-Mails, Namen oder Passwoerter enthalten |
| Keine PII in URL-Parametern | Sensible Daten gehoeren in den Request-Body (POST), nicht in Query-Strings |
| Passwort-Hashing | Alle Passwoerter werden mit `bcryptjs` gehasht gespeichert |
| Datensparsamkeit | Prisma-Queries geben nur benoetigte Felder zurueck (siehe Abschnitt 3) |
| Zweckbindung | Personenbezogene Daten werden nur fuer den angegebenen Zweck verwendet |
| Loeschbarkeit | Nutzer muessen ihr Konto und alle zugehoerigen Daten loeschen koennen |
| Keine externen Tracker | Keine Analytics-Dienste ohne vorherige Einwilligung einbinden |

```typescript
// VERBOTEN: PII in Logs
console.log("Registrierung:", email, password);
console.log("Session:", JSON.stringify(session));

// ERLAUBT: Anonyme Log-Meldungen
console.log("Registrierung fehlgeschlagen fuer userId:", userId);
console.error("Auth-Fehler, Status 401");
```

**Automatische Pruefung:** `security-check.sh --only PII` findet `console.log` mit sensiblen Variablen und PII in URL-Parametern.

---

## 3. Prisma-Sicherheitsregeln

### Grundregel: NIEMALS `include: { user: true }`

Prisma's `include` laedt ALLE Felder der Relation, einschliesslich `passwordHash`. Stattdessen immer `select` verwenden.

```typescript
// VERBOTEN -- gibt passwordHash zurueck:
const collection = await prisma.collection.findUnique({
  where: { id },
  include: { user: true },
});

// KORREKT -- nur benoetigte Felder:
const collection = await prisma.collection.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    user: {
      select: {
        id: true,
        name: true,
        // KEIN email, KEIN passwordHash
      },
    },
  },
});
```

### Prisma-Sicherheits-Checkliste

| Regel | Beschreibung |
|-------|-------------|
| Kein `include: { user: true }` | Immer `select` mit expliziten Feldern verwenden |
| `passwordHash` nie in Responses | Weder direkt noch ueber Relationen zurueckgeben |
| `email` nur wenn noetig | E-Mail-Adressen nur in Profil- und Account-Routen zurueckgeben |
| Pagination erzwingen | `findMany` immer mit `take` und `skip` begrenzen (max 100) |
| Where-Clauses pruefen | Bei nutzerspezifischen Daten immer `userId` in der Where-Clause |
| Soft-Delete bevorzugen | Datensaetze markieren statt endgueltig loeschen (Audit-Trail) |

---

## 4. Security Headers

Die Security Headers sind in `next.config.ts` konfiguriert und gelten fuer alle Routes:

### Content-Security-Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://cf.geekdo-images.com;
font-src 'self';
connect-src 'self' https://boardgamegeek.com;
frame-ancestors 'none'
```

| Direktive | Erlaubt | Zweck |
|-----------|---------|-------|
| `default-src` | `'self'` | Fallback fuer nicht definierte Direktiven |
| `script-src` | `'self' 'unsafe-eval' 'unsafe-inline'` | Next.js benoetigt dies zur Laufzeit |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind CSS Inline-Styles |
| `img-src` | `'self' data: blob: https://cf.geekdo-images.com` | Lokale + BoardGameGeek-Bilder |
| `connect-src` | `'self' https://boardgamegeek.com` | API-Aufrufe nur zu erlaubten Domains |
| `frame-ancestors` | `'none'` | Einbettung verhindern (wie X-Frame-Options) |

### Weitere Headers

| Header | Wert | Konfiguration |
|--------|------|---------------|
| `X-Frame-Options` | `DENY` | `next.config.ts` |
| `X-Content-Type-Options` | `nosniff` | `next.config.ts` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `next.config.ts` |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=()` | `next.config.ts` |

### Regeln fuer Header-Aenderungen

- CSP-Aenderungen MUESSEN dokumentiert und begruendet werden
- Neue externe Domains in `connect-src` oder `img-src` erfordern ein Review
- `'unsafe-eval'` und `'unsafe-inline'` sollen langfristig durch Nonce-basiertes CSP ersetzt werden

---

## 5. Rate Limiting

Rate Limiting ist ueber `src/lib/rate-limit.ts` implementiert:

| Schicht | Technologie | Details |
|---------|-------------|---------|
| Primaer | `@upstash/ratelimit` + Redis | Verteiltes Rate Limiting fuer Produktionsumgebung |
| Fallback | In-Memory Map | Fuer lokale Entwicklung ohne Redis |

### Geschuetzte Routes

| Route | Limit | Zeitfenster | Identifier |
|-------|-------|-------------|------------|
| `/api/auth/register` | 5 Requests | 60 Sekunden | IP-Adresse |
| `/api/auth/password-reset/confirm` | 5 Requests | 60 Sekunden | IP-Adresse |

### Regeln

| Regel | Details |
|-------|---------|
| Auth-Routes immer limitieren | Alle Registrierungs-, Login- und Passwort-Reset-Endpoints |
| IP-basiert identifizieren | `x-forwarded-for`-Header auswerten (Vercel setzt diesen) |
| 429-Response zurueckgeben | `rateLimitResponse()` sendet 429 mit `Retry-After`-Header |
| Fallback sicherstellen | In-Memory-Map springt ein wenn Redis nicht erreichbar ist |
| Map-Groesse begrenzen | Maximale Eintraege und automatische Bereinigung alle 60 Sekunden |

```typescript
// Rate Limiting einbinden
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`, 5, 60_000);
if (!allowed) return rateLimitResponse(retryAfterMs);
```

---

## 6. Automatisierte Pruefungen

### security-check.sh

Das Hauptwerkzeug fuer Security-Pruefungen: `scripts/security-check.sh`

```bash
# Alle Checks ausfuehren
bash scripts/security-check.sh

# Einzelnen Check ausfuehren
bash scripts/security-check.sh --only A03

# Strict Mode (Warnungen = Fehler)
bash scripts/security-check.sh --strict

# JSON-Ausgabe (fuer CI/CD)
bash scripts/security-check.sh --json

# Ohne npm audit (schnellere Ausfuehrung)
bash scripts/security-check.sh --no-audit

# Verfuegbare Checks auflisten
bash scripts/security-check.sh --list
```

| Check | Kategorie | Prueft |
|-------|-----------|--------|
| A01 | Broken Access Control | API Routes ohne Auth-Referenz |
| A02 | Cryptographic Failures | Klartext-Passwoerter, MD5/SHA1 |
| A03 | Injection | `eval()`, `dangerouslySetInnerHTML`, Raw SQL |
| A04 | Insecure Design | Debug-Routes, ungeschuetzte Init-Endpoints |
| A05 | Security Misconfiguration | `.env` versioniert, hardcoded Secrets, Wildcard CORS |
| A06 | Vulnerable Components | `npm audit` (High/Critical) |
| A07 | Authentication Failures | Hardcoded Credentials, Rate Limiting |
| A08 | Data Integrity | Lockfile, Husky Pre-Commit |
| A09 | Logging & Monitoring | Auth-Fehler-Logging, Error Handling |
| A10 | SSRF | Dynamische Fetch-URLs |
| PII | Datenschutz / DSGVO | PII in Logs, sensible Daten in URL-Params |

### review-evaluate.mjs

Das Review-Skript `scripts/review-evaluate.mjs` enthaelt einen Security-Block, der folgende Punkte prueft:

- Fehlende Security Headers (CSP, X-Frame-Options, X-Content-Type-Options)
- Ergebnis wird in die Gesamtbewertung des Projekts einbezogen

---

## 7. Bewertungsprozess

### Security-Check durchfuehren

```bash
# 1. Vollstaendigen Security-Check starten
bash scripts/security-check.sh

# 2. Ergebnis als JSON fuer Dokumentation
bash scripts/security-check.sh --json > docs/security/check-$(date +%Y%m%d).json

# 3. Bericht pruefen
cat security-report.md
```

### Ergebnisse dokumentieren

Sicherheits-Berichte werden in `docs/security/` abgelegt:

| Datei | Inhalt |
|-------|--------|
| `docs/security/check-YYYYMMDD.json` | JSON-Ausgabe des Security-Checks |
| `security-report.md` | Letzte Zusammenfassung (wird bei jedem Lauf ueberschrieben) |

### Regelmaessiger Zeitplan

| Aktion | Haeufigkeit |
|--------|------------|
| `security-check.sh` ausfuehren | Vor jedem Commit (via Husky Pre-Commit Hook) |
| `npm audit` pruefen | Woechentlich und vor jedem Release |
| Dependencies aktualisieren | Monatlich |
| CSP-Policy reviewen | Bei jeder neuen externen Integration |
| Sicherheits-Dokumentation aktualisieren | Bei jeder relevanten Aenderung |

---

## 8. Checkliste fuer Code-Reviews

Jede Pull Request / jeder Code-Review MUSS folgende Punkte pruefen:

### Authentifizierung und Autorisierung

- [ ] Ruft die API-Route `auth()` auf und prueft die Session?
- [ ] Werden 401 (nicht eingeloggt) und 403 (nicht berechtigt) korrekt unterschieden?
- [ ] Wird bei nutzerspezifischen Daten die `userId` gegen die Session geprueft?
- [ ] Sind Admin-Endpoints mit Rollen-Pruefung geschuetzt?

### Eingabevalidierung

- [ ] Werden alle Request-Parameter mit `src/lib/validation.ts` validiert?
- [ ] Sind String-Laengen begrenzt (max 500 Zeichen Standard)?
- [ ] Werden Enum-Werte gegen eine Whitelist geprueft?
- [ ] Werden externe URLs gegen die Allowlist validiert?

### Datenbank-Zugriffe

- [ ] Verwendet die Query `select` statt `include` bei User-Relationen?
- [ ] Wird `passwordHash` in KEINER Response zurueckgegeben?
- [ ] Hat `findMany` eine Pagination (`take`/`skip`)?
- [ ] Enthaelt die Where-Clause die `userId` bei nutzerspezifischen Daten?

### Datenschutz

- [ ] Enthaelt kein `console.log` mit E-Mail, Passwort oder Session-Daten?
- [ ] Werden sensible Daten per POST (nicht GET) uebertragen?
- [ ] Wird nur der minimal noetige Datensatz zurueckgegeben?

### Sicherheitskonfiguration

- [ ] Sind keine Secrets als String-Literale im Code?
- [ ] Sind keine neuen Dependencies mit bekannten Vulnerabilities hinzugefuegt?
- [ ] Ist kein `eval()`, `new Function()` oder `dangerouslySetInnerHTML` enthalten?
- [ ] Haben Debug-Endpoints einen `NODE_ENV`-Guard?

### Logging und Fehlerbehandlung

- [ ] Nutzt die Route `withApiLogging()` fuer automatisches Logging?
- [ ] Ist ein Try-Catch-Block vorhanden, der 500er-Fehler abfaengt?
- [ ] Werden keine Stack-Traces oder interne Details an den Client gesendet?

### Rate Limiting

- [ ] Haben neue Auth-Endpoints Rate Limiting via `checkRateLimit()`?
- [ ] Ist der Identifier sinnvoll gewaehlt (IP oder UserId)?
