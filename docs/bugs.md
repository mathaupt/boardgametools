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

**Lösung:** Öffentliche und geschützte Terminzeilen verwenden beschriftete native Radiogruppen mit sichtbarer, programmatischer Auswahl. Teilnehmerkarten und Einladungstexte umbrechen. Der aktuelle Quellstand setzt Terminwahl, Eingabefelder und Hauptaktionen auf mindestens 44 px. Manuelle VoiceOver-Abnahme und gerenderte Prüfung des aktuellen Quellstands stehen noch aus.

**Prüfnachweis:** Aktuelle Komponenten-/Unit-Tests sichern Radios, Tastaturwahl und 44-px-Ziele. Die archivierten Bilder und Browsermessungen in `public-event-A/` und `public-event-B/` stammen aus einem älteren Layout und gelten nicht als aktuelle gerenderte Abnahme.

**Test-Status:** Unit- und Chromium-E2E prüfen Tastaturwahl mit gespeicherter Antwort, zehn Termine, 50 Gäste, 44-px-Ziele und schmale Layouts. Aktuelle Browsermessung und manuelle VoiceOver-Abnahme ausstehend; deshalb bleibt der Befund in Bearbeitung.

**Referenz im Changelog:** Version 0.50.35 – Terminabstimmung barrierefrei bedienen.

---

**Nachprüfung 08.11.2026:** Aktueller lokaler Build bei 390 × 844 CSS-Pixeln mit zehn Terminen und 50 synthetischen Gästen plus neu registriertem Prüfgast gerendert. Alle drei Antworten stehen vollständig sichtbar untereinander. Die Tastatur erreicht „Vielleicht“; der Speicherversuch im lokalen Produktionsbuild scheiterte erwartbar am über HTTP nicht übermittelten Secure-Gastcookie und wird nicht als erfolgreiche Persistenzabnahme gewertet. VoiceOver-Start über native Steuerung endete im Computer-Use-Timeout; keine tatsächliche Sprachausgabe bestätigt. Deshalb weiterhin `in_progress`; keine abgeschlossene VoiceOver-Abnahme behauptet.

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

**Status:** `fixed`
**Behoben:** 2026-11-08
**Behoben in Version:** 0.50.95
**Schweregrad:** `low`
**Entdeckt:** 2026-10-30
**Test geschrieben:** Ja – `tests/unit/components/public-event-client.test.tsx` prüft die Desktop-Rasterklasse; gerenderte Viewport-Abnahme bleibt offen.

**Beschreibung:** Teilnehmer und Teilnahmehinweis bleiben auf Desktop untereinander.

**Reproduktion:** Öffentliche Seite bei 1440 Pixeln Breite öffnen.

**Erwartetes Verhalten:** Die im Markup vorgesehene Desktop-Spaltenaufteilung wird wirksam.

**Tatsächliches Verhalten:** Beide Karten bleiben untereinander und verlängern den Weg zur Gastteilnahme.

**Ursache:** lg:grid-cols-[2fr,1fr] in page.tsx erzeugt keine wirksame gültige Zweispaltenaufteilung.

**Lösung:** Gültiges `lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]` in der öffentlichen Eventseite umgesetzt; die Teilnehmerübersicht wird bei Desktopbreite als Seitenbereich angeordnet. Die aktuellen Screenshots in `public-event-A/` und `public-event-B/` stammen aus einem älteren Layout; die aktuelle Browserabnahme bei 1440 px ist im Nachtrag vom 08.11.2026 bestätigt.

**Prüfnachweis:** Unit-Test prüft die aktuelle Rasterklasse. Archivierte `anonymous-1440.png`-Belege und Layoutbeobachtungen sind wegen älteren Layouts nicht als aktuelle Abnahme gewertet.

**Test-Status:** Unit-Abdeckung vorhanden und aktuelle native Safari-Viewport-Abnahme bei 1440 px bestanden.

**Referenz im Changelog:** Version 0.50.95 – BUG-041: Desktop-Raster mit aktuellem Rendernachweis bestätigt.

---

**Abnahme 08.11.2026:** Aktueller lokaler App-Build mit frischer isolierter PostgreSQL-Testdatenbank in nativer Safari-Steuerung bei ausdrücklich eingestellten 1440 × 900 CSS-Pixeln gerendert. Spielebereich und Teilnehmendenliste (51 Einträge mit langen Namen) stehen sichtbar nebeneinander; Zeilen umbrechen innerhalb ihrer Spalte. Zusätzlich 390-px-Ansicht geprüft. Der vorhandene Komponenten-Regressionstest besteht. Schriftliche Evidenz: `.impeccable/critique/feat019-030-bugs/2026-11-08-review.md`; Screenshots im Computer-Use-Prüfverlauf. Damit ersetzt die neue Abnahme die im älteren Text noch als ausstehend beschriebene Desktopprüfung.

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

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-11-03
**Behoben in Version:** 0.50.71
**Test geschrieben:** Ja – `tests/unit/lib/event-proposal-permissions.test.ts` und Mobile-API-Regression in `tests/unit/app/api/mobile/v1/events.test.ts`.

**Beschreibung:** Die geschützte Rankingliste zeigt Erstellern das Löschen fremder Vorschläge an, während beide DELETE-Routen nur eigene Nutzervorschläge zulassen.

**Reproduktion:** Als Eventersteller einen fremden Vorschlag in der geschützten Voting-Rankingliste öffnen und Vorschlag löschen auslösen.

**Erwartetes Verhalten:** Angezeigte Löschrechte und serverseitige Rechte stimmen überein; nach dem zur Freigabe vorgelegten FEAT-004-Plan darf der Ersteller alle Vorschläge verwalten.

**Tatsächliches Verhalten:** Die UI prüft eventIsCreator oder proposedById, Web-/Mobile-API filtern jedoch zwingend auf proposedById des aktuellen Nutzers und liefern für fremde Vorschläge 404.

**Ursache:** Getrennte Berechtigungslogik in voting/proposal-ranking-list.tsx sowie den Web-/Mobile-Proposal-DELETE-Routen.

**Lösung:** Web- und Mobile-DELETE prüfen innerhalb der gesperrten Eventmutation dieselbe Rollenregel: Ersteller dürfen alle Vorschläge löschen, Vorschlagende ihre eigenen; andere Teilnehmende erhalten weiterhin 404.

**Prüfnachweis:** Rollenhelper und Mobile-Route mit fremdem Vorschlag getestet; gezielte Voting-/Mobile-Tests bestanden. Kein produktiver Schreibtest durchgeführt.

**Test-Status:** Rollen- und Mobile-API-Regressionstests bestanden.

**Referenz im Changelog:** Version 0.50.71 – Eventvorschläge berechtigt verwalten.

---

### [BUG-045] Geschütztes Web-Voting berücksichtigt Gaststimmen nicht vollständig

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-30
**Behoben:** 2026-11-03
**Behoben in Version:** 0.50.71
**Test geschrieben:** Ja – `tests/unit/lib/voting-sort.test.ts` und `tests/unit/components/proposal-ranking-list.test.tsx` prüfen gemischte Nutzer- und Gaststimmen.

**Beschreibung:** Die geschützten Web-Votingclients verwenden für sichtbare Stimmen und Rangfolge überwiegend nur Nutzerstimmen, obwohl Gaststimmen ebenfalls vorhanden sind.

**Reproduktion:** Vorschlag A mit zwei Nutzerstimmen und ohne Gaststimmen sowie Vorschlag B mit einer Nutzerstimme und vier Gaststimmen in einem öffentlichen Event anlegen; geschütztes Voting und öffentliche Ansicht vergleichen.

