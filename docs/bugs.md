# Bug-Tracking Liste

Diese Datei enthält alle gefundenen Bugs mit fortlaufender Nummerierung, Status, und Referenzierung im Changelog.

## Format

```markdown
### [BUG-XXX] Bug-Titel

**Status:** `open` | `in_progress` | `fixed` | `wontfix`  
**Schweregrad:** `critical` | `high` | `medium` | `low`  
**Entdeckt:** YYYY-MM-DD  
**Behoben:** YYYY-MM-DD (falls fixed)  
**Behoben in Version:** X.Y.Z  
**Test geschrieben:** Ja/Nein (Pflicht bei Fix!)

**Beschreibung:**
Detaillierte Beschreibung des Bugs.

**Reproduktion:**
Schritte zum Reproduzieren des Bugs.

**Erwartetes Verhalten:**
Was sollte passieren.

**Tatsächliches Verhalten:**
Was tatsächlich passiert.

**Ursache:**
Root-Cause Analyse (falls bekannt).

**Lösung:**
Beschreibung der Lösung.

**Referenz im Changelog:**
Version X.Y.Z - Fix: [Beschreibung]
```

## Bugs

### [BUG-003] BGG API 401 Unauthorized Error

**Status:** `fixed`  
**Schweregrad:** `high`  
**Entdeckt:** 2026-06-12  
**Behoben:** 2026-06-12  
**Behoben in Version:** 0.45.2  
**Test geschrieben:** Nein (TODO: BGG Auth Test hinzufügen)

**Beschreibung:**
BGG API Suche und Import funktionieren nicht mehr mit 401 Unauthorized Fehler. BGG API hat Authentifizierung für alle Anforderungen eingeführt.

**Reproduktion:**
1. Entwicklungsserver starten
2. Als Benutzer einloggen
3. BGG Suche versuchen (z.B. "spirit island")
4. 401 Unauthorized Fehler vom BGG API

**Erwartetes Verhalten:**
BGG Suche sollte Ergebnisse zurückgeben.

**Tatsächliches Verhalten:**
401 Unauthorized Fehler, Suche schlägt fehl.

**Ursache:**
BGG API erfordert jetzt Authentifizierung für alle Anfragen, aber /api/bgg/route.ts hat BGG_AUTH_TOKEN nicht verwendet.

**Lösung:**
- BGG_AUTH_TOKEN Support zu /api/bgg/route.ts hinzugefügt
- env Import von default auf named import geändert (Build Error Fix)
- .env.local Template mit BGG_AUTH_TOKEN Placeholder erstellt
- Server neu gestartet um Änderungen zu übernehmen

**Referenz im Changelog:**
Version 0.45.2 - Build Error Fix: env Import und BGG Auth Token

---

### [BUG-001] CSRF Validation Failed bei BGG Import

**Status:** `fixed`  
**Schweregrad:** `high`  
**Entdeckt:** 2026-06-12  
**Behoben:** 2026-06-12  
**Behoben in Version:** 0.44.1, 0.45.1, 0.45.3, 0.45.4, 0.45.5, 0.46.1  
**Test geschrieben:** Nein (TODO: CSRF-Test hinzufügen)

**Beschreibung:**
CSRF-Validierung blockierte legitime Same-Origin-POST-Requests vom Browser, einschließlich BGG Import und alle anderen API-POST-Endpoints. Ursprüngliche Lösung mit Origin-Header war unzureichend, da nicht alle POST-Requests abgedeckt waren.

**Reproduktion:**
1. Entwicklungsserver starten
2. Als Benutzer einloggen
3. Beliebige POST-Request an API ausführen (z.B. Spiel erstellen, BGG Import)
4. 403 "CSRF validation failed" Fehler

**Erwartetes Verhalten:**
Alle legitimen POST-Requests von der Anwendung sollten funktionieren.

**Tatsächliches Verhalten:**
403 "CSRF validation failed" Fehler für alle POST-Requests ohne Origin-Header.

**Ursache:**
CSRF-Validierung in proxy.ts erforderte Origin/Referer Header für alle POST-Requests, aber Browser senden diese nicht automatisch für alle Requests. Die vorherige Lösung mit Origin-Header war unzureichend. Das Hauptproblem war der Port-Vergleich (3000 vs 3001) im Host-Header.

**Lösung:**
- CSRF-Validierung weiter liberalisiert: Requests ohne Origin/Referer werden als Same-Origin angesehen
- Browsers senden Origin/Referer nur für Cross-Origin-Requests
- Port-agnostischer Hostname-Vergleich implementiert
- Origin-Header zu allen BGG Import POST-Requests hinzugefügt (4 Locations)
- Origin-Header zu anderen wichtigen POST-Requests hinzugefügt (upload, group-publish)
- Cross-Origin-Requests bleiben geschützt

