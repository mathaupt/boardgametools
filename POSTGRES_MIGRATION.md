# PostgreSQL Migration Guide

## Schema Changes
The Prisma schema has been updated from SQLite to PostgreSQL.

## Key Differences
- **Provider**: `postgresql` instead of `sqlite`
- **Connection**: Uses PostgreSQL connection string
- **Features**: Full PostgreSQL support with proper types

## Migration Steps

### 1. Install Dependencies
```bash
npm install pg @types/pg
```

### 2. Update Environment Variables
```env
# Local Development (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/boardgametools"

# Vercel Production
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 3. Create Migration
```bash
# Generate migration for PostgreSQL
npx prisma migrate dev --name init_postgres

# Generate Prisma Client
npx prisma generate
```

### 4. Vercel Setup
```bash
# Create Vercel Postgres
vercel postgres create

# Get connection string
vercel postgres url

# Set environment variable
vercel env add DATABASE_URL
```

### 5. Deploy Migration
```bash
# Deploy migration to Vercel
npx prisma migrate deploy
```

## Database Connection Files
- `src/lib/db.ts` - SQLite connection (keep for local dev)
- `src/lib/db-postgres.ts` - PostgreSQL connection (for Vercel)

## Usage
Import the appropriate database client:
```typescript
// For Vercel/Production
import { prisma } from '@/lib/db-postgres';

// For Local Development  
import { prisma } from '@/lib/db';
```

## Testing
```bash
# Test local PostgreSQL connection
npm run dev

# Test Vercel deployment
vercel --prod
curl https://your-app.vercel.app/api/health
```