**Erwartetes Verhalten:** Gesamtstimmen und Standardsortierung berücksichtigen beide Stimmenarten konsistent.

**Tatsächliches Verhalten:** Vor FEAT-002 wurden in den geschützten Ansichten nur Nutzerstimmen gezählt; die aktuelle Implementierung addiert Nutzer- und Gaststimmen.

**Ursache:** Unterschiedliche Darstellungsmodelle und lokale Sortierungen in beiden geschützten voting-client.tsx und proposal-ranking-list.tsx.

**Lösung:** Die geschützten Voting-Ansichten verwenden ein gemeinsames Sortiermodell mit `totalVotes`; beide Zähler werden addiert und für angezeigte Stimmen, Standardrangfolge und Ranggleichstände verwendet. FEAT-002 hat die Abweichung bereits behoben; die erneute Prüfung bestätigt den Vertrag.

**Prüfnachweis:** Die gezielten Unit- und Komponentenprüfungen für gemischte Stimmen und Standardsortierung bestanden. Kein produktiver Schreibtest durchgeführt.

**Test-Status:** Unit- und Komponentenregressionstests für kombinierte Stimmzahlen, Sortierung und Ranggleichstände bestanden.

**Referenz im Changelog:** Version 0.50.71 – Eventvorschläge berechtigt verwalten.

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

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-11-03
**Behoben in Version:** 0.50.72
**Test geschrieben:** Ja – vollständiger `npm audit`, Produktionsaudit, `npm ls`, `npx codeceptjs --version`, Build, 1.114 Unit-Tests, TypeScript und ESLint.

**Beschreibung:** Der Registry-Audit meldete zunächst hohe und moderate Befunde ausschließlich im Entwicklungsbaum. Der hohe Befund ist behoben; SEC-45 bleibt wegen moderater/lower Restbefunde teilweise gelöst.

**Reproduktion:** Mit funktionierendem Registry-Zugriff npm audit --json ausführen. Produktionsbaum getrennt mit npm audit --omit=dev prüfen.

**Erwartetes Verhalten:** Der Produktionsaudit ist befundfrei; Entwicklungswerkzeuge bleiben startfähig und hohe/moderate Auditbefunde sind behoben.

**Tatsächliches Verhalten:** Vor dem Fix meldete der Registry-Audit 22 moderate und 2 niedrige Dev-Befunde. Danach bleiben ein niedriger Befund für `deepmerge` in der shadcn-CLI sowie 0 Produktionsbefunde.

**Ursache:** Veraltete transitive `minimatch`-/`glob`-Versionen und ein niedriger Befund in der shadcn-Abhängigkeitskette.

**Lösung:** `glob` wird auf 14.0.3 und `minimatch` auf 11.0.4 festgelegt. Das shadcn-Paket bleibt für den Build-Import `shadcn/tailwind.css` installiert. Die gepatchten Overrides wurden mit dem vollständigen Unit-Testlauf, ESLint, TypeScript und CodeceptJS-CLI-Smoke-Test geprüft.

**Prüfnachweis:** `npm audit --json` am 03.11.2026: 1 niedriger Dev-Befund (`deepmerge`), 0 moderate/hohe/kritische Befunde; `npm audit --omit=dev`: 0 Befunde. `npm ls minimatch glob --all` zeigt gepatchte Versionen; `npx codeceptjs --version` liefert 4.2.2. 1.114 Tests in 161 Dateien, `npm run typecheck` und `npm run lint` (0 Fehler) bestanden.

**Referenz im Changelog:** Version 0.50.72 – Entwicklungsabhängigkeiten absichern.

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

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-11-03
**Behoben in Version:** 0.50.73
**Test geschrieben:** Ja – `tests/unit/api/public-voting-flow.test.ts`, `tests/unit/api/propose-bgg-validation.test.ts`, `tests/unit/lib/guest-credentials.test.ts`.

**Beschreibung:** Der Gastbeitritt führt per eventId/nickname ein upsert aus und gibt einen bestehenden Gastdatensatz erneut zurück. Gastaktionen vertrauen anschließend einer übermittelten, zum Event passenden Gast-ID, ohne den Besitz dieses Zugangs nachzuweisen.

**Reproduktion:** In einer isolierten Testdatenbank einen Gast mit Stimmen anlegen. In einer zweiten Browserumgebung mit demselben öffentlichen Link und Spitznamen beitreten und die wieder ausgegebene Identität prüfen. Keine Tests gegen fremde produktive Gäste.

**Erwartetes Verhalten:** Die Wiederaufnahme einer bestehenden Gastidentität verlangt einen vom Server überprüfbaren Besitznachweis; Kenntnis des Namens oder der öffentlichen ID reicht dafür nicht.

**Tatsächliches Verhalten vor Fix:** join verwendete eventId_nickname als upsert-Schlüssel. Eine Session oder ein serverseitig überprüfbarer Gastnachweis war nicht erforderlich; lokale Speicherung allein bewies keinen Besitz.

**Ursache:** Teilnahmebezeichnung und Authentifizierung des Gastzugangs werden nicht getrennt.

**Lösung:** Neue Gastzugänge erhalten ein zufälliges, ereignisgebundenes HttpOnly-Cookie; serverseitig wird ausschließlich dessen SHA-256-Hash gespeichert. Stimmen, Terminantworten und BGG-Vorschläge prüfen den Besitznachweis bei jeder Änderung. Alte Gastzugänge ohne Nachweis können nicht übernommen werden: Betroffene registrieren sich mit einem neuen Spitznamen, während ihre bisherigen Stimmen erhalten bleiben. Der Nachweis wird nicht in API-Antworten oder Teilnehmerabfragen offengelegt.

**Entscheidung am 03.11.2026:** Zur sicheren Wiederaufnahme wählen Gäste ohne bisherigen Besitznachweis einen neuen Spitznamen. Ihre bisherigen Stimmen bleiben erhalten.

**Prüfnachweis:** Vorher rot und danach grün: 85 fokussierte Unit-Tests über Gastbeitritt, Vote-/Terminänderungen, BGG-Vorschlag, Client-Wiederaufnahme und datensparsame Teilnehmerabfragen. Kein produktiver Gastzugang verwendet. Datenbankmigration lokal erstellt, nicht auf Produktion angewendet.

**Referenz im Changelog:** Version 0.50.73 – Gastzugänge sicher wiederaufnehmen.

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

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-11-05
**Behoben in Version:** 0.50.83
**Test geschrieben:** Ja – `tests/unit/api/health.test.ts` und `tests/unit/api/health-readiness.test.ts`; zusammen mit den Proxy-, Logger- und Probe-Tests am 04.11.2026 erfolgreich ausgeführt (26 Tests). Keine aktiven Monitoring-Verbraucher laut Nutzer; spätere Betriebsabnahme ist FEAT-030.

**Beschreibung:** Der öffentlich freigegebene Health-Handler liefert Tabellenzähler, Migrationsnamen, Speicher-/Umgebungsdiagnosen und im Fehlerfall die rohe message einer DB-Exception.

**Reproduktion:** Den Handler in einer isolierten Umgebung mit erfolgreicher Probe und anschließend mit einer künstlichen DB-Exception aufrufen; öffentliche JSON-Antwort prüfen.

**Erwartetes Verhalten:** Öffentliche Liveness enthält nur notwendige grobe Betriebsinformationen. Geschützte Readiness liefert einen begrenzten Prüfstatus, keine rohen Verbindungs-/SQL-Fehler.

