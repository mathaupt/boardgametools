# Vercel Deployment Setup

## Database Configuration Issue

The current deployment is failing because Vercel cannot access the SQLite database file (`file:./dev.db`). 

### Problem
```
PrismaClientInitializationError: Unable to open the database file
```

### Solution Options

## Option 1: Use External PostgreSQL Database

You have external PostgreSQL database variables available:

1. **Update Environment Variables in Vercel**
   ```
   # Use this external PostgreSQL URL:
   SQL_DATABASE_URL="your-external-postgres-connection-string"
   
   NEXTAUTH_URL="https://your-app.vercel.app"
   NEXTAUTH_SECRET="your-super-secret-key"
   BGG_API_URL="https://boardgamegeek.com/xmlapi2"
   BGG_AUTH_TOKEN="9303a540-4f7e-4eb9-bf74-ea99dc6ae652"
   ```

2. **Prisma Schema is already configured for PostgreSQL**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("SQL_DATABASE_URL")
   }
   ```

3. **Run Database Migration**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Option 2: Use Vercel PostgreSQL (Alternative)

If you prefer Vercel's managed PostgreSQL:

1. **Add PostgreSQL Database to Vercel**
   - Go to your Vercel project dashboard
   - Click "Storage" → "Create Database"
   - Select "PostgreSQL" and create database
   - Copy the connection string

2. **Update Environment Variables in Vercel**
   ```
   DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
   NEXTAUTH_URL="https://your-app.vercel.app"
   NEXTAUTH_SECRET="your-super-secret-key"
   BGG_API_URL="https://boardgamegeek.com/xmlapi2"
   BGG_AUTH_TOKEN="9303a540-4f7e-4eb9-bf74-ea99dc6ae652"
   ```

3. **Run Database Migration**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Option 2: Use Vercel KV (Redis) for Simple Storage

For a simpler setup, you could use Vercel KV for basic data storage, but this would require significant code changes.

## Option 3: Use External PostgreSQL

1. **Get External PostgreSQL** (Supabase, Neon, Railway)
2. **Update DATABASE_URL** in Vercel environment variables
3. **Update Prisma schema** to use PostgreSQL
4. **Run migrations**

## Migration Steps for PostgreSQL

1. **Update schema locally**
   ```bash
   # Edit prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Generate new migration**
   ```bash
   npx prisma migrate dev --name init-postgres
   ```

3. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "feat: switch to PostgreSQL for Vercel deployment"
   git push origin main
   ```

## Admin User Setup

After database migration, create admin user:

```sql
INSERT INTO "User" (
  "id", 
  "email", 
  "passwordHash", 
  "name", 
  "role", 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'admin-id',
  'soulsaver83@gmail.com',
  '$2a$12$hashed-password-here',
  'Admin User',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

Or use the admin creation script:
```bash
npx tsx src/lib/admin-create.ts
```

## Important Notes

- SQLite doesn't work on Vercel's serverless platform
- PostgreSQL is the recommended database for Vercel deployments
- Remember to update NEXTAUTH_URL to your Vercel domain
- Run migrations after database setup
- Test admin login after deployment

## Quick Fix for Testing

If you just want to test the UI without database functionality, you could temporarily mock the database calls, but this is not recommended for production.
