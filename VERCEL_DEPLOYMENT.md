# Vercel Deployment Setup

## Environment Variables in Vercel

Im Vercel Dashboard unter Project Settings → Environment Variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key
BGG_API_URL=https://boardgamegeek.com/xmlapi2
BGG_AUTH_TOKEN=your-bgg-token
NODE_ENV=production
```

## Database Check APIs

Nach dem Deployment kannst du folgende Endpunkte aufrufen:

### 1. Health Check
```
GET https://your-app.vercel.app/api/health
```

Response Beispiel:
```json
{
  "status": "connected",
  "database": {
    "userCount": 1,
    "gameCount": 0,
    "sessionCount": 0,
    "migrations": [
      {
        "name": "001_initial_migration",
        "migratedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Environment Check
```
GET https://your-app.vercel.app/api/debug/env
```

Response Beispiel:
```json
{
  "environment": {
    "DATABASE_URL": "✅ Set",
    "NEXTAUTH_URL": "✅ Set",
    "NEXTAUTH_SECRET": "✅ Set",
    "BGG_API_URL": "✅ Set",
    "BGG_AUTH_TOKEN": "✅ Set",
    "NODE_ENV": "production"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Deployment Steps

### 1. Vorbereitung
```bash
# Lokal testen
npm run build
npm run start

# Health API testen
curl http://localhost:3000/api/health
```

### 2. Vercel Deployment
```bash
# Vercel CLI installieren
npm i -g vercel

# Deployen
vercel --prod
```

### 3. Post-Deployment Checks
```bash
# Health Check
curl https://your-app.vercel.app/api/health

# Environment Check  
curl https://your-app.vercel.app/api/debug/env

# Auth Test
curl https://your-app.vercel.app/api/auth/session
```

## Database Migration

Für PostgreSQL auf Vercel:

### 1. Vercel Postgres Setup
```bash
# Postgres Datenbank erstellen
vercel postgres create

# Connection String kopieren
vercel postgres pull
```

### 2. Migration ausführen
```bash
# Vercel Environment synchronisieren
vercel env pull .env

# Migration deployen
vercel env push

# Prisma Migration
npx prisma migrate deploy
```

## Troubleshooting

### Database Connection Failed
```bash
# Prisma Schema prüfen
npx prisma db pull

# Migration Status prüfen
npx prisma migrate status
```

### Environment Variables Missing
```bash
# Vercel Environment prüfen
vercel env ls

# Lokal synchronisieren
vercel env pull .env
```

### Build Errors
```bash
# Dependencies prüfen
npm ci

# TypeScript prüfen
npx tsc --noEmit

# Build Test
npm run build
```

## Monitoring

### Vercel Logs
```bash
# Live Logs ansehen
vercel logs

# Funktion Logs
vercel logs --filter=api/health
```

### Database Monitoring
- Vercel Postgres Dashboard
- Prisma Studio (lokal mit Vercel DB)
```bash
# Mit Vercel DB verbinden
vercel postgres shell
```