**Tatsächliches Verhalten:** `/api/health` liefert nach FEAT-006 nur Livenessfelder. `/api/health/ready` ist tokengebunden und gibt bei DB-Fehlern nur einen generischen Status zurück. Der Rollout ist noch nicht erfolgt.

**Ursache:** Interne Diagnose und öffentliche Erreichbarkeitsprüfung verwenden denselben Vertrag.

**Lösung:** Code in Version 0.50.42 umgesetzt. Der Nutzer bestätigte am 05.11.2026, dass derzeit keine Monitoring-Systeme existieren; es gibt daher keine vorhandenen Verbraucher umzustellen. Eine künftige Einrichtung mit Readiness-Secret und Staging-Abnahme ist in FEAT-030 erfasst. Siehe [FEAT-006-Plan](superpowers/plans/2026-10-31-FEAT-006-health-liveness-readiness.md).

**Historischer Prüfstand 03.11.2026:** Der konfigurierte Produktions-Livenesscheck lief erfolgreich und bestätigte HTTP 200 mit gültigem Liveness-JSON. Der Provider `health-readiness` war nicht konfiguriert; es wurden keine Produktionskonfigurationen oder Secrets geändert.

**Abschluss am 05.11.2026:** Nutzerbestätigung: Es gibt aktuell keine Monitoring-Systeme. Der Liveness-Handler liefert nur den minimalen Status; Readiness ist separat tokengebunden und gibt keine rohen DB-Fehler aus. Künftiger Monitoring-Rollout wird über FEAT-030 geplant. Ein erneuter Produktionsdeploy wurde in diesem Arbeitsschritt nicht ausgelöst.

**Prüfnachweis:** src/app/api/health/route.ts und öffentliche Proxyfreigabe am 31.10.2026 geprüft. Keine produktiven Fehler oder Daten abgefragt; keine Behauptung über tatsächlich offengelegte Zugangsdaten.

**Referenz im Changelog:** Version 0.50.83 – BUG-055/056 geschlossen; Monitoring als FEAT-030 aufgenommen.

---

### [BUG-056] Öffentliche Health-Anfragen verursachen skalierende DB-Last

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-10-31
**Behoben:** 2026-11-05
**Behoben in Version:** 0.50.83
**Test geschrieben:** Ja – Mock-Unit-Tests decken Proxy-Bypass, Logausschluss und begrenzte Readiness-Probe ab; der zugehörige Testsatz lief am 04.11.2026 mit 26 erfolgreichen Tests. Weitere Last-/Treiber-/Erholungstests werden vor einer späteren Monitorintegration im Rahmen von FEAT-030 geplant.

**Beschreibung:** Jede erfolgreiche Health-Anfrage erzeugt fünf DB-Leseprüfungen und einen asynchronen ApiLog-Write. Bei vorhandenem Sessioncookie kann zusätzlich die Sessionauflösung im auth-umschlossenen Proxy eine User-Abfrage auslösen.

**Reproduktion:** In isolierter Umgebung viele Health-Anfragen mit/ohne Sessioncookie senden und Prisma-Aufrufe zählen. Mehrere Instanzen oder Ausgangs-IP-Adressen bei der späteren Lastprüfung berücksichtigen.

**Erwartetes Verhalten:** Öffentliche Lebenszeichenprüfung ohne DB-Last; echte DB-Readiness nur geschützt und begrenzt. Health-Anfragen dürfen keine anfrageproportionale Log-Schreiblast erzeugen.

**Tatsächliches Verhalten:** Die neue öffentliche Liveness führt keine DB-, Session-, Redis- oder ApiLog-Operation aus. Readiness verwendet einen einzelnen Poolslot, eine kurze Probe, Tokenprüfung und ein prozesslokales Rate-Limit. Laut Nutzer gibt es derzeit keine Monitoring-Systeme.

**Ursache:** Tiefe Betriebsdiagnose, Sessionmiddleware und persistiertes Requestlogging sind an den öffentlichen Probeaufruf gekoppelt.

**Lösung:** Code für DB-freie Liveness, Proxy-Bypass, zentrale Logpolicy und begrenzte tokengebundene Readiness in Version 0.50.42 umgesetzt. Der Nutzer bestätigte am 05.11.2026, dass es derzeit keine Monitoring-Systeme gibt. Ein späterer Monitoring-Rollout samt isolierter Betriebsabnahme ist in FEAT-030 erfasst. Siehe [FEAT-006-Plan](superpowers/plans/2026-10-31-FEAT-006-health-liveness-readiness.md).

**Prüfnachweis:** Health-Handler, src/lib/api-logger.ts, src/proxy.ts, src/lib/auth.ts und Rate-Limiter am 31.10.2026 gelesen. Kein Lasttest gegen Produktion und kein tatsächlicher Produktionsausfall behauptet.

**Abschluss am 05.11.2026:** Aktuellen Code und Tests erneut geprüft. Öffentliche Liveness umgeht Sessionauflösung, Datenbank und ApiLog; Readiness ist tokengebunden, begrenzt und teilt parallele Probes. Die noch nicht vorhandene Monitorintegration und ihre isolierte DB-Last-/Timeout-/Erholungsabnahme sind als zukünftiger Umfang FEAT-030 erfasst; es wurde keine Produktionslast erzeugt.

**Referenz im Changelog:** Version 0.50.83 – BUG-055/056 geschlossen; Monitoring als FEAT-030 aufgenommen.

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

### [BUG-060] Vercel-Pipelineprovider setzt API-Token als Prozessargument

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-01
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.43
**Test geschrieben:** Ja – `tests/unit/scripts/vercel-provider.test.ts` prüft, dass das Token über stdin an curl gelangt und weder Prozessargumente noch Ausgabe enthält.

**Beschreibung:** Der lesende Vercel-Deploymentcheck übergab `VERCEL_TOKEN` direkt in `curl -H "Authorization: Bearer …"`. Kommandozeilenargumente können anderen Prozessen desselben Hosts zugänglich sein.
**Reproduktion:** Provider mit Testtoken ausführen und curl-Argumentliste erfassen; der Authorization-Header enthielt den Tokenwert.
**Erwartetes Verhalten:** Der Provider ruft die Vercel-API read-only auf, ohne das Token in Prozessargumenten, URL oder Ausgabe zu führen.
**Tatsächliches Verhalten:** Das Token war vor dem Fix Teil der curl-Argumentliste.
**Ursache:** Der Authorization-Header wurde im Shellskript direkt in die Argumentliste interpoliert.
**Lösung:** Header wird über curl-stdin (`-H @-`) eingelesen. Ein Regressionstest sichert die Tokenübergabe ab.
**Referenz im Changelog:** Version 0.50.43 – Vercel-Betriebschecks vorbereiten.

---

### [BUG-061] Angemeldetes Dashboard bricht beim Server-Rendern ab

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-11-01
**Behoben:** 2026-11-01
**Behoben in Version:** 0.50.46
**Test geschrieben:** Ja – `tests/unit/lib/dashboard-date.test.ts` deckt gecachte ISO-Strings und Prisma-`Date`-Werte ab.

**Beschreibung:** Beim Aufruf des Dashboards in einer angemeldeten Sitzung meldet der Produktionsclient React-Fehler #441. React beschreibt diesen Code als fehlgeschlagenen Server-Component-Render; die konkrete Fehlermeldung wird im Production-Build verborgen.

**Reproduktion:** Angemeldet `/dashboard` direkt aufrufen oder die Route neu laden. In beiden Fällen meldet der Browser `Minified React error #441`.

**Erwartetes Verhalten:** Das Dashboard wird nach erfolgreicher Anmeldung gerendert oder zeigt einen nachvollziehbaren, vorübergehenden Fehlerzustand.

