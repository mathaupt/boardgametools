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

### [BUG-025] Prisma-Postgres-Verbindungstimeout in Vercel-Produktion

**Status:** `fixed`  
**Schweregrad:** `critical`  
**Entdeckt:** 2026-08-10  
**Behoben:** 2026-08-10  
**Behoben in Version:** 0.50.13  
**Test geschrieben:** Ja

**Beschreibung:**
In der Vercel-Produktion bricht jede Datenbankabfrage mit dem Fehler `timeout exceeded when trying to connect` aus `pg-pool` ab. Die App kann keine Postgres-Verbindung aufbauen.

**Reproduktion:**
1. Deployment auf Vercel pushen
2. Irgendeine API-Route oder Seite aufrufen, die Prisma verwendet
3. Log zeigt `prisma:error timeout exceeded when trying to connect`

**Erwartetes Verhalten:**
Prisma sollte mit der in `SQL_DATABASE_URL` / `DATABASE_URL` konfigurierten Vercel Postgres Datenbank verbinden und Abfragen ausführen.

**Tatsächliches Verhalten:**
Verbindungsaufbau schlägt mit Timeout fehl (ca. 5s), bevor die eigentliche Abfrage ausgeführt werden kann.

**Ursache:**
Die `PrismaPg`-Pool-Konfiguration in `src/lib/db.ts` verwendet einen hartcodierten `connectionTimeoutMillis: 5_000`. Bei Vercel-Serverless-Coldstarts kann der TLS-Handshake und Netzwerkverbindungsaufbau zu Postgres länger dauern. Außerdem wird `max: 10` ohne Rücksicht auf `connection_limit` oder den `pgbouncer`-Modus verwendet. Zusätzlich fehlt die Unterstützung für die nativen Vercel-Postgres-Variablen `POSTGRES_URL` und `POSTGRES_URL_NON_POOLING`.

**Lösung:**
- `connectionTimeoutMillis` auf mindestens 30s oder aus `connect_timeout` Query-Parameter anheben
- Pool-Größe (`max`) aus `connection_limit` Query-Parameter ableiten, im Vercel-Kontext auf 1 begrenzen
- `POSTGRES_URL` und `POSTGRES_URL_NON_POOLING` als Fallback in `src/lib/env.ts` akzeptieren
- Verbindungs-URL bereinigen, damit `pg` nicht versucht, `pgbouncer`/`connect_timeout` als Server-Parameter zu senden

**Referenz im Changelog:**
Version 0.50.13 - Fix: Prisma-Postgres Pool/Timeout für Vercel Serverless optimiert (BUG-025)

---

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
**Behoben:** 2026-08-09  
**Behoben in Version:** 0.50.11  
**Test geschrieben:** Ja (E2E-Bootstrap)

**Beschreibung:**
Die README dokumentierte fiktive Test-Anmeldedaten, für die kein automatisch erstellter Test-Benutzer existierte.

**Reproduktion:**
1. README-Anweisungen befolgen
2. Versuch, sich mit den dort genannten Beispiel-Daten einzuloggen
3. "Ungültige Anmeldedaten" Fehler

**Erwartetes Verhalten:**
Test-Benutzer sollte existieren und Login sollte funktionieren.

**Tatsächliches Verhalten:**
Test-Benutzer existierte nicht, Login schlug fehl.

**Ursache:**
README suggerierte existierende Test-Credentials, aber es gab keinen Mechanismus um den Test-Benutzer automatisch zu erstellen.

**Lösung:**
- README von hartcodierten Test-Credentials befreit
- E2E-Tests verwenden `tests/e2e/bootstrap.ts`, das den Test-Account vor dem Testlauf anlegt und danach aufräumt
- Für manuelle Tests wird auf das Registrierungsformular verwiesen

**Referenz im Changelog:**
Version 0.50.11 - docs: README Test-Credentials entfernt, E2E-Bootstrap ergänzt

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

### [BUG-011] Public-Event-Antworten leaken E-Mail-Adressen von eingeladenen Nutzern

**Status:** `fixed`
**Schweregrad:** `critical`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.8
**Test geschrieben:** Ja (`tests/unit/lib/public-event.test.ts` aktualisiert)

**Beschreibung:**
Die öffentliche Event-Ansicht (über Share-Token erreichbar) enthielt in `dateProposals.votes.user` die vollständige E-Mail-Adresse jedes registrierten Nutzers, der einen Terminvote abgegeben hat. Da der Share-Token an beliebige Personen weitergegeben werden kann, ist das ein Datenschutz-/PII-Leak.

**Reproduktion:**
1. Event mit öffentlicher Freigabe erstellen.
2. Mehrere registrierte Nutzer für Terminvorschläge abstimmen lassen.
3. GET `/api/public/event/<token>` oder GET `/api/mobile/v1/public/event/<token>` aufrufen.
4. In `dateProposals[...].votes[...].user.email` steht die unmaskierte E-Mail-Adresse.

**Erwartetes Verhalten:**
Öffentliche Event-Ansichten zeigen nur `id` und `name` des abstimmenden Nutzers.

**Tatsächliches Verhalten:**
Die Antwort enthielt `email` im `user`-Objekt der Terminvotes.

**Ursache:**
`buildPublicEventInclude` in `src/lib/public-event.ts` selektierte `email: true` für `dateProposals.votes.user`; `SerializedPublicEvent` und `serializePublicEvent` gaben das Feld unverändert weiter.

**Lösung:**
- `email` aus `PublicEventRaw`, `SerializedPublicEvent`, `buildPublicEventInclude` und `serializePublicEvent` entfernt.
- Optimistic-Update in `DateVotingSection` (`src/components/public-event/date-voting-section.tsx`) angepasst.
- `tests/unit/lib/public-event.test.ts` aktualisiert.

**Referenz im Changelog:**
Version 0.50.8 - Fix: Public-Event-Antworten enthalten keine E-Mail-Adressen von Termin-Votes mehr (BUG-011)

---

---

### [BUG-012] Deaktivierte Nutzer können weiterhin Aktionen ausführen

**Status:** `fixed`
**Schweregrad:** `critical`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.9
**Test geschrieben:** Ja (`tests/unit/lib/api-auth.test.ts`, `tests/unit/lib/require-auth.test.ts`)

**Beschreibung:**
`apiAuth()` validiert API-Token und `requireAuth()` liest die NextAuth-Session, aber keiner der beiden Helper prüft `user.isActive`. Ein deaktivierter Account kann weiterhin API-Requests und Dashboard-Seiten nutzen, solange Token/Cookie gültig sind.

**Reproduktion:**
1. Admin deaktiviert Nutzer über `POST /api/admin/users/deactivate`.
2. Nutzer führt mit bestehendem Cookie oder API-Token einen Request aus (z. B. `GET /api/games`).
3. Request wird erfolgreich verarbeitet.

**Erwartetes Verhalten:**
Deaktivierte Accounts werden sofort abgewiesen (401/403).

**Tatsächliches Verhalten:**
Requests werden akzeptiert.

**Ursache:**
`isActive` wird in `apiAuth` und `requireAuth` nicht gegen die Datenbank geprüft.

**Lösung:**
- `next-auth.d.ts`: `isActive` zu `Session.user` hinzugefügt.
- `auth.ts`: `session`-Callback fragt `User` aus der DB ab und setzt `session.user.isActive` sowie `role`/`name`/`email`.
- `api-auth.ts`: Bearer-Token Pfad prüft `apiToken.user.isActive`; Web-Session Pfad prüft `webSession.user.isActive`.
- `require-auth.ts`: `requireAuth` wirft 401, wenn `session.user.isActive === false`.
- `(dashboard)/layout.tsx`: Leitet auf `/login` um, wenn `session.user.isActive === false`.

**Referenz im Changelog:**
Version 0.50.9 - Fix: Auth-Helper prüfen `isActive` und aktualisieren Session-Daten aus der DB (BUG-012, BUG-013, BUG-016)

---

### [BUG-013] Admin-Rolle im Session-Token ist veraltet, wenn DB-Rolle ändert

**Status:** `fixed`
**Schweregrad:** `critical`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.9
**Test geschrieben:** Ja (`tests/unit/lib/require-auth.test.ts`)

**Beschreibung:**
`requireAdmin()` liest die Rolle aus dem NextAuth-JWT (`session.user.role`). Wird ein Admin in der Datenbank auf `USER` zurückgestuft, bleibt der alte Token mit `role: ADMIN` gültig, bis er abläuft. `proxy.ts` prüft ebenfalls `req.auth.user.role` aus dem Token.

**Reproduktion:**
1. Nutzer ist Admin und besitzt Session.
2. Admin ändert eigene oder fremde Rolle auf `USER`.
3. Nutzer ruft `GET /api/admin/users` mit altem Cookie auf.
4. Zugriff wird gewährt.

**Erwartetes Verhalten:**
Admin-Routes verwenden die aktuelle Rolle aus der Datenbank.

**Tatsächliches Verhalten:**
Token-Rolle wird verwendet.

**Ursache:**
`requireAdmin` und `proxy.ts` greifen auf `session.user.role` bzw. `req.auth.user.role` zu, ohne die DB zu validieren.

**Lösung:**
- `auth.ts`: `session`-Callback liest `role` aus der Datenbank und überschreibt `session.user.role`.
- `require-auth.ts`: `requireAdmin` nutzt die von `requireAuth` zurückgegebene `role`, die wiederum aus der aktualisierten Session stammt.
- `proxy.ts` ist ein erster Schutz und kann das JWT `role` nur bedingt prüfen; endgültige Autorisierung erfolgt in den Admin-Routen via `requireAdmin`.

**Referenz im Changelog:**
Version 0.50.9 - Fix: Auth-Helper prüfen `isActive` und aktualisieren Session-Daten aus der DB (BUG-012, BUG-013, BUG-016)

---

### [BUG-014] Deaktivierung widerruft keine API-Token

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.9
**Test geschrieben:** Ja (`tests/unit/api/admin-operations.test.ts`)

**Beschreibung:**
`POST /api/admin/users/deactivate` setzt `isActive=false`, aber bereits ausgestellte `ApiToken` bleiben gültig, bis sie ablaufen oder ein Logout-All erfolgt. Mobile Clients können weiterhin Daten abrufen.

