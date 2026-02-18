# Vercel Deployment Setup

## Database Configuration Issue

The current deployment is failing because Vercel cannot access the SQLite database file (`file:./dev.db`). 

### Problem
```
PrismaClientKnownRequestError: The table `public.User` does not exist in the current database.
```

**Root Cause:** Database schema was not created/migrated in the PostgreSQL database.

### Solution Options

## Option 1: Use External PostgreSQL Database

You have external PostgreSQL database variables available:

### Step 1: Update Environment Variables in Vercel
```
# Use this external PostgreSQL URL:
SQL_DATABASE_URL="your-external-postgres-connection-string"

NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key"
BGG_API_URL="https://boardgamegeek.com/xmlapi2"
BGG_AUTH_TOKEN="9303a540-4f7e-4eb9-bf74-ea99dc6ae652"
```

### Step 2: Create Database Schema

**Option A: Manual SQL Execution**
1. Connect to your PostgreSQL database
2. Run the SQL from `prisma/migrations/init_postgres.sql`
3. This creates all tables (User, Game, Event, etc.)

**Option B: Prisma Migration (if you have local PostgreSQL)**
```bash
# Set your PostgreSQL connection locally
SQL_DATABASE_URL="postgresql://username:password@host:port/database"

# Generate and run migration
npx prisma migrate dev --name init-postgres
npx prisma generate
```

### Step 3: Verify Database Schema
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Should show: User, Game, GameSession, SessionPlayer, Group, GroupMember, Event, GameProposal, Vote, EventInvite
```

### Step 4: Create Admin User
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
  'admin-001',
  'soulsaver83@gmail.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFUpO', -- Admin123!
  'Admin User',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

### Step 5: Prisma Schema Configuration
```prisma
datasource db {
  provider = "postgresql"
  url      = env("SQL_DATABASE_URL")
}
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
   SQL_DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
   NEXTAUTH_URL="https://your-app.vercel.app"
   NEXTAUTH_SECRET="your-super-secret-key"
   BGG_API_URL="https://boardgamegeek.com/xmlapi2"
   BGG_AUTH_TOKEN="9303a540-4f7e-4eb9-bf74-ea99dc6ae652"
   ```

3. **Run Database Migration**
   ```bash
   npx prisma migrate dev --name init-postgres
   npx prisma generate
   ```

## Important: Schema Creation Required

**The database tables must be created before the application can work!**

- ✅ **Environment Variables** - SQL_DATABASE_URL configured
- ✅ **Prisma Schema** - PostgreSQL provider set
- ❌ **Database Tables** - Must be created via migration or manual SQL

## Quick Fix for Testing

If you need to test quickly, you can run the SQL manually:

1. **Connect to your PostgreSQL database**
2. **Execute the SQL file**: `prisma/migrations/init_postgres.sql`
3. **Create admin user** with the SQL above
4. **Test registration and login**

## Troubleshooting

### Error: "The table `public.User` does not exist"
**Solution:** Run the database migration or manual SQL to create tables.

### Error: "Invalid prisma.user.findUnique() invocation"
**Solution:** Ensure SQL_DATABASE_URL points to a valid PostgreSQL database with the schema created.

### Error: "Connection refused"
**Solution:** Check if the PostgreSQL database is accessible and credentials are correct.

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
