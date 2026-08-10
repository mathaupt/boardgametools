# BoardGameTools — Produktiv-Deployment (Vercel)

Diese Anleitung richtet das Repo so ein, dass du unter einer eigenen Live-URL deployen und die iOS-App dagegen verbinden kannst.

---

## 1. Voraussetzungen

- GitHub-Repository mit aktuellem Code
- [Vercel](https://vercel.com)-Account (kostenlos möglich)
- PostgreSQL-Datenbank, z. B.:
  - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
  - [Supabase](https://supabase.com)
  - [Neon](https://neon.tech)
  - Eigener PostgreSQL-Server

## 2. Repository-Status prüfen

Lokal sollte vor dem ersten Deploy bereits alles grün sein:

```bash
npm install
npm run typecheck
npm run lint
npm run test
```

## 3. Environment Variables

Kopiere `.env.production.example` nach `.env.production` (lokale Referenz) und trage die Werte im Vercel-Dashboard ein:

**Vercel Dashboard → Project Settings → Environment Variables**

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `SQL_DATABASE_URL` | PostgreSQL-Verbindungsstring (oder `DATABASE_URL`) | `postgresql://user:pass@host:5432/boardgametools` |
| `NEXTAUTH_URL` | Deine finale Live-URL | `https://boardgametools.vercel.app` |
| `NEXTAUTH_SECRET` | Mindestens 32 Zeichen, zufällig | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Öffentliche URL für Links/E-Mails | `https://boardgametools.vercel.app` |
| `BGG_AUTH_TOKEN` | Optional: BGG API Token | – |
| `BLOB_READ_WRITE_TOKEN` | Optional: Vercel Blob für Bild-Uploads | – |
| `UPSTASH_REDIS_REST_URL` | Optional: Redis für Rate-Limiting/Caching | – |
| `UPSTASH_REDIS_REST_TOKEN` | Optional: Redis Token | – |
| `SMTP_*` | Optional: für Passwort-Reset-E-Mails | – |
| `APPLE_CLIENT_ID` | Optional: Sign in with Apple | – |
| `APNS_*` | Optional: Apple Push Notifications | – |

> **Hinweis:** Der Code akzeptiert sowohl `SQL_DATABASE_URL` als auch `DATABASE_URL`. Vercel Postgres liefert standardmäßig `DATABASE_URL` — das reicht.

## 4. Erstes Deployment

### 4.1 Vercel CLI

```bash
# Vercel CLI installieren (falls nicht vorhanden)
npm i -g vercel

# Anmelden und Projekt verknüpfen
vercel

# Produktiv deployen
vercel --prod
```

### 4.2 Oder per Git-Integration

1. In Vercel: „Add New Project“ → GitHub-Repo auswählen
2. Framework Preset: **Next.js**
3. Environment Variables aus Schritt 3 eintragen
4. Auf „Deploy“ klicken

## 5. Datenbank-Migration

Während des Builds wird automatisch `npm run prisma:deploy` ausgeführt. Das versucht:

1. `prisma migrate deploy`
2. Falls nötig Baseline einer bestehenden Datenbank
3. Falls nötig Fallback auf `prisma db push`

Du kannst den Migrationsstatus auch lokal prüfen:

```bash
# .env mit Produktions-DB setzen
export SQL_DATABASE_URL="postgresql://..."
npx prisma migrate status
```

## 6. Post-Deploy Checks

Nach dem Deploy sollten folgende Endpunkte erreichbar sein:

```bash
# Health Check
curl https://<deine-url>/api/health

# Auth-Test (ohne Session bekommst du 401/Unauthorized)
curl https://<deine-url>/api/auth/session
```

### Admin-Benutzer anlegen

Öffne `https://<deine-url>/register` und registriere den ersten Benutzer. Dann direkt in der Datenbank die Rolle auf `ADMIN` setzen:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'deine-email@example.com';
```

## 7. iOS-App mit der Live-URL verbinden

### 7.1 Backend-URL anpassen

1. iOS-App in Xcode bauen oder auf dem Gerät installieren
2. App starten → **Einstellungen**
3. Feld **API-URL** auf deine Live-URL setzen:
   ```
   https://boardgametools.vercel.app
   ```
4. Speichern und neu anmelden

### 7.2 Hinweise für iOS

- Die App nutzt HTTPS. **ATS** im `Info.plist` erlaubt keine unsicheren `http://`-Verbindungen außer `localhost`.
- Für Push-Benachrichtigungen und Universal Links musst du später die `BoardGameTools.entitlements` sowie APNs-Zertifikate einrichten.
- Für TestFlight/App Store-Release ist ein **Apple Developer Program** (99 $/Jahr) nötig.

## 8. Optional: Eigene Domain

In Vercel:

1. **Domains** → Domain hinzufügen
2. DNS-Einträge bei deinem Registrar setzen
3. `NEXTAUTH_URL` und `NEXT_PUBLIC_APP_URL` auf die eigene Domain aktualisieren
4. Redeploy

## 9. Optional: Self-Hosted / IONOS

Für Docker- oder IONOS-basiertes Deployment siehe:

- `DEPLOYMENT_IONOS.md`
- `README.md` → Abschnitt „Deployment“

---

## Checkliste

- [ ] PostgreSQL-Datenbank erstellt
- [ ] Environment Variables in Vercel gesetzt
- [ ] `NEXTAUTH_URL` ist die finale Live-URL
- [ ] `NEXTAUTH_SECRET` ist ein starkes, zufälliges Secret
- [ ] Erster Deploy erfolgreich
- [ ] `/api/health` liefert HTTP 200
- [ ] Erster Benutzer registriert und als `ADMIN` markiert
- [ ] iOS-App zeigt auf `https://<deine-url>`