**Reproduktion:**
1. Nutzer besitzt aktives API-Token (iOS-App).
2. Admin deaktiviert Nutzer.
3. Mobile App ruft weiterhin `/api/mobile/v1/games` mit Bearer-Token.
4. Request erfolgreich.

**Erwartetes Verhalten:**
Bei Deaktivierung werden alle ausgestellten Access-Token für den Nutzer widerrufen.

**Tatsächliches Verhalten:**
Token bleiben gültig.

**Ursache:**
Kein `apiToken.updateMany` in `deactivate/route.ts`.

**Lösung:**
In `src/app/api/admin/users/deactivate/route.ts` werden bei `isActive: false` alle offenen `ApiToken` des Nutzers auf `revokedAt: new Date()` gesetzt.

**Referenz im Changelog:**
Version 0.50.9 - Fix: Deaktivierung und Passwort-Änderung widerrufen API-Token (BUG-014, BUG-015)

---

### [BUG-015] Passwort-Änderung widerruft keine API-Token

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.9
**Test geschrieben:** Ja (`tests/unit/app/api/mobile/v1/me.test.ts`, `tests/unit/api/admin-operations.test.ts`)

**Beschreibung:**
Wenn ein Nutzer sein Passwort über `PUT /api/mobile/v1/me` ändert oder ein Admin das Passwort eines anderen Nutzers über `POST /api/admin/users/change-password` ändert, bleiben bestehende API-Token aktiv. Bei einem kompromittierten Account reicht das Passwort-Reset nicht, um Angreifer auszusperren.

**Reproduktion:**
1. Angreifer besitzt API-Token.
2. Nutzer ändert Passwort.
3. Angreifer nutzt weiterhin API-Token.

**Erwartetes Verhalten:**
Alle API-Token des betroffenen Nutzers werden ungültig.

**Tatsächliches Verhalten:**
Token bleiben gültig.

**Ursache:**
Keine Token-Widerrufung nach Passwort-Update.

**Lösung:**
- `src/app/api/mobile/v1/me/route.ts`: Nach erfolgreicher Passwort-Änderung werden alle offenen `ApiToken` des Nutzers widerrufen.
- `src/app/api/admin/users/change-password/route.ts`: Gleiches Verhalten für Admin-Passwort-Reset.

**Referenz im Changelog:**
Version 0.50.9 - Fix: Deaktivierung und Passwort-Änderung widerrufen API-Token (BUG-014, BUG-015)

---

### [BUG-016] Dashboard/API-Zugriff für deaktivierte Nutzer nicht blockiert

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.9
**Test geschrieben:** Ja (`tests/unit/lib/api-auth.test.ts`, `tests/unit/lib/require-auth.test.ts`)

**Beschreibung:**
`proxy.ts` prüft `isLoggedIn` und `role` aus dem NextAuth-Token, aber nicht `isActive`. Deaktivierte Nutzer können Dashboard-Seiten weiterhin aufrufen, weil der Token noch existiert.

**Reproduktion:**
1. Admin deaktiviert Nutzer.
2. Nutzer besitzt noch gültiges Session-Cookie.
3. Aufruf von `/dashboard` zeigt die Seite an.

**Erwartetes Verhalten:**
Deaktivierte Nutzer werden bei Dashboard- und Admin-Routen abgelehnt.

**Tatsächliches Verhalten:**
Zugriff wird gewährt.

**Ursache:**
`proxy.ts` prüft nur Existenz der Session, nicht den aktuellen `isActive`-Status. Middleware kann ohne DB-Zugriff `isActive` nicht aktuell ermitteln.

**Lösung:**
- `auth.ts`: `session`-Callback liest `isActive` aus der DB und aktualisiert `session.user.isActive`.
- `src/app/(dashboard)/layout.tsx`: Leitet inaktive Nutzer auf `/login` um.
- `api-auth.ts` und `require-auth.ts`: Verweigern Requests inaktiver Nutzer (Bearer + Web-Session).

**Referenz im Changelog:**
Version 0.50.9 - Fix: Auth-Helper prüfen `isActive` und aktualisieren Session-Daten aus der DB (BUG-012, BUG-013, BUG-016)

---

### [BUG-017] Info.plist fehlt App-Store-Schlüssel und Sicherheits-Konfiguration

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.9
**Test geschrieben:** Nein (Build-Verifikation via xcodebuild)

**Beschreibung:**
Die `Info.plist` der iOS-App enthielt keinen `ITSAppUsesNonExemptEncryption`-Schlüssel, der für den App-Store-Upload erforderlich ist. `CFBundleShortVersionString` war "1.0" statt einer semantischen Versionsangabe. `NSAppTransportSecurity` hatte keine `NSExceptionDomains` für lokale Entwicklung.

**Erwartetes Verhalten:**
Info.plist erfüllt App-Store-Richtlinien, enthält den Encryption-Schlüssel und eine semantische Version.

**Tatsächliches Verhalten:**
Schlüssel fehlten; Version war nicht semantisch.

**Lösung:**
- `ITSAppUsesNonExemptEncryption` auf `<false/>` gesetzt.
- `CFBundleShortVersionString` auf `1.0.0` gesetzt.
- `API_BASE_URL` auf `https://boardgametools.vercel.app` gesetzt.
- `NSExceptionDomains` für `localhost` mit `NSExceptionAllowsInsecureHTTPLoads` für lokale Entwicklung hinzugefügt.

**Referenz im Changelog:**
Version 0.50.9 - Fix: iOS Info.plist für App Store (Encryption-Key, API-Base-URL, HTTPS) und API-URL-Validierung (BUG-017, BUG-018)

---

### [BUG-018] iOS-App akzeptiert HTTP-URLs und validiert API-Base nicht

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.9
**Test geschrieben:** Nein (Build-Verifikation via xcodebuild)

**Beschreibung:**
`APIClient` hat als Standard `http://localhost:3000` verwendet und erlaubt es, beliebige URLs über Login- und Einstellungs-Ansicht zu speichern. Im Release-Build würden HTTP-URLs gegen App Transport Security verstoßen und unsichere Verbindungen ermöglichen.

**Erwartetes Verhalten:**
Im Release werden nur HTTPS-URLs akzeptiert; im Debug ist `http://localhost` erlaubt. Die App liest die Default-URL aus der `Info.plist`.

**Tatsächliches Verhalten:**
HTTP-Standard und keine Validierung.

**Lösung:**
- `APIClient` liest `API_BASE_URL` aus `Info.plist` und fällt auf `https://boardgametools.vercel.app` zurück.
- Neue private `validate(_:)` Methode: Release erlaubt nur `https://`, Debug erlaubt zusätzlich `http://localhost` und `http://127.0.0.1`.
- `LoginView` und `SettingsView` verwenden `updateBaseURL(_:)` und zeigen Validierungsfehler an.
- `APIError` um `.insecureURL` erweitert.

**Referenz im Changelog:**
Version 0.50.9 - Fix: iOS Info.plist für App Store (Encryption-Key, API-Base-URL, HTTPS) und API-URL-Validierung (BUG-017, BUG-018)

---

### [BUG-019] API-Logs enthalten öffentliche Share-Tokens im Klartext

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.10
**Test geschrieben:** Ja

**Beschreibung:**
`withApiLogging` speicherte die vollständige URL von öffentlichen Endpunkten wie `/api/public/event/<token>/vote` in der `ApiLog`-Tabelle. Das token erlaubt Zugriff auf Events und sollte nicht in Logs persistiert werden.

**Erwartetes Verhalten:**
Share-Tokens in öffentlichen Pfaden werden maskiert, bevor sie in `ApiLog.path` geschrieben werden.

**Tatsächliches Verhalten:**
Token wurde als Klartext im `path`-Feld gespeichert.

**Lösung:**
- `sanitizePath(rawPath)` ersetzt Token-Segmente in `/api/public/{event,group,invite}/` und `/api/mobile/v1/public/{event,group,invite}/` durch `[redacted]`.
- Nur die bereinigte URL wird in `ApiLog` geschrieben.

**Referenz im Changelog:**
Version 0.50.10 - Fix: API-Logs maskieren Share-Tokens in öffentlichen Pfaden (BUG-019)

---

### [BUG-020] withApiLogging löst auth() für öffentliche Requests aus

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.10
**Test geschrieben:** Ja

**Beschreibung:**
Der Logging-Wrapper rief für jede Anfrage `auth()` auf, auch für öffentliche Endpunkte wie Share-Links oder `/api/health`. Durch die neue Session-Callback-Validierung führt das zu unnötigen Datenbank-Lookups.

**Erwartetes Verhalten:**
Öffentliche Routen werden anhand ihres Pfads erkannt und rufen keine `auth()`-Session ab.

**Tatsächliches Verhalten:**
Jede Anfrage löste `auth()` aus, auch wenn `userId` nicht benötigt wird.

**Lösung:**
- `isPublicPath(path)` erkennt `/api/public/`, `/api/mobile/v1/public/`, `/api/auth/` und `/api/health`.
- `auth()` wird nur aufgerufen, wenn die Route nicht öffentlich ist.

**Referenz im Changelog:**
Version 0.50.10 - Fix: withApiLogging löst auth() nur bei geschützten Routen aus (BUG-020)

---

### [BUG-021] Interne Fehlermeldungen werden in API-Logs gespeichert

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.10
**Test geschrieben:** Ja

**Beschreibung:**
Wenn ein Route-Handler eine nicht-`ApiError`-Exception warf, wurde `err.message` (z. B. Stack-Trace-Fragmente, interne DB-Fehler) in `ApiLog.errorMessage` persistiert. Das kann interne Details oder sensible Werte enthalten.

**Erwartetes Verhalten:**
Interne Fehler werden nicht in der Datenbank geloggt; nur sichere `ApiError`-Meldungen dürfen in `ApiLog.errorMessage` stehen.

**Tatsächliches Verhalten:**
`err.message` wurde ungefiltert in `ApiLog.errorMessage` geschrieben.

**Lösung:**
- Nur `ApiError.message` wird in `ApiLog.errorMessage` geschrieben.
- Andere Fehler werden an `logger.error` weitergegeben (strukturiertes Logging, nicht DB-Log).

**Referenz im Changelog:**
Version 0.50.10 - Fix: Interne Fehlermeldungen werden nicht in API-Logs gespeichert (BUG-021)

