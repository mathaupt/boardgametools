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

### [BUG-006] iOS-App: Abmelden bei API-URL-Wechsel nicht möglich

**Status:** `fixed`  
**Schweregrad:** `high`  
**Entdeckt:** 2026-08-10  
**Behoben:** 2026-08-10  
**Behoben in Version:** 0.50.7  
**Test geschrieben:** Nein

**Beschreibung:**
Wenn die API-URL in den iOS-Einstellungen geändert wurde, war ein anschließendes Abmelden nicht möglich. Der Logout-Request lief gegen die neue URL mit dem alten Token, der Server antwortete mit 401, und die App blieb im authentifizierten Zustand hängen. Ohne Abmelden war kein erneutes Anmelden möglich.

**Reproduktion:**
1. iOS-App einloggen (z. B. gegen `http://localhost:3000`)
2. Einstellungen öffnen
3. API-URL auf `https://boardgametools.vercel.app` ändern
4. "Speichern" tippen
5. "Abmelden" tippen
6. Fehlermeldung "Nicht autorisiert. Bitte melde dich erneut an."

**Erwartetes Verhalten:**
Beim Wechsel der API-URL oder bei ungültigem Token sollte die App den lokalen Sitzungszustand bereinigen und zur Login-Maske zurückkehren.

**Tatsächliches Verhalten:**
`AuthManager.logout()` versuchte zuerst den Server-Logout und warf einen Fehler, bevor die lokalen Tokens gelöscht und `isAuthenticated` auf `false` gesetzt wurden. Die App blieb im eingeloggten Zustand.

**Ursache:**
`AuthManager.logout()` und `logoutAll()` verlangten einen erfolgreichen Server-Request, bevor lokale Tokens und UI-Zustand zurückgesetzt wurden. Bei geänderter URL war das Token für den neuen Backend ungültig, sodass der Server-Request fehlschlug und die lokale Bereinigung nie ausgeführt wurde.

**Lösung:**
- `AuthManager.logout()` und `logoutAll()` verwenden `try?` für den Server-Request und löschen anschließend immer lokale Tokens sowie `isAuthenticated`/`currentUser`.
- In `SettingsView` führt das Speichern einer neuen API-URL automatisch ein lokales Abmelden aus, bevor die neue URL gespeichert wird.

**Referenz im Changelog:**
Version 0.50.7 - iOS-App: Abmelden bei API-URL-Wechsel

---

### [BUG-007] PostgreSQL SSL-Warnung beim App-Start

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.8
**Test geschrieben:** Nein

**Beschreibung:**
Beim Start der Next.js-Runtime erscheint eine Warnung von `pg-connection-string`: `sslmode=require/prefer/verify-ca` werden als Alias für `verify-full` behandelt und ändern sich in zukünftigen Major-Versionen.

**Reproduktion:**
1. App mit `SQL_DATABASE_URL` oder `DATABASE_URL` starten, die `sslmode=require` (oder `prefer`/`verify-ca`) enthält.
2. Server-Logs zeigen `(node) Warning: SECURITY WARNING: ... sslmode ...`.

**Erwartetes Verhalten:**
Keine Warnung, Verhalten bleibt beim aktuellen `verify-full`.

**Tatsächliches Verhalten:**
Warnung wird bei jeder Verbindungsaufnahme ausgegeben.

**Ursache:**
Prisma/Adapter `pg` übergibt den Connection-String unverändert an `pg-connection-string`, das die Werte als Alias interpretiert.

**Lösung:**
`env.ts` normalisiert `sslmode=require/prefer/verify-ca` auf `sslmode=verify-full`, bevor der Connection-String an `PrismaPg` übergeben wird. Das entspricht dem aktuellen Verhalten des Treibers.

**Referenz im Changelog:**
Version 0.50.8 - Fix: PostgreSQL SSL-Warnung normalisiert

---

### [BUG-008] iOS-App: Spiel-Löschen führt trotz korrekter ID zu 404

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.8
**Test geschrieben:** Ja

**Beschreibung:**
Beim Löschen eines Spiels aus der iOS-Detailansicht antwortet `DELETE /api/mobile/v1/games/{id}` mit 404 `Game not found`, obwohl die ID korrekt ist und das Spiel in der lokalen Liste sichtbar ist.

**Reproduktion:**
1. iOS-App öffnen und ein Spiel aus der Liste wählen.
2. "Löschen" bestätigen.
3. Server antwortet mit 404.

**Erwartetes Verhalten:**
Spiel wird gelöscht (bzw. als bereits gelöscht bestätigt) und die App kehrt zur Spieleliste zurück.

**Tatsächliches Verhalten:**
Fehlermeldung "Nicht gefunden" wird angezeigt, die Detailansicht bleibt geöffnet.

**Ursache:**
`GameService.delete` prüfte nur noch nicht gelöschte Spiele (`deletedAt: null`). Wenn ein Datensatz im lokalen SwiftData-Cache noch vorhanden war, auf dem Server aber bereits als gelöscht markiert war (z. B. durch eine vorherige Anfrage oder ein anderes Gerät), lieferte `findFirst` `null` und warf 404.

