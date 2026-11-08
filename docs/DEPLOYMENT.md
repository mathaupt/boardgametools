# Deployment-Guide: Vercel Web-App + iOS App

Diese Anleitung beschreibt den kompletten Release-Prozess für die BoardGameTools Next.js-Anwendung auf Vercel sowie den begleitenden Xcode-Build für iOS.

---

## 1. Vorbereitung vor jedem Deployment

- [ ] `npm run typecheck` ausführen (TypeScript `tsc --noEmit`)
- [ ] `npm run lint` ausführen
- [ ] `npm run test` ausführen (Vitest Unit Tests)
- [ ] `npm run build` lokal erfolgreich bauen
- [ ] `npm start` starten und `HEADLESS=true npm run test:e2e` ausführen
- [ ] `npm run security-check` und `npm run review-evaluate:regression` ausführen
- [ ] `package.json` Version aktualisieren, wenn ein neues Release veröffentlicht wird
- [ ] `CHANGELOG.md` / `src/lib/changelog.ts` gepflegt

---

## 2. Vercel Web-Deployment

### 2.1 Projekt & Repository

1. In Vercel ein neues Projekt anlegen oder bestehendes öffnen.
2. GitHub-Repository (`boardgametools`) verbinden.
3. Production-Branch auf `main` (oder aktuellen Release-Branch) setzen.

### 2.2 Build-Einstellungen

| Einstellung | Wert |
|-------------|------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Root Directory | `.` |

> `npm run build` ist seit 0.50.16 ein reiner Build ohne Datenbankänderung. Migrationen sind ein gesonderter, ausdrücklich freizugebender Release-Schritt.

### 2.3 Erforderliche Environment Variables

In Vercel unter **Project Settings → Environment Variables** eintragen (Bereich `Production`; Preview/Development bei Bedarf separat):

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `SQL_DATABASE_URL` | PostgreSQL-Verbindungsstring | `postgresql://user:pass@host:5432/boardgametools` |
| `NEXTAUTH_URL` bzw. `AUTH_URL` | Finale Live-URL | `https://boardgametools.vercel.app` |
| `NEXTAUTH_SECRET` bzw. `AUTH_SECRET` | Mindestens 32 Zeichen zufällig | – |
| `AUTH_TRUST_HOST` | Für Vercel nicht zwingend, für lokale Prod-Builds `true` | `true` |
| `NEXT_PUBLIC_APP_URL` | Öffentliche App-URL für Links/E-Mails | `https://boardgametools.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token für Uploads (Production erforderlich) | – |
| `UPSTASH_REDIS_REST_URL` | Redis für Rate-Limiting/Caching (optional) | – |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST-Token (optional) | – |
| `SMTP_HOST` | SMTP-Server für Passwort-Reset | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP-Port | `587` |
| `SMTP_SECURE` | `true` für Port 465, sonst `false` | `false` |
| `SMTP_USER` | SMTP-Benutzername | – |
| `SMTP_PASS` | SMTP-Passwort | – |
| `PASSWORD_RESET_SENDER` | Absender für Passwort-Reset | `BoardGameTools <no-reply@example.com>` |
| `BGG_API_URL` | BoardGameGeek XML-API | `https://boardgamegeek.com/xmlapi2` |
| `BGG_AUTH_TOKEN` | Optional: BGG Auth-Token | – |
| `APPLE_CLIENT_ID` | Für Apple Sign In (optional) | `com.boardgametools.ios` |
| `APNS_ENABLED` | Apple Push aktivieren | `false` |
| `APNS_PRODUCTION` | APNs Sandbox/Production | `false` |
| `APNS_TEAM_ID` | Apple Team ID | – |
| `APNS_KEY_ID` | APNs Key ID | – |
| `APNS_SIGNING_KEY` | Base64-codierte `.p8` oder PEM | – |
| `APNS_TOPIC` | Bundle ID für Push | `com.boardgametools.ios` |

### 2.4 Datenbank-Migrationen