---

### [BUG-022] Debug-Routen sind anfällig bei falscher NODE_ENV-Konfiguration

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.10
**Test geschrieben:** Nein (Build-/Manuelle Verifikation)

**Beschreibung:**
`/api/debug/env` und `/api/debug/session` waren nur durch `env.NODE_ENV === "development"` geschützt. Falls diese Variable fälschlicherweise auf `development` in einer Produktionsumgebung gesetzt ist, könnten Umgebungs- oder Session-Informationen preisgegeben werden.

**Erwartetes Verhalten:**
Debug-Routen sind auch dann blockiert, wenn `NODE_ENV` falsch konfiguriert ist, aber Vercel-Production erkannt wird.

**Tatsächliches Verhalten:**
Die Route war zugänglich, sobald `NODE_ENV` auf `development` stand.

**Lösung:**
- Zusätzliche Prüfung `process.env.VERCEL_ENV === "production"` in `GET`-Guard.
- Route gibt 404 zurück, sobald Produktionsumgebung von Vercel erkannt wird.

**Referenz im Changelog:**
Version 0.50.10 - Fix: Debug-Routen zusätzlich auf Vercel-Production-Umgebung blockieren (BUG-022)

---

### [BUG-023] Lokaler Datei-Upload in Produktion ohne Blob-Token

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.10
**Test geschrieben:** Nein (Storage-Integration ist nicht Teil der Unit-Tests)

**Beschreibung:**
Falls `BLOB_READ_WRITE_TOKEN` in Produktion fehlt, fiel `getStorageProvider()` auf `LocalStorageProvider` zurück. Auf serverless Plattformen sind lokale Dateien jedoch flüchtig und gingen bei Deployment/Scale-Down verloren.

**Erwartetes Verhalten:**
In Produktion wird ein Upload abgelehnt, wenn kein persistenter Storage (Vercel Blob) konfiguriert ist.

**Tatsächliches Verhalten:**
Dateien wurden lokal gespeichert und waren potenziell nicht mehr verfügbar.

**Lösung:**
- `LocalStorageProvider.upload` wirft in Produktion einen Fehler mit Hinweis auf `BLOB_READ_WRITE_TOKEN`.
- Der Aufrufer kann den Nutzer darüber informieren; vorher ging das Bild ohne Warnung verloren.

**Referenz im Changelog:**
Version 0.50.10 - Fix: Lokaler Datei-Upload in Produktion verhindern, wenn BLOB_READ_WRITE_TOKEN fehlt (BUG-023)

---

### [BUG-024] NextAuth meldet `UntrustedHost` bei lokalem Produktions-Build

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-08-10
**Behoben:** 2026-08-10
**Behoben in Version:** 0.50.11
**Test geschrieben:** Ja (E2E-Tests laufen jetzt gegen Produktions-Build)

**Beschreibung:**
Bei `npm run build && npm start` auf `localhost:3000` brach Auth.js mit `UntrustedHost` ab, weil die eingehende Host-Header in Produktion nicht als vertrauenswürdig eingestuft wurden.

**Erwartetes Verhalten:**
Lokale Produktions-Builds und das Vercel-Deployment sollten Host-Header akzeptieren, solange sie aus bekannten Umgebungen stammen.

**Tatsächliches Verhalten:**
Auth.js warf `UntrustedHost` und Login/Session-APIs gaben Fehler zurück.

**Lösung:**
`trustHost` in `src/lib/auth.ts` setzen, wenn `AUTH_TRUST_HOST=true`, `VERCEL=1` oder `NODE_ENV !== "production"` gilt. Zusätzlich in `.env.local.example` und `.env.production.example` dokumentiert.

**Referenz im Changelog:**
Version 0.50.11 - Fix: NextAuth `trustHost` für lokale Produktions-Builds und Vercel konfiguriert

---

### [BUG-026] Sicherheitsbefunde in produktiven Abhängigkeiten

**Status:** `fixed`
**Schweregrad:** `critical`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.16
**Test geschrieben:** Ja

**Beschreibung:** npm audit --omit=dev meldete 10 betroffene Pakete einschließlich eines kritischen Next.js-Befunds.

**Reproduktion:** Produktionsaudit mit altem Lockfile ausführen.

**Erwartetes Verhalten:** Keine bekannten hohen oder kritischen produktiven Paketbefunde.

**Tatsächliches Verhalten vor Korrektur:** 10 produktive Paketbefunde.

**Ursache:** Veraltete direkte und transitive Versionen.

**Lösung:** Next.js 16.4.3, Nodemailer 10.2.1, Blob 2.8.2, Prisma 7.10.1 und kompatible transitive Updates; gezielte Overrides für Undici 6, Zod 4 und js-yaml 4.

**Test-Status:** npm audit --omit=dev: 0; Gesamtaudit: nur 3 niedrige Entwicklungsbefunde.

**Referenz im Changelog:** Version 0.50.16, BUG-026.

---

### [BUG-027] iOS-Token-Erneuerung scheitert am Antwortformat

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.16
**Test geschrieben:** Ja

**Beschreibung:** Refresh liefert kein user-Objekt, der Client erwartete jedoch TokenResponse.

**Reproduktion:** Nach Ablauf des Access-Tokens eine geschützte Anfrage senden.

**Erwartetes Verhalten:** Neue Tokens speichern und Anfrage einmal wiederholen.

**Tatsächliches Verhalten vor Korrektur:** Decodierfehler; bereits rotierter Refresh-Token geht verloren.

**Ursache:** Gemeinsames DTO für unterschiedliche Login- und Refresh-Antworten.

**Lösung:** Eigenes RefreshTokenResponse; geteilte Refresh-Task mit Fehlerweitergabe, begrenzte Wiederholung und Session-Generation.

**Test-Status:** Swift-Verträge und simulierte URLSession: Erfolg, parallele Anfragen, Refresh-Fehler und maximale Wiederholung.

**Referenz im Changelog:** Version 0.50.16, BUG-027.

---

### [BUG-028] Spielereiheneintrag verhindert iOS-Synchronisation

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.16
**Test geschrieben:** Ja

**Beschreibung:** Backend liefert game nur als Bildzusammenfassung; Swift erwartete das vollständige GameDTO.

**Reproduktion:** Eine Reihe mit einem Eintrag anlegen und iOS synchronisieren.

**Erwartetes Verhalten:** Reihen und übrige Snapshot-Daten einlesen.

**Tatsächliches Verhalten vor Korrektur:** keyNotFound(id) im verschachtelten game-Objekt.

**Ursache:** Unterschiedliche verschachtelte DTOs.

**Lösung:** SeriesGameSummary mit optionaler imageUrl statt vollständigem GameDTO.

**Test-Status:** Swift-Decodiertest mit befülltem Reiheneintrag und Serverformat.

**Referenz im Changelog:** Version 0.50.16, BUG-028.

---

### [BUG-029] Lokale iOS-Daten bleiben bei Konto- und Serverwechsel erhalten

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.16
**Test geschrieben:** Ja

**Beschreibung:** Ein gemeinsamer SwiftData-Store wurde nicht geleert; alte Antworten konnten neue Sitzungen beeinflussen.

**Reproduktion:** Konto A synchronisieren, abmelden und Konto B oder anderes Backend verwenden.

**Erwartetes Verhalten:** Keine Daten von A in B; Logout an bisheriges Backend.

**Tatsächliches Verhalten vor Korrektur:** Alte Datensätze verblieben; Logout konnte bereits an die neue URL gehen.

**Ursache:** Fehlende Cache-Zuordnung und falsche Reihenfolge beim Backendwechsel.

**Lösung:** LocalAccountStore ordnet Backend/Nutzer zu, leert alle Kontomodelle und Metadaten; unbekannte Altzuordnung wird verworfen. Session-Generation verwirft alte Antworten, laufende Erneuerungen werden abgebrochen.

**Test-Status:** In-Memory-SwiftData: Altbestand, identisches Konto, zweites Konto, Backendwechsel und Logout; URLSession-Test für alte Antwort und Logout-Host.

**Referenz im Changelog:** Version 0.50.16, BUG-029.

---

### [BUG-030] Migrationsfehler lösen automatische Baseline und db push aus

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.16
**Test geschrieben:** Ja

**Beschreibung:** Der bisherige Build versuchte bei beliebigen Migrationsfehlern Reparaturaktionen ohne Schemaprüfung.

**Reproduktion:** Migrationsprozess mit Exit 7 oder Signal simulieren.

**Erwartetes Verhalten:** Einmaliger Aufruf und Fehlerstatus, ohne weitere Datenbankaktionen.

**Tatsächliches Verhalten vor Korrektur:** Migrationen wurden als angewendet markiert; anschließend db push. Bei Signal konnte sogar Erfolg gemeldet werden.

**Ursache:** Pauschaler Fehler-Fallback; signalbedingter Status null wurde als 0 behandelt.

**Lösung:** Build von Migration getrennt; Migrationsskript ruft ausschließlich migrate deploy auf und bricht bei Fehler oder Signal ab.

**Test-Status:** Vitest mit ausführbarem npx-Testdouble: Erfolg, Exit 7 und SIGTERM; keine echte Datenbank.

**Referenz im Changelog:** Version 0.50.16, BUG-030.

---

### [BUG-031] iOS meldet nach erfolgreichem Bild-Upload einen Decodierfehler

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.16
**Test geschrieben:** Ja

**Beschreibung:** UploadResponse verlangte path, obwohl der Server url und Metadaten liefert.

**Reproduktion:** Ein Bild über die mobile API hochladen und Antwort decodieren.

**Erwartetes Verhalten:** Erfolgreiche Antwort mit Bild-URL einlesen.

**Tatsächliches Verhalten vor Korrektur:** keyNotFound(path).

**Ursache:** Veraltetes Client-Antwortmodell.

**Lösung:** UploadResponse entspricht id, url, fileName, mimeType und sizeBytes.

**Test-Status:** Swift-Decodiertest mit tatsächlichem Upload-Antwortformat.

**Referenz im Changelog:** Version 0.50.16, BUG-031.

---

### [BUG-032] API-Logging-Kontext scheitert an strengeren Next.js-Buildtypen

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.16
**Test geschrieben:** Ja

