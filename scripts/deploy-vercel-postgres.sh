#!/bin/bash

# Vercel PostgreSQL Deployment Script

echo "🚀 Starting Vercel PostgreSQL Deployment..."

# 1. Create Vercel PostgreSQL database
echo "📦 Creating Vercel PostgreSQL database..."
vercel postgres create

# 2. Get the connection string
echo "🔗 Getting PostgreSQL connection string..."
POSTGRES_URL=$(vercel postgres url)

# 3. Set environment variable
echo "⚙️ Setting DATABASE_URL environment variable..."
vercel env add DATABASE_URL

# 4. Update Prisma schema to PostgreSQL
echo "🔄 Updating Prisma schema to PostgreSQL..."
sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 5. Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# 6. Deploy migration
echo "🗄️ Deploying database migration..."
npx prisma migrate deploy

# 7. Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Vercel PostgreSQL deployment complete!"
echo "🌍 Your app is now live with PostgreSQL database"