**Tatsächliches Verhalten:** Der Client erhielt bei direktem Aufruf und Neuladen React #441. Der bereitgestellte Server-Digest `219148984` zeigte auf `eventDate.toISOString()` in der Dashboard-Ausgabe; der Wert kam aus dem Next.js-Cache als String.

**Ursache:** `unstable_cache` serialisiert Prisma-Datumswerte über Requests hinweg; beim Cache-Hit ist `eventDate` ein ISO-String. `src/app/(dashboard)/dashboard/page.tsx` behandelte den gecachten Wert wie ein Prisma-`Date` und rief `.toISOString()` darauf auf. `playedAt` nutzte denselben unsicheren Annahmepfad.

**Lösung:** `toDashboardISOString` normalisiert sowohl gecachte ISO-Strings als auch Prisma-`Date`-Objekte. Event- und Sessionzeitpunkte verwenden den Helper vor der Übergabe an die Clientkomponente.

**Prüfnachweis:** React-Digest `219148984` korreliert mit dem übermittelten Stacktrace. Regressionstest 2/2 bestanden; `npm run typecheck` und `npm run build` erfolgreich. Keine produktive Datenbank wurde abgefragt.

**Referenz im Changelog:** Version 0.50.46 – gecachte Dashboard-Datumswerte normalisieren.

---

### [BUG-062] Ungültige verschachtelte Elemente in Session-Metadaten

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.52
**Test geschrieben:** Ja – `tests/unit/components/sessions-page.test.tsx` rendert die Sessionkarte.

**Beschreibung:** Die Sessions-Übersicht platzierte Blockelemente innerhalb von `CardDescription`, die als `<p>` gerendert wird. Das erzeugte ungültiges HTML und eine React-Hydration-Warnung.
**Reproduktion:** Eine Sessionkarte unter `/dashboard/sessions` rendern; React meldet, dass ein `<div>` kein Nachfahre eines `<p>` sein darf.
**Erwartetes Verhalten:** Metadaten werden mit gültigen HTML-Elementen gerendert und verursachen keine Hydration-Warnung.
**Tatsächliches Verhalten:** Die als Absatz gerenderte Beschreibung enthielt mehrere `<div>`-Elemente.
**Ursache:** `CardDescription` wurde für eine horizontale Gruppe von Blockelementen verwendet.
**Lösung:** Metadaten werden in einem `<div>` gruppiert; die einzelnen Metadaten-Elemente sind `span`-Elemente. Der Regressionstest rendert die Liste mit Spiel- und Fallback-Cover.
**Referenz im Changelog:** Version 0.50.52 – Sessioncover in der Übersicht.

---

### [BUG-063] Dashboard-Rangfolge bricht bei gecachten Vorschlagsdaten ab

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.55
**Test geschrieben:** Ja – `tests/unit/lib/dashboard-event-proposals.test.ts` reproduziert gecachte ISO-Zeitstempel und prüft die stabile Sortierung.

**Beschreibung:** Das angemeldete Dashboard kann beim Sortieren gleich bewerteter Spielvorschläge mit `TypeError: a.createdAt.getTime is not a function` abbrechen.
**Reproduktion:** Dashboard laden, wenn der Vorschlagsdaten-Cache einen Treffer liefert. Bei gleicher Stimmenzahl sortiert die Top-drei-Rangfolge anhand `createdAt`; der Cache liefert das Prisma-Datum als ISO-String.
**Erwartetes Verhalten:** Die Rangfolge sortiert Prisma-`Date`-Werte und aus dem Next.js-Cache gelesene ISO-Zeitstempel gleichwertig.
**Tatsächliches Verhalten:** Der Server ruft `.getTime()` direkt auf dem gecachten String auf; Digest `113253834`.
**Ursache:** Die Ranglogik für FEAT-015 nahm an, dass das Datum aus `cachedQuery` zur Laufzeit immer ein Prisma-`Date` bleibt. Der Cache serialisiert Datumsspalten zwischen Requests als ISO-Strings.
**Lösung:** Der Rangtyp akzeptiert `Date | string`; ein gemeinsamer Zeitstempel-Helper normalisiert beide Varianten vor dem Tie-Breaker.
**Referenz im Changelog:** Version 0.50.55 – gecachte Dashboard-Vorschlagsdaten sicher sortieren.

---

### [BUG-064] Öffentliche Spielvorschläge uneinheitlich und bei großer Schrift abgeschnitten

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.61
**Test geschrieben:** Ja – `tests/unit/components/public-event-proposal-surfaces.test.tsx`; erwartetes RED für fehlende Beschriftung und doppelten Suchhinweis, anschließend grün. Native Browserprüfung ergänzt Layout-/Kontrastnachweise.

**Beschreibung:** Die vorherige FEAT-020-Korrektur änderte nur die Trefferflächen. Äußere BGG-/Sammlungspanels blieben halbtransparent, die Sammlungssuche unbeschriftet und unterschiedlich hoch; „Reset“ hatte ein Suchsymbol. Der deaktivierte BGG-Button wurde durch halbe Deckkraft unnötig blass. Bei 200 % Schrift konnte die Vorschlagaktion innerhalb der scrollbaren Liste seitlich überlaufen.
**Reproduktion:** Öffentliche Eventseite mit Konto und Sammlung öffnen; Sammlung und BGG-Suche vergleichen. Bei schmaler Ansicht die Schrift auf 200 % erhöhen. Der Screenshot und die lokale Komponenten-Vorschau mit Anwendungs-CSS reproduzieren die Darstellung.
**Erwartetes Verhalten:** Klar abgesetzte, einheitliche Suchbereiche, beschriftete Felder, lesbare Zustände und vollständig erreichbare Aktionen auch bei großer Schrift.
**Tatsächliches Verhalten:** Schwache Flächenabgrenzung, unterschiedliche Kontrollhöhen und bei großer Schrift horizontaler Überlauf innerhalb der Sammlungsliste.
**Ursache:** Getrennte Darstellungsregeln für beide Suchbereiche, `bg-background/70` auf Außenflächen, globale `disabled:opacity-50` und nicht umbrechende Aktionsbeschriftungen.
**Lösung:** Gemeinsames Panel-/Listenlayout, deckende semantische Flächen, beschriftete 44-px-Suchkontrollen und ausgeschriebene Vorschlagaktionen; explizit lesbarer deaktivierter Suchzustand. Aktionsbeschriftungen sind in der verfügbaren Breite umbrechbar.
**Prüfnachweis:** 13/13 gezielte Tests einschließlich Axe; native Browserprüfung über lokalen Vite-Server mit realen Komponenten/synthetischen Daten bei 390/1024 px, Hell/Dunkel und 200 % Schrift. Nach Korrektur keine horizontalen Listenüberläufe; minimale gemessene Textkontraste 5,59:1 hell und 5,33:1 dunkel.
**Referenz im Changelog:** Version 0.50.61 – Spielvorschläge klarer und einheitlicher bedienen.

---

### [BUG-065] BGG-Importvorschau läuft bei großer Schrift seitlich über

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.63
**Test geschrieben:** Ja – `tests/unit/components/bgg-import-editions.test.tsx`, zusätzlich gerenderte Safari-Prüfung.