**Beschreibung:** Beim Sicherheitsupdate auf Next.js 16.4.3 verlangten die generierten Routentypen einen params-Kontext. Der Logging-Wrapper verwendete bisher einen unbestimmten Record als Standard.

**Reproduktion:** Produktionsbuild nach dem Framework-Update ausführen.

**Erwartetes Verhalten:** Geschützte und öffentliche Routen werden unverändert gebaut und geloggt.

**Tatsächliches Verhalten vor Korrektur:** TypeScript-Buildfehler in statischen API-Routen.

**Lösung:** Next.js-kompatibler Standardkontext mit asynchronen params; dynamische Kontexte bleiben generisch. Tests verwenden denselben Framework-Kontext.

**Test-Status:** API-Logging-/Route-Tests, vollständiger Typecheck und Produktionsbuild.

**Referenz im Changelog:** Version 0.50.16.

---

### [BUG-033] GitHub-CI bricht bei npm ci wegen fehlender SQL_DATABASE_URL ab

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-28
**Behoben:** 2026-10-28
**Behoben in Version:** 0.50.17
**Test geschrieben:** Ja

**Beschreibung:** Der postinstall-Schritt führt prisma generate aus. Die Prisma-Konfiguration verlangt schon beim Laden SQL_DATABASE_URL; nur der Build-Job hatte bisher eine Testadresse.

**Reproduktion:** npm ci in einem frischen Checkout ohne .env-Dateien ausführen.

**Erwartetes Verhalten:** Installation und Codegenerierung für Lint-, Test- und Security-Jobs ohne Produktionszugang.

**Tatsächliches Verhalten vor Korrektur:** PrismaConfigEnvError; drei Jobs scheitern vor ihren eigentlichen Prüfungen, der Build wird übersprungen.

**Lösung:** Eine künstliche Datenbankadresse auf 127.0.0.1:1 gilt global für den CI-Workflow. prisma generate benötigt nur die Konfiguration und stellt keine Datenbankverbindung her.

**Test-Status:** tests/unit/scripts/ci-install.test.ts startet das echte postinstall in einem temporären Checkout ohne .env-Dateien mit den Workflow-Variablen. Der Test wurde zuerst mit dem ursprünglichen Fehler reproduziert.

**Referenz im Changelog:** 0.50.17, BUG-033.

---

### [BUG-034] Navigation kennzeichnet den aktuellen Bereich nicht eindeutig

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-10-30
**Behoben in Version:** 0.50.20
**Test geschrieben:** Ja

**Beschreibung:** Die Webnavigation markierte Dashboard auch auf Unterseiten als aktiv und stellte den aktuellen Bereich für Screenreader nicht über aria-current bereit.

**Reproduktion:** `/dashboard/events` oder eine Eventunterseite öffnen und die Navigationsmarkierungen prüfen.

**Erwartetes Verhalten:** Ausschließlich Events ist der aktive Hauptbereich, auch programmatisch erkennbar.

**Tatsächliches Verhalten vor Korrektur:** Dashboard und Events wurden gleichzeitig hervorgehoben; aria-current fehlte.

**Ursache:** Der gemeinsame Pfadpräfix `/dashboard` wurde wie bei Unterbereichen ausgewertet.

**Lösung:** Dashboard nur exakt zuordnen, Unterbereiche anhand ihres eigenen Präfixes zuordnen und aria-current setzen.

**Test-Status:** `tests/unit/components/club-navigation.test.tsx` prüft die Zuordnung auf einer Eventunterseite. `tests/e2e/navigation_test.ts` ergänzt den Workflow für die angemeldete Testumgebung; lokale isolierte Browserprüfung erfolgreich, vollständige E2E-Suite gegen Testdatenbank nicht ausgeführt.

**Referenz im Changelog:** Version 0.50.20, BUG-034.

---

### [BUG-035] Primäre Schaltflächen im dunklen Farbschema haben zu wenig Textkontrast

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-10-30
**Behoben in Version:** 0.50.20
**Test geschrieben:** Ja

**Beschreibung:** Die Abschlussprüfung der neuen Oberfläche zeigte unzureichenden Kontrast kleiner Beschriftungen auf primären Schaltflächen im dunklen Farbschema.

**Reproduktion:** Das dunkle Farbschema aktivieren und den Kontrast von „Event planen“ oder „Zusagen“ messen, nachdem Farbtransitionen beendet sind.

**Erwartetes Verhalten:** Mindestens 4,5:1 für normale Schaltflächenbeschriftungen, auch bei Hover.

**Tatsächliches Verhalten vor Korrektur:** Die lokale Browsermessung ermittelte 3,21:1 im Grundzustand und 3,82:1 bei Hover.

**Ursache:** Eine aufgehellte blaue Primärfarbe wurde weiterhin mit nahezu weißer Schrift kombiniert.

**Lösung:** Helle blaue Primärfläche mit dunkler blauer Beschriftung kombinieren.

**Test-Status:** `tests/e2e/helpers/button-contrast.mjs` misst im Browser die tatsächlichen Farben einschließlich transparenter Hintergründe. `tests/e2e/navigation_test.ts` prüft Grundzustand und Hover; dieselbe Messung wurde lokal in der isolierten Komponentenvorschau vor der Korrektur als fehlschlagend ausgeführt.

**Referenz im Changelog:** Version 0.50.20, BUG-035.

---

### [BUG-036] Suchfeld erhält die vorgesehene Mindesthöhe nicht

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-10-30
**Behoben in Version:** 0.50.20
**Test geschrieben:** Ja

**Beschreibung:** Bei der Dokumentation der neuen Gestaltung fiel ein nicht passender CSS-Selektor für Eingabefelder auf.

**Reproduktion:** Die Spielesammlung bei 390 Pixeln Breite öffnen und die Höhe des Suchfelds messen.

**Erwartetes Verhalten:** Mindestens 44 Pixel Höhe für das interaktive Suchfeld.

**Tatsächliches Verhalten vor Korrektur:** 36 Pixel, weil Input kein data-slot-Attribut besitzt.

**Ursache:** Die neue Mindesthöhe adressierte ein nicht vorhandenes data-slot-Attribut.

**Lösung:** Native Eingabefelder innerhalb der Anwendungsoberfläche adressieren; Checkboxen und Radiobuttons ausnehmen.

**Test-Status:** Lokale Browserprüfung reproduzierte zunächst 36 Pixel. Regression für die angemeldete Testumgebung in `tests/e2e/navigation_test.ts` ergänzt.

**Referenz im Changelog:** Version 0.50.20, BUG-036.

---

### [BUG-037] Geschlossenes öffentliches Voting erscheint weiterhin aktiv

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-10-31
**Behoben in Version:** 0.50.34
**Test geschrieben:** Ja; Zustands-/Header-Unit-Tests, vier PostgreSQL-Integrationstests und Chromium-E2E für die veraltete öffentliche Seite.

**Beschreibung:** Der tatsächliche Abstimmungsstatus und die verbindliche Auswahl werden nicht angemessen dargestellt.

**Reproduktion:** Eine öffentliche Seite mit status closed und zukünftigem eventDate öffnen; als Gast Spiel- und Terminbuttons prüfen; selectedDate und selectedGame setzen.

**Erwartetes Verhalten:** Geschlossenen Status, endgültigen Termin und Spiel anzeigen; nicht mehr zulässige Aktionen sperren.

**Tatsächliches Verhalten:** Der Kopf zeigt Aktiv, Spiel- und Terminaktionen sind bedienbar. Im Kopf steht weiter eventDate; selectedDate erscheint erst weiter unten.

**Ursache:** page.tsx und PublicEventClient verwenden überwiegend isPast; Ergebnisdaten werden nicht im Kopf dargestellt.

**Ergänzende Quellprüfung 31.10.2026:** Öffentliche Beitritts-, Spielstimmen- und Terminantwort-Routen sowie mehrere private/Mobile-Schreibwege besitzen keine gemeinsame Zustandsprüfung. Der FEAT-010-Plan sieht deshalb serverseitige Sperren mit echter DB-Abnahme vor; eine reine UI-Korrektur reicht nicht aus. Keine produktiven Schreibrequests durchgeführt.

**Lösung:** Gemeinsamer Statusvertrag, transaktional gesperrte Schreibaktionen und Status-/Ergebnisdarstellung sind umgesetzt. Das alte öffentliche Browserformular aktualisiert sich nach 409 und sperrt die Stimme.

**Prüfnachweis:** Vier PostgreSQL-Integrationstests gegen ein isoliertes Schema bestanden; Chromium-E2E schließt ein zuvor offenes Event während die öffentliche Seite geladen bleibt, bestätigt 409, geschlossenen Status, deaktivierte Stimme und null gespeicherte Votes. Zusätzlich echte gerenderte Ansicht mit Status, ausgewähltem Spiel und festem Kalendertag geprüft. Keine Produktionsdaten verändert.

**Test-Status:** `tests/unit/lib/event-state.test.ts`, `tests/unit/lib/public-event.test.ts`, `tests/unit/components/public-event-header.test.tsx`, `tests/integration/event-state.test.ts` und `tests/e2e/public_events_test.ts` bestanden.

**Referenz im Changelog:** Version 0.50.34 – Statusanzeige und Schreibschutz umgesetzt.

---

### [BUG-038] Mobile Terminantworten sind teilweise verborgen und zu klein

**Status:** `in_progress`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Test geschrieben:** Ja – `tests/unit/components/date-availability-group.test.tsx` und Chromium-E2E in `tests/e2e/public_events_test.ts` prüfen Radiogruppen, Tastaturwahl, gespeicherten Wert und erreichbare 44-px-Ziele.

**Beschreibung:** Die mobile Terminwahl versteckt Antwortmöglichkeiten; der ausgewählte Zustand wird assistiver Technik nicht ausdrücklich vermittelt.

**Reproduktion:** Als Gast bei 390 Pixeln Breite mehrere Terminvorschläge öffnen und eine Antwort wählen.

**Erwartetes Verhalten:** Alle Antworten leicht auffindbar, mindestens 44 Pixel große Projekt-Touch-Flächen und programmatisch vermittelte Auswahl.

**Tatsächliches Verhalten:** Vor dem Fix verbreiterte eine Teilnehmerzeile mit langem Namen und Status-Badge die öffentliche Eventseite bei schmalen Ansichten.