**Referenz im Changelog:**
Version 0.44.1 - Fix: CSRF validation failed error for BGG import and POST requests
Version 0.45.1 - Fix: CSRF Fix vervollständigt: Alle BGG Import Locations
Version 0.45.3 - CSRF Validation: Same-Origin komplett ausgenommen
Version 0.45.4 - CSRF Validation temporär deaktiviert
Version 0.45.5 - CSRF Validation wieder aktiviert mit Port-Fix
Version 0.46.1 - CSRF Validation: Requests ohne Origin/Referer erlaubt

---

### [BUG-002] Test-Login Credentials in README nicht funktionieren

**Status:** `fixed`  
**Schweregrad:** `medium`  
**Entdeckt:** 2026-06-12  
**Behoben:** 2026-06-12  
**Behoben in Version:** 0.44.0  
**Test geschrieben:** Nein (TODO: Registration-Flow-Test hinzufügen)

**Beschreibung:**
Die in der README dokumentierten Test-Anmeldedaten (test@example.com / password123) funktionierten nicht, da der Test-Benutzer nicht automatisch in der Datenbank existiert.

**Reproduktion:**
1. README Anweisungen befolgen
2. Versuchen, sich mit test@example.com / password123 einzuloggen
3. "Ungültige Anmeldedaten" Fehler

**Erwartetes Verhalten:**
Test-Benutzer sollte existieren und login sollte funktionieren.

**Tatsächliches Verhalten:**
Test-Benutzer existiert nicht, Login schlägt fehl.

**Ursache:**
README suggerierte existierende Test-Credentials, aber es gab keinen Mechanismus um den Test-Benutzer automatisch zu erstellen.

**Lösung:**
- README aktualisiert mit klaren Anweisungen zur Test-Benutzer-Erstellung
- npm script db:seed:test-user hinzugefügt
- Anleitung auf Browser-Registrierung statt API/curl geändert

**Referenz im Changelog:**
Version 0.44.0 - docs: fix README test credentials and update project info

---

### [BUG-004] iOS-Logout führt zu 500 Internal Server Error

**Status:** `fixed`  
**Schweregrad:** `high`  
**Entdeckt:** 2026-08-10  
**Behoben:** 2026-08-10  
**Behoben in Version:** 0.50.6  
**Test geschrieben:** Ja

**Beschreibung:**
Das Abmelden in der iOS-App führte zu einem 500er Fehler, weil der Logout-Endpoint einen JSON-Body mit `accessToken` erwartete, die App aber nur den `Authorization: Bearer <token>` Header sendete.

**Reproduktion:**
1. iOS-App mit Live-URL `https://boardgametools.vercel.app` verbinden
2. Einloggen
3. "Abmelden" in den Einstellungen tippen
4. Server antwortet mit 500 und `SyntaxError: Unexpected end of JSON input`

**Erwartetes Verhalten:**
Logout sollte auch mit leerem Body über den Authorization-Header funktionieren.

**Tatsächliches Verhalten:**
500 Internal Server Error, da `request.json()` bei leerem Body fehlschlug und der Fehler nicht abgefangen wurde.

**Ursache:**
`/api/mobile/v1/auth/logout/route.ts` rief `await request.json()` ohne Fehlerbehandlung auf. Bei leerem Body liefert Next.js einen `SyntaxError`, der als `Unexpected error` geloggt und als 500 zurückgegeben wurde.

**Lösung:**
- JSON-Body-Parsing in `try/catch` eingebettet
- Fallback auf `Authorization: Bearer <token>` Header implementiert
- 401 zurückgeben, wenn weder Body noch Header einen Token enthalten
- Unit-Tests für Body, Header und fehlenden Token ergänzt

**Referenz im Changelog:**
Version 0.50.6 - Mobile Logout akzeptiert Token aus Authorization-Header und leere Bodies

---

### [BUG-005] /api/health zeigt Version "unknown" an

**Status:** `fixed`  
**Schweregrad:** `low`  
**Entdeckt:** 2026-08-10  
**Behoben:** 2026-08-10  
**Behoben in Version:** 0.50.6  
**Test geschrieben:** Nein

**Beschreibung:**
Der Health-Check Endpoint gab `"version":"unknown"` zurück, weil Vercel `process.env.npm_package_version` nicht setzt.

**Reproduktion:**
1. `curl https://boardgametools.vercel.app/api/health`
2. Antwort enthält `"version":"unknown"`

**Erwartetes Verhalten:**
Version sollte die aus `package.json` enthalten.

**Tatsächliches Verhalten:**
Version ist "unknown".

**Ursache:**
`process.env.npm_package_version` ist in der Vercel-Runtime nicht verfügbar.

**Lösung:**
Version wird jetzt beim Modul-Load aus `package.json` gelesen (`readFileSync`).

**Referenz im Changelog:**
Version 0.50.6 - /api/health liest die App-Version direkt aus package.json

---

## Statistik

- **Offene Bugs:** 0
- **In Bearbeitung:** 0
- **Behoben:** 5
- **Wontfix:** 0
- **Gesamt:** 5