- Bei Vercel Postgres: `SQL_DATABASE_URL` entspricht dem Vercel-Postgres-String.
- Bei externem Postgres: Stelle sicher, dass die Datenbank erreichbar ist und SSL aktiviert ist (Vercel erfordert SSL).
- Vor einem Release den Zustand und die Wiederherstellbarkeit des Backups prüfen und Migrationen zuerst an einer separaten Testdatenbank erproben.
- Die Migration `20261103193000_guest_participant_credentials` ergänzt den Hash des Gast-Besitznachweises. Bestehende Datensätze und Stimmen bleiben erhalten; alte Browserzugänge ohne Nachweis müssen nach dem Release einen neuen Spitznamen registrieren. Diese Migration wurde am 04.11.2026 nach geprüftem Produktionsbackup zusammen mit den inzwischen freigegebenen FEAT-025- und FEAT-028-Migrationen auf Produktion angewendet. Anschließend wurden 25 bestehende Reiheneinträge als `COLLECTION` bestätigt; kein Bestandsspiel wurde in einen temporären Eintrag umgewandelt.
- Die FEAT-029-Migration `20261104160000_event_played_sessions` wurde am 05.11.2026 nach einem konsistenten `REPEATABLE READ READ ONLY`-Backup (33 Tabellen, 982 Zeilen) mit `npm run prisma:deploy` auf Produktion angewendet. Migrationsstatus, Schemaobjekte und direkte Prisma-Leseabfragen wurden geprüft; vorhandene Sessions, Spiele, Reihen und Events blieben unverändert.
- Freigegebene Migrationen gezielt mit `npm run prisma:deploy` ausführen. Der Befehl bricht beim ersten Fehler ab; es gibt kein automatisches Baseline und kein `prisma db push`.
- Erst nach erfolgreicher Migration den vorbereiteten Build veröffentlichen. Vercel verwendet weiterhin `npm run build`; neue Migrationen werden dadurch nicht stillschweigend ausgeführt.
- Für ausdrücklich freigegebene Release-Umgebungen kombiniert `npm run release:build` Migration und anschließenden Build. Das ist kein Prüf- oder Preview-Befehl.
- Bei einem Migrationsfehler Ursache und Schema prüfen. `migrate resolve` nur nach manuell geprüftem Baseline-/Reparaturplan; niemals pauschal alle Migrationen als angewendet markieren. `migrate reset` ist ausschließlich für wegwerfbare lokale Entwicklungsdatenbanken vorgesehen.

### 2.5 Vorschau-Deployment (Preview)

1. Push auf einen Feature-Branch.
2. Vercel erstellt automatisch eine Preview-URL.
3. Preview-URL in `NEXT_PUBLIC_APP_URL` und `NEXTAUTH_URL` wird dynamisch von Vercel gesetzt (kein hartes Setzen nötig).
4. Nach erfolgreichem Test in `main` mergen für Production-Deployment.

### 2.6 Production-Deployment

1. Merge in `main` oder manuelles **Redeploy** in Vercel.
2. Vor dem Release die ausdrücklich freigegebenen Migrationen mit `npm run prisma:deploy` anwenden und deren Erfolg prüfen; `npm run build` selbst führt keine Migration aus. Am 04.11.2026 wurden `20261103193000_guest_participant_credentials`, `20261104080000_series_entry_game_snapshot` und `20261104130000_gamification_profiles_and_challenges` angewendet; `20261104160000_event_played_sessions` folgte nach geprüftem Backup am 05.11.2026.
3. `/api/health` ist eine öffentliche, datenbankfreie Liveness-Prüfung und muss JSON mit `check: "liveness"` und `status: "healthy"` liefern.
4. `/api/health/ready` ist eine separat geschützte Datenbank-Readiness. Für den Betriebsmonitor `HEALTH_READINESS_TOKEN` als serverseitiges Secret setzen (mindestens 32 zufällige Zeichen) und als Bearer-Token konfigurieren. Ohne Secret antwortet die Route mit 503.
5. `/api/docs` (Swagger UI) prüfen.
6. Login/Logout, BGG-Suche, Event-Voting und Upload manuell smoke-testen.

---

## 3. iOS App Deployment

### 3.1 Voraussetzungen

- macOS mit installiertem Xcode (empfohlen aktuelle stabile Version)
- Aktives Apple Developer Program (für App-Store-Upload) oder Personal Team (nur lokale Tests/Device)
- CocoaPods / Swift Package Manager Abhängigkeiten bereits gelöst (`⌘+B` einmalig)

### 3.2 Projekt öffnen

```bash
open BoardGameTools/BoardGameTools.xcodeproj
```

### 3.3 API-URL anpassen