**Ursache:** Feste Tabellenanordnung und fehlende Min-Width-/Umbruchregeln in einer Einladungskarte; zusätzlich kleine Iconbuttons und rein visuelle Auswahl in der früheren Terminabstimmung.

**Lösung:** Öffentliche und geschützte Terminzeilen verwenden beschriftete native Radiogruppen. Teilnehmerkarten und Einladungstexte umbrechen; die gesamte Seite wurde bei 195 px (200-%-Äquivalent zu 390 px), 320, 390, 640, 768 und 1440 px ohne horizontalen Überlauf geprüft. Die Terminfläche selbst bleibt auch bei 98 px sichtbar. Manuelle VoiceOver-Abnahme steht noch aus.

**Prüfnachweis:** date-mobile.png und observations.json aus A; Browsermessungen aus B. Weitere Hauptbuttons und Eingaben messen nur 36 Pixel Höhe und sind im selben Planungsschritt zu berücksichtigen. Belege: `.impeccable/critique/evidence/public-event-A/` und `public-event-B/`.

**Test-Status:** Unit- und Chromium-E2E prüfen Tastaturwahl mit gespeicherter Antwort, zehn Termine, 50 Gäste, 44-px-Ziele und schmale Layouts. Manuelle VoiceOver-Abnahme ausstehend; deshalb bleibt der Befund in Bearbeitung.

**Referenz im Changelog:** Version 0.50.35 – Terminabstimmung barrierefrei bedienen.

---

### [BUG-039] Statusbeschriftungen der öffentlichen Eventseite haben zu wenig Kontrast

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.37
**Test geschrieben:** Ja – `tests/e2e/helpers/public-event-contrast.mjs` misst gerenderte Vorder-/Hintergrundfarben in Chromium in hellem und dunklem Theme.

**Beschreibung:** Mehrere kleine Status- und Ergebnisbeschriftungen unterschreiten 4,5:1.

**Reproduktion:** Gastbegrüßung, Terminzusagen und gewählten Termin in heller Darstellung sowie Abgesagt im dunklen Modus prüfen.

**Erwartetes Verhalten:** Mindestens 4,5:1 für betroffene kleine Texte in beiden Farbschemata.

**Tatsächliches Verhalten:** Vor dem Fix: Begrüßung 3,8:1, Zusagezahlen 2,3:1, gewählter Termin 3,9:1; dunkel Abgesagt 3,3:1 und Zusagezahlen 3,2:1. Nach dem Fix erreichten die geprüften Texte mindestens 5,11:1.

**Ursache:** Statusfarben als kleine Schrift auf transparenten beziehungsweise farbigen Hintergründen ohne ausreichenden Kontrast.

**Lösung:** Betroffene Texte verwenden kontrastreiche semantische Vordergrundfarben. Der E2E-Helfer misst die tatsächlich gerenderten und zusammengesetzten Farben in beiden Themes; der niedrigste protokollierte Messwert beträgt 5,11:1.

**Prüfnachweis:** Gerenderte detect.js-Prüfung und Browser-Kontrastmessungen aus Assessment B; keine Bewertung anhand deaktivierter Controls. Belege: `.impeccable/critique/evidence/public-event-A/` und `public-event-B/`.

**Test-Status:** Automatisierter E2E-Regressionstest vorhanden; helle und dunkle Ansicht mit aktiver sowie festgelegter Terminansicht geprüft.

**Referenz im Changelog:** Version 0.50.37 – schmale öffentliche Eventansicht stabilisieren.

---

### [BUG-040] BGG-Suche meldet erfolglose Suche vor dem Suchstart

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.38
**Test geschrieben:** Ja – `tests/unit/components/bgg-game-search.test.tsx` und `tests/unit/components/use-bgg-search.test.tsx`.

**Beschreibung:** Die öffentliche Spielsuche zeigt vor dem ersten Suchlauf eine Meldung über fehlende Ergebnisse.

**Reproduktion:** Az im BGG-Suchfeld eingeben, ohne die Suche auszulösen.

**Erwartetes Verhalten:** Vor dem ersten Suchlauf neutral bleiben; Ergebnislosigkeit erst nach abgeschlossener Suche melden.

**Tatsächliches Verhalten:** Keine Ergebnisse gefunden. Versuche einen anderen Suchbegriff. erscheint bereits nach Eingabe.

**Ursache:** bgg-game-search.tsx prüft leere Ergebnisse, Suchtextlänge und Ladezustand, aber keinen abgeschlossenen Suchlauf.

**Lösung:** Der Suchhook unterscheidet ungesucht, ladend, Treffer, leere Suche und Fehler. Ergebnisse werden erst nach dem Absenden angezeigt; veraltete und abgebrochene Requests überschreiben keinen neueren Zustand.

**Prüfnachweis:** search-before-submit.png aus A; beforeSearch-Nachweis aus B. Belege: `.impeccable/critique/evidence/public-event-A/` und `public-event-B/`.

**Test-Status:** Regressionstest bestanden; vor dem Absenden bleibt die Oberfläche neutral, eine gültige leere Antwort zeigt die Leermeldung.

**Referenz im Changelog:** Version 0.50.38 – öffentliche BGG-Suche verständlicher machen.

---

### [BUG-041] Vorgesehenes Desktop-Raster der öffentlichen Eventseite ist unwirksam

**Status:** `in_progress`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-30
**Test geschrieben:** Ja – `tests/unit/components/public-event-client.test.tsx` prüft die Desktop-Rasterklasse; gerenderte Viewport-Abnahme bleibt offen.

**Beschreibung:** Teilnehmer und Teilnahmehinweis bleiben auf Desktop untereinander.

**Reproduktion:** Öffentliche Seite bei 1440 Pixeln Breite öffnen.

**Erwartetes Verhalten:** Die im Markup vorgesehene Desktop-Spaltenaufteilung wird wirksam.

**Tatsächliches Verhalten:** Beide Karten bleiben untereinander und verlängern den Weg zur Gastteilnahme.

**Ursache:** lg:grid-cols-[2fr,1fr] in page.tsx erzeugt keine wirksame gültige Zweispaltenaufteilung.

**Lösung:** Gültiges `lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]` in der öffentlichen Eventseite umgesetzt; die Teilnehmerübersicht steht nach den Hauptaktionen im DOM und wird bei Desktopbreite als Seitenbereich angeordnet. Finale Browsermessung bei 1440 px steht aus.

**Prüfnachweis:** anonymous-1440.png und Layoutbeobachtungen aus A. Belege: `.impeccable/critique/evidence/public-event-A/` und `public-event-B/`.

**Test-Status:** Unit-Abdeckung vorhanden; Browser-Viewport-Abnahme offen.

**Referenz im Changelog:** Version 0.50.24 – Prüfung der öffentlichen Eventseite dokumentiert.

---

### [BUG-042] Gästelisten auf öffentlicher Eventseite laufen auseinander

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.39
**Test geschrieben:** Ja – `public-event-client.test.tsx`, `public-event-flow.test.tsx`, `public-participants.test.ts` und `public-voting-flow.test.ts`.

**Beschreibung:** Mehrfach angezeigte Gästeinformationen werden nach einem Beitritt nicht gemeinsam aktualisiert.

**Reproduktion:** Als neuer Gast beitreten und die obere Gästeliste mit dem Gastbereich vergleichen.

**Erwartetes Verhalten:** Konsistente Teilnehmerinformationen oder eine gemeinsame Darstellung.

**Tatsächliches Verhalten:** Die clientseitige Gästeliste wird ergänzt; die obere servergerenderte Liste und Stimmenzahlen bleiben bis zum Neuladen unverändert.

**Ursache:** page.tsx und GuestRegistrationPanel verwalten getrennte Darstellungen desselben Datenbestands.

**Lösung:** Gästeliste aus Registrierungsformular und Serverseite zusammengeführt. `PublicEventClient` hält die einzige aktuelle Gastliste; Beitrittsantworten enthalten den serverseitigen Stimmenzähler und werden anhand der Gast-ID eingefügt/ersetzt. Stimmenänderungen gleichen den Snapshot ab; ältere Snapshotantworten überschreiben keine neueren.

**Prüfnachweis:** Beitrittsablauf und Komponentenprüfung aus A; keine echte Gastregistrierung. Belege: `.impeccable/critique/evidence/public-event-A/` und `public-event-B/`.

**Test-Status:** Regressionstests bestanden; Browser-E2E nach erfolgreichem Beitritt bleibt offen.

**Referenz im Changelog:** Version 0.50.39 – Öffentliche Eventteilnahme vereinheitlichen.

---

### [BUG-043] Öffentliche BGG-Suche hat keine dauerhafte Feldbeschriftung

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.38
**Test geschrieben:** Ja – `tests/unit/components/bgg-game-search.test.tsx` prüft den zugänglichen Namen und das sichtbare Label.

**Beschreibung:** Das BGG-Suchfeld besitzt nur einen Platzhalter.

**Reproduktion:** Suchfeld im Accessibility-Baum prüfen und Text eingeben.

**Erwartetes Verhalten:** Eine zugeordnete sichtbare Beschriftung und ein stabiler zugänglicher Name.

**Tatsächliches Verhalten:** Kein zugeordnetes Label und kein aria-label; der Platzhalter ist die einzige Feldbeschreibung.

**Ursache:** Dem Input in bgg-game-search.tsx fehlt eine zugeordnete Beschriftung.

**Lösung:** Ein sichtbares `<label>` ist dem Suchfeld dauerhaft zugeordnet; der Feldhinweis ist über `aria-describedby` verbunden.

**Prüfnachweis:** DOM-Beschriftungsprüfung aus B und Quellprüfung aus A. Belege: `.impeccable/critique/evidence/public-event-A/` und `public-event-B/`.

**Test-Status:** Unit-Regressionstest vorhanden und bestanden.

**Referenz im Changelog:** Version 0.50.38 – öffentliche BGG-Suche verständlicher machen.

---

### [BUG-044] Löschaktion für Eventersteller widerspricht der API-Berechtigung

**Status:** `open`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Test geschrieben:** Nein

**Beschreibung:** Die geschützte Rankingliste zeigt Erstellern das Löschen fremder Vorschläge an, während beide DELETE-Routen nur eigene Nutzervorschläge zulassen.

