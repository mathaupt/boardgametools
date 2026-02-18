# Vercel Database Setup Script

## SQLite Setup (Quick Start)

### 1. Environment Variable setzen
```bash
vercel env add DATABASE_URL
# Wert: file:./dev.db
```

### 2. Migration ausführen
```bash
# Deployment mit Migration
vercel --prod
```

## Vercel Postgres Setup (Production)

### 1. Postgres Datenbank erstellen
```bash
vercel postgres create
```

### 2. Connection String kopieren
```bash
vercel postgres url
```

### 3. Environment Variable setzen
```bash
vercel env add DATABASE_URL
# Wert: postgresql://user:password@host:5432/database
```

### 4. Migration deployen
```bash
# Prisma Schema anpassen (falls PostgreSQL)
# provider = "postgresql"

# Migration ausführen
npx prisma migrate deploy
```

## Database Initialization API