In `BoardGameTools/BoardGameTools/Info.plist`:

```xml
<key>API_BASE_URL</key>
<string>https://boardgametools.vercel.app</string>
```

Für lokale Entwicklung gegen `http://localhost:3000` kann die URL in den iOS-Einstellungen geändert werden, solange `NSExceptionDomains` für `localhost` in der `Info.plist` aktiviert bleibt.

### 3.4 Version & Build-Nummer

In `Info.plist` anpassen:

| Schlüssel | Bedeutung | Beispiel |
|-----------|-----------|----------|
| `CFBundleShortVersionString` | Marketing-Version | `1.0.0` |
| `CFBundleVersion` | Build-Nummer | `1` |

Empfohlen: Build-Nummer bei jedem Upload erhöhen.

### 3.5 Signing & Capabilities

1. In Xcode das BoardGameTools-Target auswählen.
2. **Signing & Capabilities** öffnen.
3. **Team** auswählen:
   - **Personal Team**: Nur lokale Tests auf eigenem Gerät (kein Push/Apple Sign In).
   - **Paid Developer Team**: Für TestFlight / App Store.
4. **Bundle Identifier** prüfen (z. B. `com.boardgametools.ios`).
5. **Automatically manage signing** aktivieren.
6. `ITSAppUsesNonExemptEncryption` ist in `Info.plist` bereits auf `<false/>` gesetzt.

> Capabilities wie `Sign in with Apple` oder `User Notifications Filter` sind aus den Entitlements entfernt, damit ein Build mit Personal Team möglich ist. Für Apple Sign In/Push muss das Paid Team die entsprechenden Capabilities wieder hinzufügen.

### 3.6 Build validieren

```bash
cd BoardGameTools
xcodebuild -project BoardGameTools.xcodeproj -scheme BoardGameTools -destination 'generic/platform=iOS' build
```

### 3.7 Archivieren & App Store Connect

1. Xcode: **Product → Archive**.
2. Organizer öffnet sich automatisch.
3. Archiv auswählen → **Distribute App**.
4. **App Store Connect** → **Upload** wählen.
5. Signierungszertifikat und Provisioning Profile prüfen.
6. Upload starten.

### 3.8 TestFlight / App Store