**Reproduktion:** Als Eventersteller einen fremden Vorschlag in der geschützten Voting-Rankingliste öffnen und Vorschlag löschen auslösen.

**Erwartetes Verhalten:** Angezeigte Löschrechte und serverseitige Rechte stimmen überein; nach dem zur Freigabe vorgelegten FEAT-004-Plan darf der Ersteller alle Vorschläge verwalten.

**Tatsächliches Verhalten:** Die UI prüft eventIsCreator oder proposedById, Web-/Mobile-API filtern jedoch zwingend auf proposedById des aktuellen Nutzers und liefern für fremde Vorschläge 404.

**Ursache:** Getrennte Berechtigungslogik in voting/proposal-ranking-list.tsx sowie den Web-/Mobile-Proposal-DELETE-Routen.

**Lösung:** Noch nicht umgesetzt. Im FEAT-004-Plan gemeinsame Capability und serverseitigen Löschservice mit Rollen-/Statusmatrix vorgesehen.

**Prüfnachweis:** Quellvergleich bei der Planung von FEAT-001 bis FEAT-004; kein produktiver Schreibtest durchgeführt.

**Test-Status:** Regressionstest im Implementierungsplan vorgesehen; erst bei freigegebener Umsetzung zu schreiben.

**Referenz im Changelog:** Version 0.50.25 – Voting-Implementierungsplan vorbereitet.

---

### [BUG-045] Geschütztes Web-Voting berücksichtigt Gaststimmen nicht vollständig

**Status:** `open`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Test geschrieben:** Nein

**Beschreibung:** Die geschützten Web-Votingclients verwenden für sichtbare Stimmen und Rangfolge überwiegend nur Nutzerstimmen, obwohl Gaststimmen ebenfalls vorhanden sind.

**Reproduktion:** Vorschlag A mit zwei Nutzerstimmen und ohne Gaststimmen sowie Vorschlag B mit einer Nutzerstimme und vier Gaststimmen in einem öffentlichen Event anlegen; geschütztes Voting und öffentliche Ansicht vergleichen.

**Erwartetes Verhalten:** Gesamtstimmen und Standardsortierung berücksichtigen beide Stimmenarten konsistent.

**Tatsächliches Verhalten:** Die geschützten Clients sortieren und zeigen _count.votes; öffentliche Ansicht und Abschlussauswahl rechnen Nutzer- und Gaststimmen zusammen.

**Ursache:** Unterschiedliche Darstellungsmodelle und lokale Sortierungen in beiden geschützten voting-client.tsx und proposal-ranking-list.tsx.

**Lösung:** Noch nicht umgesetzt. Im FEAT-002-Plan gemeinsames Modell, Gesamtstimmenadapter und Regressionstests für gemischte Stimmen vorgesehen.

**Prüfnachweis:** Quellvergleich bei der Planung von FEAT-001 bis FEAT-004; kein produktiver Schreibtest durchgeführt.

**Test-Status:** Regressionstest im Implementierungsplan vorgesehen; erst bei freigegebener Umsetzung zu schreiben.

**Referenz im Changelog:** Version 0.50.25 – Voting-Implementierungsplan vorbereitet.

---

### [BUG-046] Private Event-Serverseiten prüfen die Eventzugehörigkeit nicht ausdrücklich

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-10-30
**Behoben in Version:** 0.50.26
**Test geschrieben:** Ja

**Beschreibung:** Die Dashboard-Eventdetailseite und die eigene Voting-Seite laden Eventdaten per ID, ohne den Ersteller-/Einladungszugriff vor der Datenübergabe ausdrücklich zu prüfen. Der bestehende private Event-Service besitzt diese Prüfung, wird dort aber nicht verwendet.

**Reproduktion:** Mit einem angemeldeten, nicht eingeladenen Nutzer die Detail- und Voting-URL eines fremden privaten Events aufrufen. Im freigegebenen Implementierungsschritt mit isolierten Testkonten nachweisen.

**Erwartetes Verhalten:** Keine privaten Eventprops oder Sammlungsdaten für fremde angemeldete Nutzer. Prüfung serverseitig vor der Datenübergabe.

**Tatsächliches Verhalten laut Quellprüfung:** Die Seitenabfrage filtert auf Event-ID und deletedAt; der Proxy prüft nur die Anmeldung. isCreator steuert anschließend einzelne Aktionen, verhindert aber nicht die Datenübergabe.

**Ursache:** Direkte Prisma-Abfragen in beiden Serverseiten umgehen die Berechtigungsregel von EventService.getById.

**Lösung:** Beide Event-Serverseiten beschränken ihre Datenbankabfrage auf den Ersteller oder eine eingeladene Person. Nicht angemeldete Personen werden zur Anmeldung geleitet.

**Prüfnachweis:** `tests/unit/lib/private-event-access.test.ts` prüft den Datenbankfilter; `tests/unit/lib/services/event.test.ts` sichert die Ablehnung fremder Nutzer ab. Kein Zugriff auf produktive fremde Daten.

**Test-Status:** Regressionstests geschrieben und erfolgreich ausgeführt.

**Referenz im Changelog:** Version 0.50.26 – Spieldetails direkt im Voting öffnen.

---

### [BUG-047] Voting-Listen laufen bei 200 % Zoom horizontal über

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-10-31
**Behoben in Version:** 0.50.28
**Test geschrieben:** Ja

**Beschreibung:** Bei 200 % Zoom überliefen Sortierauswahl, Vorschlagsdetails und Aktionen den sichtbaren Bereich der Voting-Liste.

**Reproduktion:** Eine öffentliche oder geschützte Voting-Ansicht bei 390 CSS-Pixeln öffnen und den Browserzoom auf 200 % setzen.

**Erwartetes Verhalten:** Sortierung, Spielname, Stimme und verfügbare Aktionen bleiben ohne horizontales Scrollen erreichbar.

**Tatsächliches Verhalten:** Der Sortierer und die langen Aktionsreihen verbreiterten die Seite; Stimmen und Spielinformationen konnten sich bei schmaler Breite überlagern.

**Ursache:** Starre Zeilen- und Selektorbreiten ohne Umbruchverhalten für eine effektive Viewportbreite von etwa 195 CSS-Pixeln.

**Lösung:** Gemeinsame kompakte Zeilen mit begrenzten Grid-Spalten, umbrechenden Inhalten und gestapelten Aktionen; die Sortierauswahl nutzt bei schmalen Breiten die verfügbare Zeilenbreite.

**Prüfnachweis:** Browser-Renderprüfung bei 390/1440 px und 200 % Zoom ohne horizontalen Überlauf; Regressionstests für kompakte Zeilen und Voting-Aktionen erfolgreich.

**Test-Status:** `tests/unit/components/proposal-ranking-list.test.tsx`, `tests/unit/components/public-proposal-vote-actions.test.tsx` sowie lokale 200-%-Browsermessung.

**Referenz im Changelog:** Version 0.50.28 – Mehr Übersicht in Voting-Listen.

---

### [BUG-048] Einzelne Abstimmungsrouten binden Vorschläge nicht an das Event

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-10-31
**Behoben in Version:** 0.50.34
**Test geschrieben:** Ja; PostgreSQL-Route-Integrationstests weisen fremde Spielvorschläge und Terminvorschläge ab und prüfen null Writes.

**Beschreibung:** Die geschützte Web-Spielstimmenroute lädt einen Vorschlag beim POST nur anhand proposalId. Ihr DELETE ignoriert die Event-ID vollständig. Die öffentliche Terminantwort-Route prüft den Gast gegen das Token-Event, jedoch nicht alle dateProposalIds gegen dasselbe Event.

**Reproduktion:** In einer isolierten Testdatenbank zwei Events A/B anlegen. Mit einem berechtigten Nutzer für A einen Vorschlag aus B an POST /api/events/A/votes übergeben. Mit Gast aus A eine Terminantwort für einen Vorschlag aus B an die öffentliche date-vote-Route für A senden. DELETE mit abweichender Event-ID prüfen.

**Erwartetes Verhalten:** Vorschlag, Gast, Stimme und freigegebenes Event müssen zusammengehören. Bei fremder ID 404 und keine einzige Mutation, auch in einer gemischten Bulk-Liste.

**Tatsächliches Verhalten laut Quellprüfung:** Web-POST filtert gameProposal nur nach ID; DELETE filtert nur proposalId/userId. Öffentliche Terminantworten werden anhand dateProposalId/guestId ohne Eventbindung upserted. Die Datenbankrelationen verhindern diese Kombination nicht.

**Ursache:** Zugriff auf das Event und Zuordnung des Schreibobjekts werden getrennt geprüft; an den genannten Stellen fehlt die zweite Bindung.

**Lösung:** Betroffene Web-, Mobile- und öffentliche Routen binden Vorschläge, Gäste und Termine an das gesperrte Event und validieren Bulk-Eingaben vor dem Schreiben.

**Prüfnachweis:** PostgreSQL-Integration ruft die Web-Spielstimmenrouten und öffentliche Terminantwort-Route mit IDs aus einem zweiten Event auf. Alle liefern 404; Vote- und DateVote-Zähler bleiben null. Keine produktiven Konten oder Daten verwendet.

**Referenz im Changelog:** Version 0.50.34 – Vorschlagszugehörigkeit serverseitig geprüft.

---

### [BUG-049] Entity-Dekodierung erzeugt uneinheitliche Spieltexte

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-10-31
**Behoben in Version:** 0.50.32
**Test geschrieben:** Ja; Normalisierung, Import, GameService, iOS-Sync-DTO, sicheres React-Rendering und Wartungsplan geprüft.

**Beschreibung:** Mehrfach kodierte Spielnamen und allgemeine numerische beziehungsweise benannte HTML-Entities werden nicht in allen Import-, Schreib- und Ausgabewegen konsistent dekodiert.

**Reproduktion:** Den BGG-Parser mit `Horrified: Dungeons &amp;amp; Dragons` und einer Beschreibung mit `&#x1F3B2;` verwenden; manuell erfassten Entity-Text über GameService speichern und Web-/Mobile-Ausgabe vergleichen. Erst in isolierten Fixtures beziehungsweise Testdaten nachweisen.