**Beschreibung:** Bei 390 px und 200 % Schrift drückte der nicht umbrechende Importbutton die gesamte Vorschau über den Bildschirmrand. Große Vorschaubilder ließen den Ausgabennamen zu wenig Platz.
**Reproduktion:** Spiel im Einzelimport laden, mobile Breite und 200 % Schrift einstellen.
**Erwartetes Verhalten:** Vollständig lesbare Auswahl und erreichbare Importaktion ohne seitliches Scrollen.
**Tatsächliches Verhalten:** Gemessene Dokumentbreite 599 px bei 390 px Viewport.
**Ursache:** Automatische Mindestbreiten im Grid, nicht umbrechende Aktionsbeschriftung und nebeneinander platzierte, mit der Schrift vergrößerte Cover.
**Lösung:** Schrumpfbare Grid-Inhalte, umbrechende Importaktion, begrenzte Covergröße und mehrzeilige mobile Ausgabenkarte.
**Prüfnachweis:** Gezielt fehlschlagender Umbruchvertrag vor Fix, danach 2/2 Integrationstests grün. Safari meldet danach keine überlaufenden Auswahl-/Aktionsflächen bei 390 px und 200 % Schrift.
**Referenz im Changelog:** Version 0.50.63 – BUG-065.

---

### [BUG-066] Login und Landingpage laufen bei großer Schrift seitlich über

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.64
**Test geschrieben:** Ja – `tests/unit/components/site-footer.test.tsx` (RED: zwei fehlende Layout-/Linkverträge, danach sieben Tests grün); gerenderte Safari-Nachprüfung.

**Beschreibung:** Die Footerabnahme zeigte vorhandene Überläufe im Login-Titel und in den Navigations-/Aktionszeilen der Landingpage. Dort waren außerdem Buttons in Links verschachtelt.
**Reproduktion:** Login beziehungsweise Landingpage mit 390 px Breite und 200 % Schrift öffnen.
**Erwartetes Verhalten:** Inhalte umbrechen, alle Aktionen und Footer bleiben im sichtbaren Dokumentbereich und sind mit eindeutiger Linksemantik erreichbar.
**Tatsächliches Verhalten:** Login 423 px, Landingpage zunächst 831 px Dokumentbreite bei circa 388 px verfügbarem Viewport; verschachtelte Aktionen ohne eindeutige zugängliche Linknamen im nativen Browser.
**Ursache:** Fehlender Titelumbruch, nicht umbrechende Header-/Aktionsgruppen und nicht schrumpfbare große Schaltflächen; interaktive Elemente ineinander verschachtelt.
**Lösung:** Schrumpfbare Inhalte, Umbruch für lange Titel und Zeilen, auf die verfügbare Breite begrenzte Aktionslinks mit `Button asChild`. Der Footer bleibt im Dokumentfluss.
**Prüfnachweis:** Safari meldet nach Korrektur weder überlaufende Seiteninhalte noch Footerflächen bei mobiler Breite und 200 % Schrift. Login und Landingpage enthalten jeweils genau einen Footer mit 200 px breitem Original-Logo; Links haben ihre sichtbaren Aktionsnamen.
**Referenz im Changelog:** Version 0.50.64 – BUG-066.

---

### [BUG-067] Monitoring zeigt veraltete Coverage und Testzahlen

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.65
**Test geschrieben:** Ja – Generator-, API-, Komponenten- und Umlauttests; erwartetes RED vor dem Fix bestätigt.

**Beschreibung:** Unter Monitoring → Qualität erscheinen noch Coverage-Werte im Bereich von 20 %, obwohl vollständige lokale Messungen inzwischen deutlich höhere Werte liefern.
**Reproduktion:** Angemeldet als Administrator Monitoring → Qualität → Code-Qualität öffnen, die Coverage mit dem letzten vollständigen Testlauf vergleichen.
**Erwartetes Verhalten:** Die ausgelieferte Version zeigt nachvollziehbare Messwerte mit Messzeitpunkt und Umfang. Gesamtwerte und Bibliotheksziel werden getrennt dargestellt.
**Tatsächliches Verhalten:** Coverage wird aus lokalen Review-History-Dateien gelesen; im Git-Checkout liegt nur ein älterer freigegebener Snapshot. Testzahlen und vorherige Coverage sind fest einprogrammiert; die Kennzeichnung verwendet teilweise „Qualitaet“.
**Ursache:** Lokale, ignorierte Review-History wurde als deploybare Messdatenquelle verwendet; tatsächliche Testberichte und Produktionsanzeige waren nicht verbunden.
**Lösung:** Versionierte Messdatei aus vollständigem erfolgreichem Vitest-/Coverage-Lauf generieren und im API-Bundle mitliefern. Fehlgeschlagene, ungültige und unvollständige Berichte erhalten den vorherigen Stand. Messdatum, Version und Bibliothekswerte anzeigen, künstlichen Coverage-Vergleich entfernen; übrige Reviewzahlen als historisch kennzeichnen. Deutsche Umlaute korrigieren.

**Prüfnachweis:** 12 gezielte Tests grün (Generator, Adminschutz/API-Quelle, Anzeige, historische Einordnung, Umlaut). Vollständiger Coverage-Lauf: 152 Dateien, 1.048 Tests bestanden; Messdatei tatsächlich erzeugt. Gesamt 60,91/57,07/66,00/62,31 %, `src/lib` 89,01/80,48/90,93/91,53 %. Produktionsbuild mit Typprüfung, ESLint ohne Fehler, Security- und Review-Regressionscheck bestanden. Native Safari-Prüfung über lokalen Server: Desktop hell, mobil dunkel und 200 % Schrift; keine horizontalen Überläufe. Keine Produktionsdatenbank verwendet.
**Referenz im Changelog:** Version 0.50.65 – Verlässliche Qualitätsmesswerte im Monitoring.

---

### [BUG-068] Serienimport erklärt vorhandene Spiele nicht und gleicht die Liste nicht ab

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.66
**Test geschrieben:** Ja – API- und UI-Verträge vor dem Fix erwartungsgemäß rot; Nachlade-Widerspruch ebenfalls zuerst rot.

**Beschreibung:** Beim Hinzufügen über die BGG-Suche meldet POST `/api/series/{id}/entries` den Konflikt „Game is already in this series“. Der Nutzer bestätigt später, dass das Spiel offenbar hinzugefügt wird und vor allem die Rückmeldung irreführend ist.
**Reproduktion:** Mit einer älteren oder gefilterten Reihenansicht ein serverseitig bereits vorhandenes Spiel über BGG hinzufügen. Ein erneuter Import liefert 409.
**Erwartetes Verhalten:** Vorhandenes Spiel als Hinweis erklären, aktuelle Reihe laden, Zielspiel verifizieren und Filter zurücksetzen. Echte Fehler dürfen weder ignoriert noch als erfolgreicher Abgleich gemeldet werden.
**Tatsächliches Verhalten:** Beide Hinzufügenpfade ignorieren alle Antworten außerhalb von 2xx. Ein 409 löst weder Hinweis noch Nachladen aus; englische Servermeldung. Nach erfolgreichem POST wird das Nachladen nicht abgewartet und der Dialog unmittelbar geschlossen.
**Ursache:** Fehlender Konflikt-/Fehlerpfad und nicht abgewarteter Zustandsabgleich im Dialog. Der HTTP-Status 409 bleibt für einen tatsächlich vorhandenen Eintrag korrekt; der konkrete Ursprung des ersten Produktionskonflikts ist ohne weiteren Produktionsnachweis nicht abschließend bestimmt.
**Lösung:** Gemeinsamer Hinzufügen-Hook für Sammlung/BGG/Barcode, 409-Abgleich ohne erneuten Schreibversuch, frische private Seriendetails, verifiziertes Zielspiel und zurückgesetzte Filter erst nach erfolgreichem Nachladen. Fehler/Widerspruch im Dialog behalten, deutsche Rückmeldung und Sperre laufender Anfragen. Authfehler der POST-Route werden kontrolliert beantwortet.
**Datenabgrenzung:** Keine Sitzungscookies verwendet oder gespeichert. Schreibgeschützte Diagnose in der lokal konfigurierten Datenquelle fand die gemeldete Reihen-ID nicht; daraus wird keine Aussage über den Produktionsbestand abgeleitet. Keine Datenbankeinträge geändert.