1. In [App Store Connect](https://appstoreconnect.apple.com) das BoardGameTools-App-Record öffnen.
2. Build unter **TestFlight** finden, Compliance-Informationen ausfüllen.
3. Interne/Externe Testgruppen einladen.
4. Für App-Store-Release: Build zur Review einreichen.

---

## 4. Post-Deployment Checkliste

- [ ] Web-App lädt ohne 500er-Fehler.
- [ ] `/api/health` und `/api/docs` erreichbar.
- [ ] Registrierung, Login, Logout funktionieren.
- [ ] Passwort-Reset-E-Mail kommt an.
- [ ] BGG-Import und Bild-Upload funktionieren (nur mit `BLOB_READ_WRITE_TOKEN` in Prod).
- [ ] iOS App kann sich gegen die Production-URL einloggen.
- [ ] iOS App synchronisiert Spiele, Sessions, Events und Gruppen.
- [ ] Push-Benachrichtigungen funktionieren (wenn APNS konfiguriert).
- [ ] Review-Evaluator (`npm run review-evaluate:regression`) ist weiterhin grün.

---

## 5. Bekannte Einschränkungen

- **Uploads ohne `BLOB_READ_WRITE_TOKEN`**: In Produktion werden Uploads abgelehnt (`LocalStorageProvider` wirft Fehler). Für Vercel Blob muss ein Token hinterlegt werden.
- **Redis-Rate-Limiting ohne Upstash**: Ohne `UPSTASH_REDIS_REST_URL`/-`TOKEN` fällt die App auf In-Memory-Rate-Limiting zurück, das bei mehreren Serverinstanzen nicht skaliert.
- **E2E-Tests**: Für `npm run test:e2e` muss `npm start` (Production-Build) laufen. Der Test-Account wird automatisch von `tests/e2e/bootstrap.ts` erstellt (Zugangsdaten nur im Test-Code hinterlegt).


### CI-Codegenerierung ohne Datenbankzugang (0.50.17)

Alle GitHub-CI-Jobs erhalten für `npm ci` eine künstliche `SQL_DATABASE_URL` auf `127.0.0.1:1`. Der automatische `postinstall`-Schritt führt `prisma generate` aus; dafür ist eine syntaktisch gültige URL erforderlich, aber keine laufende Datenbank. Dieser Wert ist ausschließlich Testkonfiguration und wird nicht in Vercel-Umgebungsvariablen übernommen. Migrationen dürfen damit nicht ausgeführt werden.

### Lokale PostgreSQL-Integrationstests

Integrationstests und Migrationen laufen ausschließlich gegen eine eigene lokale
Datenbank mit dem Präfix `bgt_test_`. Beispiel für eine lokale PostgreSQL-Instanz:

```bash
createdb -h 127.0.0.1 -p 5432 bgt_test_local
```

In der ignorierten Datei `.env.test.local` die Umgebungsvariable
`BGT_TEST_DATABASE_URL` auf diese Datenbank setzen, beispielsweise
`postgresql://<lokaler-benutzer>@127.0.0.1:5432/bgt_test_local`. Der
Integrationstest-Setup prüft Host und Datenbankpräfix, bevor eine Verbindung
geöffnet wird. Tests starten mit:

```bash
npx vitest run --config vitest.integration.config.ts
```

Niemals Produktions-Zugangsdaten in `.env.test.local` eintragen oder Tests auf
Produktionsdatenbanken richten.

## Optionale Pipeline-Prüfungen

### Kontrollierte Bereinigung von Spieltexten (FEAT-009)

Das Wartungsskript `scripts/fix-html-entities.ts` greift ausschließlich auf `BGT_MAINTENANCE_DATABASE_URL` zu. Es lädt weder `.env` noch `.env.prod` und verwendet keinen `SQL_DATABASE_URL`-Fallback. Der Standardmodus ist Dry-Run und benötigt einen Manifestpfad unter `.maintenance/`:

```bash
BGT_MAINTENANCE_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx tsx scripts/fix-html-entities.ts --dry-run --report .maintenance/feat009.json
BGT_MAINTENANCE_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx tsx scripts/fix-html-entities.ts --apply --manifest .maintenance/feat009.json
BGT_MAINTENANCE_DATABASE_URL="$BGT_TEST_DATABASE_URL" npx tsx scripts/fix-html-entities.ts --rollback --manifest .maintenance/feat009.json
```

Zuerst ausschließlich auf einer isolierten Wegwerfdatenbank testen. Das Manifest enthält Ausgangs- und Zielwerte, ist vertraulich und wird mit Dateirechten `0600` gespeichert. Apply vergleicht die Ausgangswerte vor jedem Update; Konflikte werden gemeldet. Ein Produktionslauf erfordert einen separaten freigegebenen Dry-Run und ein frisches Backup. Nach einem externen CLI-Lauf erneuern sich gecachte Sammlungs-, Dashboard-, Session- und Eventdaten spätestens nach 60 Sekunden; das Skript kann Next.js Cache-Tags außerhalb eines Request-Kontexts nicht direkt invalidieren.

`npm run pipeline:check -- --list` zeigt die verfügbaren Provider und ihren Konfigurationsstatus. `npm run pipeline:check` führt konfigurierte Prüfungen aus; `--github`, `--vercel`, `--health` (Liveness) oder `--health-readiness` wählen einzelne Provider. `--json` gibt eine maschinenlesbare Zusammenfassung aus. Provider sind in `scripts/pipeline-checks/` gekapselt.

- GitHub Actions: `GITHUB_TOKEN` mit Leserechten für Actions; optional `GITHUB_REPO` und `CI_BRANCH`. Standardbranch ist `main`, das Repository wird aus `origin` abgeleitet.
- Vercel: `VERCEL_TOKEN` und `VERCEL_PROJECT_ID` oder eine lokale `.vercel/project.json`; optional `VERCEL_TEAM_ID`.
- Health: `PROD_URL`, standardmäßig `https://boardgametools.vercel.app`; optional `HEALTH_PATH`, standardmäßig `/api/health`.
- Readiness: zusätzlich `HEALTH_READINESS_TOKEN` (mindestens 32 zufällige Zeichen), serverseitig als Secret im Deployment und im Monitor hinterlegen. Nicht als URL-Parameter verwenden. Die Monitorumstellung und Veröffentlichung des geänderten Liveness-Vertrags müssen vor einem Produktionsrollout geprüft werden.

Für den Vercel-WAF-Regelvorschlag siehe [Health-Firewall-Runbook](operations/health-firewall.md). Spend-Management-Grenzen, offene Betreiberentscheidungen und die monatliche Kontrolle stehen in [Spend-Management-Runbook](operations/spend-management.md) und [Kostenprüfung](operations/cost-review.md). Die Runbooks dokumentieren den Soll- und Prüfstand; sie beweisen keine aktive Vercel-Konfiguration.

Zugangsdaten dürfen ausschließlich aus Umgebungsvariablen oder der lokal ignorierten `.env.pipeline-check` stammen. Keine Tokens versionieren. Unkonfigurierte Provider werden bei einem allgemeinen Lauf übersprungen; ausdrücklich ausgewählte unkonfigurierte Provider führen zu einem Fehler. Exitcodes: 0 erfolgreich, 1 fehlgeschlagene konfigurierte/ausgewählte Prüfung, 2 keine ausgeführte Prüfung oder ungültiger Aufruf. Laufende GitHub-Jobs werden als noch nicht abgeschlossen gemeldet; eine solche Meldung bestätigt keinen abgeschlossenen CI-Erfolg.

Die Impeccable-Quellen und gemeinsamen Hook-Manifeste sind versioniert. Plattformspezifische Engine-Binaries werden lokal bezogen und anhand der mitgelieferten Prüfsummen geprüft; sie sind ebenso wie persönliche Claude-Hook-Einstellungen nicht Teil des Repositories. Produktiv-Build und Datenbankmigration bleiben getrennte Schritte.

## BGG-Quellenkennzeichnung (FEAT-022)

Der Root-Footer liefert das offizielle BGG-Logo aus `public/images/bgg/`
lokal aus und verlinkt direkt auf BoardGameGeek. Herkunft, Prüftag und SHA-256
stehen in `public/images/bgg/README.md`. Es sind keine neuen Umgebungsvariablen,
CSP-Freigaben oder Deploy-Schritte nötig. BGG-App-Registrierung, Bearer-Token
und gegebenenfalls erforderliche individuelle Lizenz bleiben Betreiberaufgaben;
die Kennzeichnung ersetzt diese nicht. Bei geänderten BGG-Vorgaben die
[offiziellen Bedingungen](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use)
und die dort verlinkten Originalassets erneut prüfen. Nicht umfärben oder verzerren.

## Qualitätsmesswerte veröffentlichen (BUG-067)

Vor einem Release `npm run test:coverage` ausführen. Der Befehl schreibt den
Vitest-JSON-Bericht unter `coverage/test-results.json` und aktualisiert erst nach
erfolgreichem vollständigem Lauf einschließlich Coverage-Gates die versionierte
`src/data/quality-metrics.json`. Die Messdatei zusammen mit dem geprüften Code
committen; Rohberichte und lokale Review-History bleiben lokal. Der Generator
prüft Testdateivollständigkeit, erfolgreiche Ergebnisse und gültige Messwerte;
bei Fehlern bleibt der vorherige veröffentlichte Stand erhalten.

Das Admin-Monitoring liest das gebündelte Artefakt ohne zusätzliche Umgebungsvariable
oder Datenbankzugriff und zeigt Messdatum und Messversion. Ein Deployment ohne
neuen Messlauf behält sichtbar den letzten gemessenen Stand. Es führt nicht selbst
Tests oder Messungen aus. Neu erzeugte lokale Messwerte werden erst mit einem
neuen Deployment auf der Website sichtbar. Andere Review-Kennzahlen bleiben als
historisch beschriftet. Es sind keine Migrationen nötig.


## GitHub-Healthmonitoring (FEAT-030)

Workflow: `.github/workflows/health-monitoring.yml`, manuell über **Actions → Health Monitoring → Run workflow** oder geplant um Minute 7, 22, 37 und 52 jeder Stunde (UTC). Zwei unabhängige Jobs mit je zwei Minuten Timeout prüfen Liveness und Readiness. Kein App-Build, kein Datenbankcredential auf dem Runner und keine automatischen Retries.

- Ziel: optionale Repositoryvariable `HEALTH_MONITOR_URL`; Standard `https://boardgametools.vercel.app`. Kein Secret und keine Benutzerinformationen in diese URL aufnehmen.
- GitHub Repositorysecret `HEALTH_READINESS_TOKEN` und gleichnamige sensible Vercel-Produktionsvariable müssen denselben zufälligen Wert mit mindestens 32 Zeichen enthalten. Der Token wird ausschließlich als Umgebungsvariable übergeben und im HTTP-Header über curl-stdin gesendet.
- Bereitstellung am 08.11.2026: Secret verschlüsselt über GitHub Public-Key/SealedBox hinterlegt; identischer Wert in Vercel als `sensitive` für `production`. Kein Wert wurde ausgegeben oder committed. Lokale Betriebskopie ausschließlich in der ignorierten `.env.pipeline-check` (Dateimodus 0600).
- Nach Bereitstellung deckte ein fehlgeschlagener lokaler Providertest eine unzureichende Fixture-Isolation auf (BUG-078). Der Test nahm den Betriebswert statt seines künstlichen Tokens auf und gab ihn in einer lokalen Assertion aus. Secret sofort in beiden Systemen rotiert und lokale Fehlerausgaben bereinigt; der Test verwendet jetzt eine temporäre Skriptkopie ohne Betriebsdatei. Keine Secretwerte committed.
- Neue Vercel-Umgebungsvariablen gelten erst für ein anschließendes Deployment. Vor Aktivierung Schemafreigabe für BUG-076 abschließen; Produktionsbackup und Migration sind separate Freigabeschritte. Der lokale Workflow ist noch nicht veröffentlicht/aktiv.
- Alarmierung: Verantwortlicher Betreiber aktiviert in seinen persönlichen GitHub-Einstellungen Actions-Web-/E-Mail-Benachrichtigungen, vorzugsweise nur fehlgeschlagene Workflows. Bei Zeitplänen bestimmt GitHub den Benachrichtigungsempfänger anhand des letzten Bearbeiters der Cron-Konfiguration. Reale Zustellung nach Veröffentlichung kontrolliert nachweisen; ein YAML-Test allein genügt nicht.
- Zustände: Liveness `200` mit `check=liveness,status=healthy`; Readiness `200` mit `healthy` oder `degraded`, sonst Jobfehler. Fehlendes Secret, `401`, `429`, `503`, HTML und Verbindungsfehler sind Fehler, keine übersprungenen Erfolgsprüfungen.
- Lokaler Staging-Nachweis vom 08.11.2026: beide Prüfungen erfolgreich; nach Stoppen ausschließlich der temporären Testdatenbank Liveness `200`, Readiness `503` und Providerexit `1`; nach Neustart beide `200` und Providerexit `0`. Keine Ausfall-/Lastsimulation auf Produktion.
- Wiederherstellung: DB-/Deploymentproblem beheben, Workflow manuell erneut ausführen und Erholung prüfen. Secretrotation zuerst konsistent zwischen beiden Systemen vorbereiten, deployen und beide Jobs erneut prüfen. Alte Werte nicht in Tickets oder Logs übertragen.
- GitHub-Zeitpläne können verzögert oder unter Last verworfen werden; 15 Minuten sind keine garantierte Alarmfrist. Bei öffentlichen Repositories kann Inaktivität zur Deaktivierung geplanter Workflows führen. Betreiber kontrolliert deshalb auch den letzten tatsächlichen Lauf.

Quellen: [GitHub schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Actions-Benachrichtigungen](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs), [GitHub-Secrets](https://docs.github.com/en/rest/actions/secrets).

### Produktionsstand Eventdauer (BUG-076)

Lesende Prüfung am 08.11.2026 bestätigt genau eine ausstehende Migration: `20261105214500_event_duration`. Die Spalte `Event.durationMinutes` fehlt noch. Alle 19 Repositorymigrationen einschließlich Event-Sessions und Eventdauer wurden auf einer frischen lokalen `bgt_test_*`-Datenbank angewendet; beide isolierten Schema-Vertragstests bestehen. Das vollständige Produktionsbackup wurde durch die automatische Freigabeprüfung vor Ausführung abgelehnt (sensible Produktionsdaten, ausdrückliche Autorisierung erforderlich). Kein Backup und keine Produktionsmigration in diesem Arbeitsschritt ausgeführt. Vor Release Backup mit Wiederherstellungsnachweis ausdrücklich freigeben, danach nur den geprüften Migrationssatz anwenden und Schema/Bestand lesend verifizieren.