**Erwartetes Verhalten:** Ein gemeinsamer idempotenter Klartextvertrag, Unicode korrekt und dieselben Sonderzeichen in Import, Suche, Web und Mobile-API.

**Tatsächliches Verhalten laut Quellprüfung:** bgg-xml.ts verarbeitet nur eine feste Teilmenge und entfernt nicht alle verschachtelten Ebenen. Das Bereinigungsskript besitzt einen anderen Decoder und verwendet String.fromCharCode auch für Zeichen oberhalb U+FFFF. Manuelle GameService-Writes und DTO-Ausgabe normalisieren nicht.

**Ursache:** Mehrere voneinander abweichende Decoder sowie fehlende gemeinsame Textgrenzen.

**Lösung:** Gemeinsamer idempotenter Normalisierer, Leseschutz für Bestandswerte, normalisierte Schreib-/BGG-/DTO-Pfade, sichere Textausgabe und Compare-and-Set-Wartungs-CLI umgesetzt. Die tatsächliche Produktionsdatenbereinigung ist separat freizugeben und bleibt offen. [FEAT-009-Plan](superpowers/plans/2026-10-31-FEAT-009-spieldaten-entities.md).

**Prüfnachweis:** src/lib/bgg-xml.ts, src/lib/bgg.ts, scripts/fix-html-entities.ts und GameService-/DTO-Pfade am 31.10.2026 geprüft. Die Herkunft einzelner Bestandswerte bleibt bis zu einem lesenden Datenbericht unbestätigt.

**Referenz im Changelog:** Version 0.50.32 – Spieltexte mit Sonderzeichen vereinheitlicht.

---

### [BUG-050] Entwicklungsabhängigkeiten enthalten ungepatchte Auditbefunde

**Status:** `open`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Test geschrieben:** Nicht zutreffend; Paketstatus wird mit npm audit geprüft. BUG-050 bleibt wegen moderater/lower Dev-Befunde offen.

**Beschreibung:** Der Registry-Audit meldete zunächst hohe und moderate Befunde ausschließlich im Entwicklungsbaum. Der hohe Befund ist behoben; SEC-45 bleibt wegen moderater/lower Restbefunde teilweise gelöst.

**Reproduktion:** Mit funktionierendem Registry-Zugriff npm audit --json ausführen. Produktionsbaum getrennt mit npm audit --omit=dev prüfen.

**Erwartetes Verhalten:** Keine ungeklärten hohen Entwicklungsbefunde und keine neu zurückgekehrten SEC-45-Befunde gegenüber dem freigegebenen Stand.

**Tatsächliches Verhalten:** Der hohe systeminformation-Befund in shadcn → @dotenvx/dotenvx wurde durch ein kompatibles Update auf 5.33.19 behoben. Der aktuelle Registry-Audit meldet weiterhin 22 moderate und 2 niedrige Dev-Befunde, überwiegend in ESLint-, CodeceptJS- und shadcn-Werkzeugen. Produktionsaudit: 0 Befunde.

**Ursache:** Veraltete transitive Paketversionen und Advisory-Änderungen. Kompatible Fixes deckten die High-Schwachstelle ab, die verbleibenden Advisories verlangen Major-Upgrades.

**Lösung:** Teilweise. `npm audit fix` wendete kompatible Updates an und entfernte den hohen Befund (systeminformation 5.33.19; @hono/node-server 2.1.5; TypeScript-ESLint 8.72.1). Verbleibende Advisories erfordern laut npm Major-Upgrades von ESLint, CodeceptJS oder shadcn; keine pauschalen Major-Overrides anwenden.

**Prüfnachweis:** Registry-Audit vor/nach `npm audit fix`, `npm audit --omit=dev` sowie [Sicherheitsstand](code-reviews/security.md). Der hohe Befund ist entfernt; moderate/low Findings bleiben dokumentiert.

**Referenz im Changelog:** Version 0.50.33 – Sicherheitsprüfung robuster gemacht.

---

### [BUG-051] Review-Evaluator kann fehlgeschlagenen npm-Audit als befundfrei bewerten

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-10-31
**Behoben in Version:** 0.50.33
**Test geschrieben:** Ja; `tests/unit/scripts/npm-audit-result.test.ts` prüft Registryfehler, fehlende/ungültige Metadaten und gültige Auditantworten.

**Beschreibung:** SEC-45 verwendet bei fehlenden Audit-Metadaten einen leeren Befundsatz. Ein Netzwerkfehler mit gültigem Fehler-JSON kann dadurch als resolved statt als nicht ausführbare Prüfung erscheinen.

**Reproduktion:** npm audit --json in einer Umgebung ohne Registry-Zugriff ausführen; Fehler-JSON ohne metadata mit der SEC-45-Auswertung in scripts/review-evaluate.mjs verarbeiten.

**Erwartetes Verhalten:** Nicht ausgeführte oder ungültige Auditantworten liefern einen klaren Prüfungsfehler und keinen befundfreien beziehungsweise gelösten Sicherheitsstatus.

**Tatsächliches Verhalten laut Quellprüfung:** audit.metadata?.vulnerabilities wird bei Fehlen durch ein leeres Objekt ersetzt; critical/high/moderate werden auf 0 gesetzt. Der Auswertungspfad kann resolved zurückgeben, obwohl npm einen Registry-DNS-Fehler geliefert hat.

**Ursache:** Audit-Metadaten und Fehlerobjekt werden vor der Statusberechnung nicht validiert; Exitstatus allein wird nicht zwischen echten Befunden und Ausführungsfehlern unterschieden.

**Lösung:** Der Evaluator validiert Auditversion, Fehlerfeld und vollständige, konsistente Severity-Metadaten für Voll- und Produktionsaudit. Fehlerhafte oder fehlende Antworten bleiben `open`; sie können keinen sauberen Status mehr erzeugen.

**Prüfnachweis:** Regressionstest plus erfolgreicher Evaluatorlauf mit Registryzugriff am 31.10.2026.

**Referenz im Changelog:** Version 0.50.33 – Sicherheitsprüfung robuster gemacht.

---

### [BUG-052] Öffentliche BGG-Suche verwendet einen anmeldungsgebundenen Endpunkt

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.38
**Test geschrieben:** Ja – `tests/unit/api/public-bgg.test.ts` prüft tokengebundenen Zugriff ohne Session, Eventstatus, Parameter und Rate-Limit.

**Beschreibung:** Die öffentliche BGG-Suche verspricht eine Nutzung ohne Konto, ruft aber für Suche und Details /api/bgg auf. Dessen GET-Handler verlangt requireAuth.

**Reproduktion:** Einen gültigen öffentlichen Eventlink ohne Session öffnen und in der BGG-Suche einen Begriff absenden beziehungsweise Details abrufen. Den Ablauf bei späterer Umsetzung mit isolierten Testdaten nachweisen.

**Erwartetes Verhalten:** Katalogsuche ist für Besucher eines gültigen offenen Events ohne Konto möglich; Vorschlagen verlangt weiterhin eine zulässige Identität.

**Tatsächliches Verhalten laut Quellprüfung:** Der Client verwendet die geschützte generische Route, die ohne Session die Anfrage abweist. Die Proxy-Ausnahme für den Pfad ersetzt die Authprüfung im Handler nicht.

**Ursache:** Öffentliche Clientkomponente und Katalog-API haben unterschiedliche Zugriffsannahmen.

**Lösung:** Die öffentliche GET-Route `/api/public/event/{token}/bgg` prüft den Event-Share-Token und die FEAT-010-Capability ohne Anmeldung. Die bestehende allgemeine `/api/bgg`-Route bleibt geschützt.

**Prüfnachweis:** Unit-Tests decken öffentliche Suche und Details ohne Session sowie fehlenden Token und geschlossenen Eventzustand ab. Keine produktiven BGG-/Gastrequests durchgeführt.

**Test-Status:** API-Regressionstests bestanden; BGG-Transport ist separat mit kontrollierten XML-Antworten geprüft.

**Referenz im Changelog:** Version 0.50.38 – öffentliche BGG-Suche verständlicher machen.

---

### [BUG-053] Gastzugang besitzt keinen serverseitigen Besitznachweis

**Status:** `open`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-31
**Test geschrieben:** Nein; eigenständige Sicherheitskorrektur erforderlich.

**Beschreibung:** Der Gastbeitritt führt per eventId/nickname ein upsert aus und gibt einen bestehenden Gastdatensatz erneut zurück. Gastaktionen vertrauen anschließend einer übermittelten, zum Event passenden Gast-ID, ohne den Besitz dieses Zugangs nachzuweisen.

**Reproduktion:** In einer isolierten Testdatenbank einen Gast mit Stimmen anlegen. In einer zweiten Browserumgebung mit demselben öffentlichen Link und Spitznamen beitreten und die wieder ausgegebene Identität prüfen. Keine Tests gegen fremde produktive Gäste.

**Erwartetes Verhalten:** Die Wiederaufnahme einer bestehenden Gastidentität verlangt einen vom Server überprüfbaren Besitznachweis; Kenntnis des Namens oder der öffentlichen ID reicht dafür nicht.

**Tatsächliches Verhalten laut Quellprüfung:** join verwendet eventId_nickname als upsert-Schlüssel. Eine Session oder ein signierter Gastnachweis ist nicht erforderlich; lokale Speicherung allein beweist keinen Besitz.

**Ursache:** Teilnahmebezeichnung und Authentifizierung des Gastzugangs werden nicht getrennt.

**Lösung:** Offen, außerhalb des bestätigten FEAT-013-Umfangs „ohne Gastwechsel“. Ein eigener Korrekturschritt muss einen serverseitigen Besitznachweis, sichere Wiederaufnahme und eine Migration bestehender Gastzugänge definieren. Bis dahin keine neue Gastwechsel-/Übernahmefunktion anbieten.

**Prüfnachweis:** Öffentliche join-/vote-Routen und clientseitiger StoredGuestState am 31.10.2026 geprüft. Keine produktive Identität übernommen.

**Referenz im Changelog:** Version 0.50.30 – Öffentliche Teilnahme weiter geplant.

---

### [BUG-054] BGG-Vorschlag kann gleichzeitig Konto und Gast zugeordnet werden

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.39
**Test geschrieben:** Ja – `tests/unit/api/propose-bgg-validation.test.ts` prüft Sessionvorrang, ignorierte Legacy-Gast-ID und genau eine Autorenrelation.