**Prüfnachweis:** 13 gezielte Serien-API-/UI-Tests grün; BGG und Sammlung, normale Übernahme, Konflikt mit frischem sichtbarem Eintrag und Filter-Reset, fehlgeschlagenes/widersprüchliches Nachladen, Auth/Eigentum sowie Doppelclick abgedeckt. Lokale Safari-Prüfung realer Komponenten mit synthetischen Antworten: BGG-Konflikt zeigt vorhandenes Spiel mit deutschem Hinweis; Fehlerdialog bleibt offen. Bei 390 px und 200 % Schrift gefundener Dialog-/Headerüberlauf korrigiert (danach 388 px Dokumentbreite bei 388 px Viewport, keine Dialogüberläufe). Keine Produktionsmutation und keine Nutzung übermittelter Cookies.
**Referenz im Changelog:** Version 0.50.66 – BUG-068.

---


### [BUG-069] Erfolgreicher BGG-Sammlungsimport zeigt gelbe Duplikatswarnung

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-02
**Behoben:** 2026-11-02
**Behoben in Version:** 0.50.66
**Test geschrieben:** Ja – `tests/unit/components/bgg-import-editions.test.tsx`: erfolgreicher Import bei ausstehender Navigation erzeugte vor dem Fix erwartungsgemäß die gelbe Warnung.

**Beschreibung:** Nach erfolgreichem BGG-Import erscheint kurz beziehungsweise bei verzögerter Navigation dauerhaft die Warnung, das Spiel sei bereits in der Sammlung.
**Reproduktion:** Einzelimport erfolgreich absenden, während der Wechsel nach `/dashboard/games` noch aussteht. Ein Test mit zurückgehaltener Navigation reproduziert dies.
**Erwartetes Verhalten:** Bestätigten Import als Erfolg anzeigen und erneutes Absenden verhindern. Schon vor dem Import vorhandene Spiele weiterhin als vorhanden kennzeichnen.
**Tatsächliches Verhalten:** Die Antwort aktualisiert `existingBggIds`, während die Vorschau noch dasselbe ausgewählte Spiel zeigt. Die Darstellung behandelt den gerade erfolgreichen Import danach als bereits vorher vorhandenes Spiel.
**Ursache:** Erfolgszustand und Bestandsprüfung wurden aus derselben ID-Menge abgeleitet, ohne den aktuellen erfolgreichen Import zu unterscheiden.
**Lösung:** Bestätigten Import getrennt merken; Erfolg und deaktiviertes „Importiert“ zeigen, die gelbe Warnung für diesen Erfolg unterdrücken. Bei neuer Auswahl zurücksetzen. Echte Bestands-/Konfliktprüfungen beibehalten.

**Prüfnachweis:** Gezielt erwartungsgemäß roter Regressionstest bei zurückgehaltener Navigation, anschließend 3/3 BGG-Einzelimportintegrationstests grün. Gerenderte Safari-Nachprüfung zeigt die Erfolgsbestätigung und deaktiviertes „Importiert“ ohne gelbe Warnung. Vollständiger Lauf für beide Korrekturen: 154 Dateien, 1.062 Tests und Coverage-Gates bestanden; Build/Typprüfung, ESLint, Security und Review-Regressionscheck bestanden.
**Referenz im Changelog:** Version 0.50.66 – BUG-069.

---

### [BUG-070] Reihenendpunkt validiert Importangaben nicht vollständig

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-03
**Behoben:** 2026-11-03
**Behoben in Version:** 0.50.67
**Test geschrieben:** Ja – `tests/unit/api/series-entry-conflict.test.ts`; der ungültige BGG-ID-Aufruf ergab vor dem Fix einen falschen Folgefehler.

**Beschreibung:** Der Reihenendpunkt prüfte direkte BGG-IDs nicht vor Datenbank-/Katalogzugriffen und validierte außerdem den Typ des optionalen Schwierigkeitsgrads nicht.
**Reproduktion:** `POST /api/series/{id}/entries` mit `{ "bggId": "13&evil" }` oder einem Objekt als `difficulty` senden.
**Erwartetes Verhalten:** Ungültige BGG-IDs, Spiel-IDs und Schwierigkeitswerte werden vor Abfragen oder Schreiben mit HTTP 400 abgewiesen.
**Tatsächliches Verhalten:** Ungültige Werte erreichten Datenbank/Katalog beziehungsweise die Prisma-Schreiboperation; die Antwort hing vom nachfolgenden Treffer ab.
**Ursache:** Der Reihenendpunkt prüfte BGG-IDs nicht mit dem gemeinsamen ID-Vertrag und vertraute untypisierten optionalen Feldern.
**Lösung:** JSON-Form, Spiel-ID, BGG-ID und Schwierigkeitswert vor DB-/Netzwerkzugriff validieren. Gültige numerische BGG-IDs bleiben unterstützt.
**Prüfnachweis:** Zwei Regressionstests vor Fix rot, danach API-Tests und Typprüfung grün.
**Referenz im Changelog:** Version 0.50.67 – FEAT-023 / BUG-070.

---

### [BUG-071] BGG-Importtitel läuft bei 200 % Schrift über

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-11-03
**Behoben:** 2026-11-03
**Behoben in Version:** 0.50.67
**Test geschrieben:** Ja – `tests/unit/components/bgg-import-editions.test.tsx` prüft den Umbruchvertrag; zusätzlich lokale Safari-Prüfung bei 390 px und 200 % Schrift.

**Beschreibung:** Der lange Seitentitel und das Suchformular der BGG-Importseite konnten bei stark vergrößerter Schrift die mobile Breite überschreiten.
**Reproduktion:** `/dashboard/bgg` auf 390 px mit 200 % Schrift öffnen.
**Erwartetes Verhalten:** Titel, Suche und Bestandsstatus bleiben innerhalb der verfügbaren Breite bedienbar.
**Tatsächliches Verhalten:** Der Seitentitel „BoardGameGeek“ ließ sich nicht umbrechen; die Suchzeile konnte den Inhalt zusammendrücken.
**Ursache:** Fehlender Titelumbruch und nicht umbrechbare Suchzeile.
**Lösung:** Lange Wörter umbrechen, responsive Titelgröße verwenden und Suchfeld/Aktion umbrechbar sowie schrumpfbar gestalten.
**Prüfnachweis:** Safari lokal mit synthetischem BGG-Bestand bei 390 px und 200 % Schrift: Dokumentbreite 384 px, überlaufende Felder/Schaltflächen keine; Sammlungstreffer verlinkt, Import deaktiviert.
**Referenz im Changelog:** Version 0.50.67 – FEAT-023 / BUG-071.


### [BUG-072] Produktionsmigration nach FEAT-028-Deployment fehlte

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-11-04
**Behoben:** 2026-11-04
**Behoben in Version:** 0.50.79
**Test geschrieben:** Ja – `tests/integration/gamification-migration.test.ts`; zusätzlich Produktionsschema und Prisma-Migrationsstatus nach dem Apply read-only geprüft.

