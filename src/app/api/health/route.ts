import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Teste Datenbank-Verbindung
    await prisma.$queryRaw`SELECT 1`;
    
    // Prüfe ob Tabellen existieren
    const userCount = await prisma.user.count();
    const gameCount = await prisma.game.count();
    const sessionCount = await prisma.gameSession.count();
    
    // Prüfe Migration Status (SQLite-kompatibel)
    const migrations = await prisma.$queryRaw`
      SELECT migration_name as name, finished_at as migrated_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC
    ` as Array<{name: string, migrated_at: string}>;
    
    return NextResponse.json({
      status: "connected",
      database: {
        userCount,
        gameCount,
        sessionCount,
        migrations: migrations.map(m => ({
          name: m.name,
          migratedAt: m.migrated_at
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Database check failed:", error);
    return NextResponse.json(
      { 
        status: "error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