**Beschreibung:** Bei vorhandener Session und gespeicherter Gast-ID sendet der BGG-Client beide Kontexte. Die Route kann gleichzeitig proposedById und guestId auf denselben neuen Vorschlag schreiben.

**Reproduktion:** In einer isolierten Umgebung einen Gastzugang speichern, sich anmelden und einen BGG-Vorschlag erzeugen; Autorenrelationen des Vorschlags prüfen.

**Erwartetes Verhalten:** Ein neuer Vorschlag hat genau eine aktuelle Autorenidentität. Bei Session erhält das Konto Vorrang; der alte Gast bleibt unverändert bestehen.

**Tatsächliches Verhalten laut Quellprüfung:** Der Client sendet activeGuestId unabhängig von currentUserId; die create-Daten setzen proposedById aus der Session und guestId unabhängig aus dem Body.

**Ursache:** Getrennte Konto-/Gast-Props ohne gemeinsame Prioritätsregel und ohne ausschließliche serverseitige Zuordnung.

**Lösung:** Client reicht bei Konto-Actor keine Gast-ID ein; die Route leitet die einzige Autorenrelation serverseitig aus der Session oder dem eventgebundenen Gast ab. Bei Session wird eine mitgesendete Legacy-Gast-ID ignoriert. Keine Bestands- oder Stimmenmigration.

**Prüfnachweis:** Fünf API-Unit-Tests decken Sessionvorrang, Gastzuordnung, fehlende Identität und BGG-ID-Validierung ab.

**Referenz im Changelog:** Version 0.50.39 – Öffentliche Eventteilnahme vereinheitlichen.

---

### [BUG-055] Öffentlicher Health-Endpoint liefert interne Diagnosedetails

**Status:** `in_progress`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Test geschrieben:** Ja; Unit-Tests prüfen Liveness- und Readinessantworten mit Mocks. Isolierte DB-Integration und Rollout-Abnahme offen.

**Beschreibung:** Der öffentlich freigegebene Health-Handler liefert Tabellenzähler, Migrationsnamen, Speicher-/Umgebungsdiagnosen und im Fehlerfall die rohe message einer DB-Exception.

**Reproduktion:** Den Handler in einer isolierten Umgebung mit erfolgreicher Probe und anschließend mit einer künstlichen DB-Exception aufrufen; öffentliche JSON-Antwort prüfen.

**Erwartetes Verhalten:** Öffentliche Liveness enthält nur notwendige grobe Betriebsinformationen. Geschützte Readiness liefert einen begrenzten Prüfstatus, keine rohen Verbindungs-/SQL-Fehler.

**Tatsächliches Verhalten:** `/api/health` liefert nach FEAT-006 nur Livenessfelder. `/api/health/ready` ist tokengebunden und gibt bei DB-Fehlern nur einen generischen Status zurück. Der Rollout ist noch nicht erfolgt.

**Ursache:** Interne Diagnose und öffentliche Erreichbarkeitsprüfung verwenden denselben Vertrag.

**Lösung:** Code in Version 0.50.42 umgesetzt; Monitorumstellung, Deploy und Staging-Abnahme noch offen. Siehe [FEAT-006-Plan](superpowers/plans/2026-10-31-FEAT-006-health-liveness-readiness.md).

**Prüfnachweis:** src/app/api/health/route.ts und öffentliche Proxyfreigabe am 31.10.2026 geprüft. Keine produktiven Fehler oder Daten abgefragt; keine Behauptung über tatsächlich offengelegte Zugangsdaten.

**Referenz im Changelog:** Version 0.50.31 – Betriebsschutz und Planprüfung vorbereitet.

---

### [BUG-056] Öffentliche Health-Anfragen verursachen skalierende DB-Last

**Status:** `in_progress`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Test geschrieben:** Ja; Mock-Unit-Tests decken Proxy-Bypass, Logausschluss und begrenzte Readiness-Probe ab. Last-/Treiber-/Erholungstests benötigen isoliertes Staging.

**Beschreibung:** Jede erfolgreiche Health-Anfrage erzeugt fünf DB-Leseprüfungen und einen asynchronen ApiLog-Write. Bei vorhandenem Sessioncookie kann zusätzlich die Sessionauflösung im auth-umschlossenen Proxy eine User-Abfrage auslösen.

**Reproduktion:** In isolierter Umgebung viele Health-Anfragen mit/ohne Sessioncookie senden und Prisma-Aufrufe zählen. Mehrere Instanzen oder Ausgangs-IP-Adressen bei der späteren Lastprüfung berücksichtigen.

**Erwartetes Verhalten:** Öffentliche Lebenszeichenprüfung ohne DB-Last; echte DB-Readiness nur geschützt und begrenzt. Health-Anfragen dürfen keine anfrageproportionale Log-Schreiblast erzeugen.

**Tatsächliches Verhalten:** Die neue öffentliche Liveness führt keine DB-, Session-, Redis- oder ApiLog-Operation aus. Readiness verwendet einen einzelnen Poolslot, eine kurze Probe, Tokenprüfung und ein prozesslokales Rate-Limit. Produktionsmonitoren sind noch nicht umgestellt.

**Ursache:** Tiefe Betriebsdiagnose, Sessionmiddleware und persistiertes Requestlogging sind an den öffentlichen Probeaufruf gekoppelt.

**Lösung:** Code für Liveness, Proxy und zentrale Logpolicy in Version 0.50.42 umgesetzt. Verbleibende Abnahme: Deployment, Verbraucher-/Monitorumstellung und isolierte DB-Last-/Ausfalltests. Siehe [FEAT-006-Plan](superpowers/plans/2026-10-31-FEAT-006-health-liveness-readiness.md).

**Prüfnachweis:** Health-Handler, src/lib/api-logger.ts, src/proxy.ts, src/lib/auth.ts und Rate-Limiter am 31.10.2026 gelesen. Kein Lasttest gegen Produktion und kein tatsächlicher Produktionsausfall behauptet.

**Referenz im Changelog:** Version 0.50.31 – Betriebsschutz und Planprüfung vorbereitet.

---

### [BUG-057] Öffentliche Gastregistrierung läuft bei 200 % Zoom horizontal über

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-10-31
**Behoben in Version:** 0.50.34
**Test geschrieben:** Ja – `tests/unit/components/guest-registration.test.tsx` prüft, dass Grid und Nickname-Eingabe schmal werden dürfen.

**Beschreibung:** Bei einer 390-px-Ansicht mit 200 % Zoom wurde die Gastregistrierung breiter als der Viewport.
**Reproduktion:** Öffentliche Eventseite bei 390 CSS-Pixeln beziehungsweise 195 CSS-Pixeln mit browserüblichem 200-%-Zoom öffnen und die Gastregistrierung prüfen.
**Erwartetes Verhalten:** Die Gastregistrierung und ihre Eingabe bleiben innerhalb des Viewports; der Text darf umbrechen.
**Tatsächliches Verhalten:** Der lange, nicht umbrechbare Eingabe-Platzhalter vergrößerte die implizite Grid-Mindestbreite auf 230 px.
**Ursache:** Grid-Karten und Eingabe konnten wegen ihrer automatischen Mindestbreite nicht bis zur schmalen Spaltenbreite schrumpfen.
**Lösung:** Grid, Karten und Eingabe erhalten `min-w-0`; der Renderregressionstest sichert diese Schrumpfbarkeit.
**Referenz im Changelog:** Version 0.50.34 – Fix BUG-057.

---

### [BUG-058] Geschlossener Eventstatus hat zu wenig Kontrast und Innenabstand

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-10-31
**Behoben in Version:** 0.50.34
**Test geschrieben:** Ja – `tests/unit/components/public-event-state-badge.test.tsx` prüft semantische Warnfarbe und Mindestinnenabstand.

**Beschreibung:** Das Status-Badge „Abstimmung geschlossen“ erfüllte im gerenderten öffentlichen Event bei 390 px die Kontrast- und Innenabstandsprüfung nicht.
**Reproduktion:** Eine geschlossene öffentliche Eventseite bei 390 × 844 px mit dem Impeccable-Detektor prüfen.
**Erwartetes Verhalten:** Der Status ist mit ausreichendem Kontrast lesbar und hat mindestens 4 px vertikalen Innenabstand.
**Tatsächliches Verhalten:** Der Detektor meldete 1,7:1 Kontrast und 3,8 px vertikalen Innenabstand.
**Ursache:** Das allgemeine sekundäre Badge nutzte auf der Warnfläche keine passende semantische Vordergrundfarbe und zu wenig vertikalen Innenabstand.
**Lösung:** Ein dediziertes Status-Badge verwendet `warning-foreground` und `py-1`; ein Unit-Test sichert beide Gestaltungsregeln.
**Referenz im Changelog:** Version 0.50.34 – Fix BUG-058.

---

### [BUG-059] Öffentlicher BGG-Vorschlag akzeptiert nicht numerische IDs

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-01
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.38
**Test geschrieben:** Ja – `tests/unit/api/propose-bgg-validation.test.ts` weist nicht numerische und zu lange IDs vor jedem BGG-Aufruf zurück.

**Beschreibung:** Der öffentliche Vorschlagsendpunkt prüfte die BGG-ID nur als Zeichenkette und setzte sie anschließend direkt in die BGG-URL ein.
**Reproduktion:** Den Vorschlagsendpunkt mit einer ID wie `13&query=collection` aufrufen.
**Erwartetes Verhalten:** Nur numerische BGG-IDs von 1 bis 12 Ziffern werden akzeptiert.
**Tatsächliches Verhalten:** Beliebiger Text bis zur allgemeinen Längenbegrenzung erreichte den BGG-Transport.
**Ursache:** Es fehlte eine domänenspezifische ID-Validierung vor dem Upstream-Aufruf.
**Lösung:** Der Server weist ungültige IDs mit HTTP 400 ab, bevor BGG kontaktiert wird.
**Referenz im Changelog:** Version 0.50.38 – öffentliche BGG-Suche verständlicher machen.

---

## Statistik

- **Offene Bugs:** 5
- **In Bearbeitung:** 4
- **Behoben:** 50
- **Wontfix:** 0
- **Gesamt:** 59