**Beschreibung:** Nach dem FEAT-028-Deployment schlugen Credentials-Anmeldung und `prisma.user.findUnique()` fehl, weil die Produktionsdatenbank die Spalte `User.publicProfileEnabled` noch nicht enthielt.
**Reproduktion:** FEAT-028-App gegen eine Datenbank ohne Migration `20261104130000_gamification_profiles_and_challenges` starten und anmelden.
**Erwartetes Verhalten:** App-Code und Datenbankschema sind vor dem Produktionsstart synchronisiert.
**Tatsächliches Verhalten:** Prisma meldete `The column User.publicProfileEnabled does not exist`; Anmeldung brach vor der Authentifizierung ab.
**Ursache:** Vercels Build-Befehl `npm run build` führt absichtlich keine Datenbankmigrationen aus. Drei ausdrücklich getrennte Migrationen waren noch offen.
**Lösung:** Vorher ein Produktionsbackup erstellen und anschließend die drei ausstehenden Migrationen in Reihenfolge mit `npm run prisma:deploy` anwenden. Prisma meldet nun „Database schema is up to date“; vier Profilspalten, drei neue Tabellen und alle drei Migrationseinträge wurden bestätigt. Read-only gezählt: 25 bestehende Reiheneinträge mit `source=COLLECTION`, keine zu temporären Einträgen umgewandelten Bestandsreihen.
**Prüfnachweis:** Produktionsbackup vom 04.11.2026 ist lesbar; Migrationsstatus und Schemaobjekte nach Apply geprüft. Der Migrationstest läuft außerdem ausschließlich auf `bgt_test_feat028`.
**Referenz im Changelog:** Version 0.50.79 – BUG-072.

### [BUG-073] Auswahlaktion der BGG-Sammlung benennt ihren Zustand falsch

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-11-05
**Behoben:** 2026-11-05
**Behoben in Version:** 0.50.85
**Test geschrieben:** Ja – `tests/unit/components/collection-import-dialog.test.tsx` ließ die falsche Beschriftung vor dem Fix fehlschlagen.

**Beschreibung:** Wenn alle noch nicht vorhandenen Spiele vorausgewählt waren, zeigte die Aktion „Alle auswählen“, obwohl sie beim Klick die Auswahl leerte.
**Reproduktion:** Eine BGG-Sammlung mit mindestens einem bereits importierten und einem neuen Spiel laden; die neuen Spiele sind vorausgewählt.
**Erwartetes Verhalten:** Die Schaltfläche beschreibt, dass alle auswählbaren Spiele ausgewählt sind und abgewählt werden können.
**Tatsächliches Verhalten:** Sie verglich die Auswahl mit der Gesamtzahl einschließlich bereits importierter Spiele und zeigte weiterhin „Alle auswählen“.
**Ursache:** Die Zustandsbeschriftung verglich die Auswahl mit der Länge der gesamten Sammlung statt mit den auswählbaren Einträgen.
**Lösung:** Auswahlbeschriftung anhand der Anzahl nicht importierter Spiele bestimmen.
**Prüfnachweis:** Regressionstest vor Fix rot, danach alle vier Tests des BGG-Sammlungsimportdialogs grün.
**Referenz im Changelog:** Version 0.50.85 – BUG-073.

### [BUG-074] Event-Mailversand verwendet bei einer Erinnerung die Mehrzahl

**Status:** `fixed`
**Schweregrad:** `low`
**Entdeckt:** 2026-11-05
**Behoben:** 2026-11-05
**Behoben in Version:** 0.50.85
**Test geschrieben:** Ja – `tests/unit/api/event-mail.test.ts` schlug vor dem Fix bei „1 Erinnerungen“ fehl.

**Beschreibung:** Die Versandbestätigung verwendete auch bei genau einer Nachricht oder Erinnerung die Mehrzahl.
**Reproduktion:** Eine Event-Erinnerung an genau eine erreichbare Person senden.
**Erwartetes Verhalten:** Die Bestätigung zeigt „1 Erinnerung gesendet“; bei einer Nachricht analog „1 Nachricht gesendet“.
**Tatsächliches Verhalten:** Die Antwort lautete „1 Erinnerungen gesendet“ beziehungsweise „1 Nachrichten gesendet“.
**Ursache:** Die Singular- und Pluralformen wurden nicht anhand der Versandanzahl ausgewählt.
**Lösung:** Versandart und Anzahl bestimmen jetzt die passende deutsche Einzahl oder Mehrzahl.
**Prüfnachweis:** Der Singular-Test war vor der Änderung rot; danach bestehen alle vier Tests der Event-Mailroute.
**Referenz im Changelog:** Version 0.50.85 – BUG-074.

### [BUG-075] Produktionsmigration für Event-Sessions fehlte

**Status:** `fixed`
**Schweregrad:** `high`
**Entdeckt:** 2026-11-05
**Behoben:** 2026-11-05
**Behoben in Version:** 0.50.87
**Test geschrieben:** Ja – `tests/integration/feat029-migration.test.ts` (isolierte PostgreSQL-Migration, 1/1); nach Produktionsmigration zusätzlich direkte Prisma-Leseabfragen und read-only Schemaprüfung.

**Beschreibung:** Produktionslogs vom 05.11.2026 zeigten Prisma-Fehler auf mehreren Dashboardseiten. Abfragen erwarteten `GameSession.gameNameSnapshot`; die Eventdetailseite erwartete `public.EventPlayedSession`. Diese Schemaobjekte fehlten in der verbundenen Datenbank.
**Reproduktion:** Die betroffenen Dashboardseiten (`/dashboard/sessions`, `/dashboard/statistics`, `/dashboard/profile`, `/dashboard/events/new` oder `/dashboard/events/{id}`) mit dem ausgelieferten App-Build gegen die betroffene Produktionsdatenbank aufrufen.
**Erwartetes Verhalten:** Das Produktionsschema enthält die vom ausgelieferten Prisma-Client erwarteten Spalten und Tabellen; die betroffenen Abfragen funktionieren ohne `P2021`-/`P2022`-Fehler.
**Tatsächliches Verhalten:** Prisma meldete `P2022` für Session-Snapshotspalten und `P2021` für `EventPlayedSession`.
**Ursache:** Die Migration `20261104160000_event_played_sessions` war nicht angewendet. Die Serien-Snapshotmigration `20261104080000_series_entry_game_snapshot` war bereits angewendet.
**Lösung:** Ein vollständiges, konsistentes Backup erstellt und geprüft (33 Tabellen, 982 Zeilen, gzip-Prüfung, SHA-256; ältere Sicherungen erhalten). Danach ausschließlich die einzige ausstehende Migration `20261104160000_event_played_sessions` mit `npm run prisma:deploy` angewendet.
**Prüfnachweis:** `prisma migrate status`: „Database schema is up to date“. Read-only bestätigt: Snapshotspalten, `SessionGuestPlayer`, `EventPlayedSession`, Primär-/Fremdschlüssel vorhanden. Prisma-Leseabfragen für Sessions und Eventdetails erfolgreich. Bestandszahlen stimmen mit dem Backup überein: 3 Sessions, 25 Reihen, 238 Spiele, 5 Events; `_prisma_migrations` enthält erwartungsgemäß einen zusätzlichen abgeschlossenen Eintrag. `EventPlayedSession` startet mit 0 Verknüpfungen.
**Referenz im Changelog:** Version 0.50.87 – BUG-075.

### [BUG-076] Kalenderexport verschiebt Startzeit und setzt feste Dreistundendauer

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-05
**Behoben:** 2026-11-08
**Behoben in Version:** 0.50.96
**Test geschrieben:** Ja – Kalender-UTC/Dauer, Datumauswahl mit erhaltener Startzeit (inklusive Sommerzeitwechsel), Eventanlage und Dauerpersistenz. Isolierter Migrationstest in temporärer PostgreSQL-Testdatenbank bestanden.

