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

> `npm run build` führt automatisch `npm run prisma:deploy` aus, um Migrationen anzuwenden.

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
- Migrationen werden durch `npm run build` → `npm run prisma:deploy` automatisch ausgeführt.
- Manuelles Zurücksetzen bei Bedarf: `npx prisma migrate deploy` bzw. `npx prisma migrate reset` (nur lokal/dev).

### 2.5 Vorschau-Deployment (Preview)

1. Push auf einen Feature-Branch.
2. Vercel erstellt automatisch eine Preview-URL.
3. Preview-URL in `NEXT_PUBLIC_APP_URL` und `NEXTAUTH_URL` wird dynamisch von Vercel gesetzt (kein hartes Setzen nötig).
4. Nach erfolgreichem Test in `main` mergen für Production-Deployment.

### 2.6 Production-Deployment

1. Merge in `main` oder manuelles **Redeploy** in Vercel.
2. Build-Log prüfen: `prisma:deploy` muss erfolgreich sein.
3. Nach Deploy `/api/health` aufrufen: `https://<domain>/api/health` → `{"status":"ok"}`.
4. `/api/docs` (Swagger UI) prüfen.
5. Login/Logout, BGG-Suche, Event-Voting und Upload manuell smoke-testen.

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