**Lösung:**
- `GameService.delete` sucht jetzt nach `id` und `ownerId` unabhängig von `deletedAt`.
- Bereits gelöschte Spiele liefern Erfolg, ohne ein erneutes `update` auszuführen (idempotentes Löschen).
- `GameDetailView` zeigt nach erfolgreichem Löschen einen Erfolgs-Alert und schließt die Ansicht (`dismiss`).
- Unit-Test für bereits gelöschte Spiele ergänzt.

**Referenz im Changelog:**
Version 0.50.8 - Fix: Spiel-Löschen idempotent; iOS Rücksprung + Erfolgsmeldung

---

### [BUG-009] iOS-App: Listen werden nach Löschen/Hinzufügen/Editieren nicht aktualisiert

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.8
**Test geschrieben:** Ja

**Beschreibung:**
Obwohl `DELETE /api/mobile/v1/games/{id}` mittlerweile 200 liefert, bleibt das gelöschte Spiel in der iOS-Spieleliste sichtbar. Gleiches gilt für Sessions, Events und Gruppen. Die Listen sollten sich nach Hinzufügen, Löschen oder Bearbeiten eines Datensatzes automatisch neu laden.

**Reproduktion:**
1. iOS-App öffnen und ein Spiel löschen.
2. Server antwortet mit 200.
3. Zurück zur Spieleliste navigieren.
4. Das gelöschte Spiel ist weiterhin sichtbar.

**Erwartetes Verhalten:**
Liste zeigt nur noch die aktuell existierenden Datensätze.

**Tatsächliches Verhalten:**
Liste zeigt weiterhin den gelöschten Eintrag.

**Ursache:**
`buildSyncPayload` lieferte zwar alle aktiven Datensätze, aber keine IDs der gelöschten Datensätze. `SyncEngine.apply` konnte daher lokale SwiftData-Einträge nicht entfernen. Zusätzlich synchronisierten die Listen-Ansichten nur beim ersten Erscheinen (`.task`) und nicht beim Zurückkehren von einer Detail-/Bearbeiten-Ansicht.

**Lösung:**
- `buildSyncPayload` fragt aktiv und gelöscht (`deletedAt: { not: null }`) für Spiele, Sessions, Events und Gruppen ab und liefert `deleted: [...]`.
- `SyncEngine.apply` löscht die betreffenden lokalen Einträge (war bereits implementiert, fehlte nur das Mapping aus dem Payload).
- iOS-Listen und Dashboard verwenden `.onAppear` statt `.task`, sodass bei jedem Erscheinen der Ansicht eine Synchronisierung ausgeführt wird.
- Unit-Test `tests/unit/lib/sync-response.test.ts` ergänzt, der prüft, dass gelöschte IDs im Payload enthalten sind.

**Referenz im Changelog:**
Version 0.50.8 - Fix: Synchronisierung liefert gelöschte IDs; iOS-Listen synchronisieren bei Erscheinen

---

### [BUG-010] iOS-Build: Xcode kann Provisioning Profile für Personal Team nicht erstellen

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.8
**Test geschrieben:** Nein (Xcode-Signierung, Build-Verifikation)

**Beschreibung:**
Beim Bauen der iOS-App mit einem Personal Development Team meldet Xcode, dass das Provisioning Profile für `com.boardgametools.ios` nicht erstellt werden kann. Die Capabilities `Sign in with Apple` und `User Notifications Filter` werden von einem kostenlosen Personal Team nicht unterstützt, daher schlägt die automatische Signierung fehl.

**Reproduktion:**
1. Xcode → Signing & Capabilities → Team "Matthias Haupt (Personal Team)" wählen.
2. Build starten (Gerät oder Archive).
3. Fehler: "cannot create a iOS App Development provisioning profile ... Personal development teams ... do not support the Sign In with Apple capability" und anschließend "Entitlement com.apple.developer.usernotifications.filter not found and could not be included in profile".

**Erwartetes Verhalten:**
Build wird mit Personal Team erfolgreich signiert.

**Tatsächliches Verhalten:**
Provisioning schlägt fehl, Build wird abgebrochen.

**Ursache:**
`BoardGameTools.entitlements` enthielt die Entitlements `com.apple.developer.applesignin` und `com.apple.developer.usernotifications.filter`, die ein Apple Developer Program (kostenpflichtig) bzw. entsprechende App-ID-Capabilities erfordern.

**Lösung:**
- Beide Entitlements aus `BoardGameTools/BoardGameTools/BoardGameTools.entitlements` entfernt.
- Simulator-Build mit `xcodebuild` verifiziert.
- Hinweis: Für Sign in with Apple und Push-Notifications mit einem kostenpflichtigen Apple Developer Account müssen die Entitlements später wieder hinzugefügt und in den App-ID-Capabilities aktiviert werden.

**Referenz im Changelog:**
Version 0.50.8 - Fix: iOS-Entitlements bereinigt, Build mit Personal Team möglich

---

## Statistik

- **Offene Bugs:** 0
- **In Bearbeitung:** 0
- **Behoben:** 10
- **Wontfix:** 0
- **Gesamt:** 10