**Beschreibung:** Der Kalenderdownload kann für ein Event eine falsche Uhrzeit anzeigen (gemeldet: 1–3 Uhr). Bei der Eventanlage ist eine Startzeit vorhanden, aber keine Dauer auswählbar. Die Datumauswahl setzt die Eventstartzeit auf UTC-Mitternacht zurück; der ICS-Export rechnet außerdem stets drei Stunden hinzu und schreibt lokale Serverzeitwerte fälschlich mit UTC-Kennzeichnung.
**Reproduktion:** Event mit konkreter Startzeit anlegen, einen Tag in der Terminabstimmung auswählen und die ICS-Datei herunterladen. Mit einer Eventstartzeit 19:00 Uhr und einer gewünschten Dauer von zwei Stunden muss der Kalender 19:00–21:00 Uhr Ortszeit anzeigen.
**Erwartetes Verhalten:** Die Eventanlage speichert Startzeit und wählbare Dauer. Die Auswahl eines Abstimmungstags erhält die Startuhrzeit. Der ICS-Export enthält den korrekten Zeitpunkt unabhängig von der Serverzeitzone und endet nach der gespeicherten Dauer.
**Tatsächliches Verhalten:** Der Export endet pauschal drei Stunden nach dem Start. Durch lokale Datumsgetter mit angehängtem `Z` sowie eine beim Datumsauswählen auf Mitternacht gesetzte Eventzeit wird die angezeigte Kalenderzeit verschoben.
**Ursache:** Die Dauer war nicht im Eventmodell gespeichert; `DTEND` verwendete einen festen Dreistundenwert; die ICS-Formatierung verwendete lokale statt UTC-Getter; das Finalisieren der Terminabstimmung ersetzte `eventDate` vollständig durch ein Datum ohne Uhrzeit.
**Lösung:** Code und additive Migration erstellt: Dauer in Minuten (30–1440, Standard 180), Eventformular mit Startzeit/Dauer, Datumauswahl übernimmt die Ortszeit `Europe/Berlin`, ICS nutzt UTC-Getter und berechnet `DTEND` aus der Dauer. Die additive Produktionsmigration `20261105214500_event_duration` wurde nach geprüftem Backup angewendet.
**Prüfnachweis:** Die gezielten Unit-Tests bestehen mit 40/40. Der Integrationstest bestätigte nach Anwendung der Migration in einer temporären isolierten PostgreSQL-Testdatenbank `NOT NULL` und Standardwert `180`. Vor dem Fix schlugen die Regressionstests für UTC-Formatierung, Dauer und Zeiterhalt erwartungsgemäß fehl. Produktionsschema und Migrationshistorie wurden nach dem Release lesend geprüft.
**Referenz im Changelog:** Version 0.50.96 – BUG-076.

---

**Produktionsnachweis 08.11.2026:** Vollständiger konsistenter Snapshot mit 35 Tabellen und 1.005 Zeilen erstellt, SHA-256 dokumentiert und erfolgreich in eine frische isolierte `bgt_test_*`-Datenbank zurückgespielt; alle Tabellenzeilenzahlen stimmen überein. Danach ausschließlich `20261105214500_event_duration` mit `npm run prisma:deploy` angewendet. Lesend bestätigt: Migration abgeschlossen, `Event.durationMinutes` ist `NOT NULL` mit Default `180`, kein Event hat einen unerwarteten Wert und keine Migration ist ausstehend. BUG-076 ist behoben.

### [BUG-077] Gemeinsame Toast-Rückmeldungen sind nicht sichtbar

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-08
**Behoben:** 2026-11-08
**Behoben in Version:** 0.50.95
**Test geschrieben:** Ja – `tests/unit/components/root-toast.test.tsx` löst eine Meldung über den echten gemeinsamen Store aus und prüft sichtbaren Titel und Beschreibung; vor dem Fix erwartungsgemäß rot, danach grün. Zusätzlich E2E-Vertrag `tests/e2e/feedback_test.ts` mit lokaler Datenbank-Schutzprüfung ergänzt; automatischer Browserlauf noch nicht ausgeführt. Reale manuelle Ende-zu-Ende-Prüfung im lokalen Build: vorhandener synthetischer Gastname abgelehnt und erklärende rote Toastmeldung in separater privater Safari-Session sichtbar.

**Beschreibung:** Komponenten melden Erfolge und Fehler über `useToast`, im Rootlayout war aber kein Anzeigebereich für diesen Store eingebunden.
**Reproduktion:** Öffentlichen Gastbeitritt mit einer abgelehnten Anfrage auslösen oder über `useToast` eine Fehlermeldung erzeugen.
**Erwartetes Verhalten:** Titel und Beschreibung der Rückmeldung sind sichtbar.
**Tatsächliches Verhalten:** Der Store enthält die Meldung, aber im DOM erscheint sie nicht.
**Ursache:** Der vorhandene `Toaster` war nicht in das gemeinsame Rootlayout eingebunden.
**Lösung:** Vorhandene Toastanzeige genau einmal in `src/app/layout.tsx` eingebunden. Keine Änderung an API-Fehlern oder Berechtigungen.
**Referenz im Changelog:** Version 0.50.95 – BUG-077.

---

### [BUG-078] Health-Providertests laden lokale Betriebscredentials

**Status:** `fixed`
**Schweregrad:** `medium`
**Entdeckt:** 2026-11-08
**Behoben:** 2026-11-08
**Behoben in Version:** 0.50.95
**Test geschrieben:** Ja – bestehender Vertrag `tests/unit/scripts/health-provider.test.ts` schlug nach Bereitstellung des lokalen Readiness-Secrets erwartungsgemäß fehl; Testaufbau danach in temporäre isolierte Kopie der echten Provider verlegt, Vertrag erneut grün geprüft.

**Beschreibung:** Der Providertest ruft das Skript aus dem Arbeitsbaum auf. Dieses lädt die ignorierte `.env.pipeline-check`, deren Betriebswerte den vorgesehenen künstlichen Testtoken überschreiben.
**Reproduktion:** Lokales Readiness-Secret in `.env.pipeline-check` hinterlegen und den Provider-Test starten.
**Erwartetes Verhalten:** Ausschließlich der künstliche Testtoken erreicht den simulierten curl-Aufruf.
**Tatsächliches Verhalten:** Ein Betriebswert erreicht den simulierten Aufruf und kann bei einer fehlgeschlagenen Assertion in lokaler Testausgabe erscheinen. Es erfolgt kein echter HTTP-Aufruf, weil curl im Test simuliert ist.
**Ursache:** Testfixture verwendet den echten Projektpfad mit lokaler Betriebskonfiguration.
**Lösung:** Echter Prüfcode und Provider werden vor dem Test in ein temporäres Verzeichnis ohne `.env.pipeline-check` kopiert. Der Prozess verwendet ausschließlich die explizite Testumgebung und einen simulierten curl. Nach dem Fund wurde das betroffene Readiness-Secret in GitHub und Vercel sofort rotiert; betroffene lokale Testberichte wurden bereinigt. Keine Secretwerte committed, kein aktiver Produktionstoken aus diesem Testlauf beibehalten.
**Referenz im Changelog:** Version 0.50.95 – BUG-078.

---

## Statistik

- **Offene Bugs:** 0
- **In Bearbeitung:** 1
- **Behoben:** 77
- **Wontfix:** 0
- **Gesamt:** 78
