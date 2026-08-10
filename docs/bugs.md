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

## Statistik

- **Offene Bugs:** 0
- **In Bearbeitung:** 0
- **Behoben:** 24
- **Wontfix:** 0
- **Gesamt:** 24