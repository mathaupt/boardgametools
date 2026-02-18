import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST() {
  try {
    // Prüfe ob DATABASE_URL gesetzt ist
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL environment variable is not set" },
        { status: 500 }
      );
    }

    // Führe Migration aus (falls nötig)
    try {
      await prisma.$executeRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    } catch (error) {
      // Bei SQLite Fehler, versuche Migration
      console.log("Attempting to initialize database...");
    }

    // Erstelle Test-Daten (falls Tabelle leer)
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      // Erstelle Test-User
      const { hash } = await import("bcryptjs");
      const hashedPassword = await hash("password123", 12);
      
      await prisma.user.create({
        data: {
          email: "test@example.com",
          passwordHash: hashedPassword,
          name: "Test User",
        },
      });

      return NextResponse.json({
        status: "initialized",
        message: "Database initialized with test user",
        testUser: {
          email: "test@example.com",
          password: "password123"
        }
      });
    }

    return NextResponse.json({
      status: "exists",
      message: "Database already initialized",
      userCount
    });

  } catch (error) {
    console.error("Database initialization failed:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Check DATABASE_URL and database permissions"
      },
      { status: 500 }
    );
  }
}
